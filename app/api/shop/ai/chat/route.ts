// app/api/shop/ai/chat/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { 
    processMessage, 
    formatSalesData, 
    formatCustomerData, 
    formatLowStock, 
    formatInventoryOverview, 
    formatEmployees, 
    formatAccounts, 
    formatSummary, 
    formatProductSearch, 
    formatTopCustomers, 
    formatExpenses, 
    formatDuplicateCustomers, 
    formatMergeResult,
    extractMergeParams
} from '@/lib/shopAiEngine';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

// Helper to calculate Levenshtein distance in API
function getLevenshtein(s1: string, s2: string): number {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix: number[][] = [];
    for (let i = 0; i <= len1; i++) matrix[i] = [i];
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[len1][len2];
}

// Case-insensitive/Somali phonetic name normalization for duplicates
function normalizeName(name: string): string {
    let normalized = name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (!normalized) return '';
    const words = normalized.split(' ').map(word => {
        if (word.startsWith('c')) word = word.substring(1);
        if (word.startsWith('o')) word = 'u' + word.substring(1);
        word = word.replace(/x/g, 'h');
        if (word.endsWith('o') && word.length > 2) {
            word = word.substring(0, word.length - 1) + 'a';
        }
        let collapsed = '';
        for (let i = 0; i < word.length; i++) {
            if (i === 0 || word[i] !== word[i - 1]) collapsed += word[i];
        }
        return collapsed;
    });
    return words.join(' ');
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true, fullName: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        const { message, sessionId } = await req.json();
        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // 1. Process message through offline AI Engine
        const engineResult = processMessage(message, user.fullName || 'User');
        const { dataQuery, queryParams, response: engineResponse } = engineResult;

        const encoder = new TextEncoder();

        // Prepare Streaming SSE response
        const stream = new ReadableStream({
            async start(controller) {
                const sendChunk = (data: any) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                };

                try {
                    // Send typing/acknowledgement state
                    sendChunk({ text: '', sessionId });

                    // Case A: Query requests database data
                    if (dataQuery) {
                        let finalResult: any = null;
                        const companyId = user.companyId!;

                        if (dataQuery === 'sales_today' || dataQuery === 'sales_yesterday' || dataQuery === 'sales_week' || dataQuery === 'sales_month') {
                            const now = new Date();
                            let startDate = new Date();
                            let period = 'today';

                            if (dataQuery === 'sales_today') {
                                startDate.setHours(0,0,0,0);
                            } else if (dataQuery === 'sales_yesterday') {
                                startDate.setDate(startDate.getDate() - 1);
                                startDate.setHours(0,0,0,0);
                                now.setDate(now.getDate() - 1);
                                now.setHours(23,59,59,999);
                                period = 'yesterday';
                            } else if (dataQuery === 'sales_week') {
                                startDate.setDate(startDate.getDate() - 7);
                                period = 'week';
                            } else {
                                startDate.setDate(startDate.getDate() - 30);
                                period = 'month';
                            }

                            const sales = await prisma.sale.findMany({
                                where: { companyId, createdAt: { gte: startDate, lte: now } },
                                include: { items: true }
                            });

                            let revenue = 0;
                            let cost = 0;
                            const productMap = new Map<string, { name: string; qty: number; revenue: number }>();

                            sales.forEach(s => {
                                revenue += s.total;
                                s.items.forEach(item => {
                                    cost += item.totalCost || 0;
                                    const prev = productMap.get(item.productId) || { name: item.productName, qty: 0, revenue: 0 };
                                    prev.qty += item.quantity;
                                    prev.revenue += item.total;
                                    productMap.set(item.productId, prev);
                                });
                            });

                            const topProducts = Array.from(productMap.values())
                                .sort((a, b) => b.revenue - a.revenue)
                                .slice(0, 5);

                            const formatted = formatSalesData({
                                period,
                                revenue,
                                cost,
                                profit: revenue - cost,
                                tax: 0,
                                count: sales.length,
                                topProducts
                            });

                            sendChunk({ text: formatted.text, done: true, executedTools: [{ name: 'query_sales', result: { success: true } }] });

                        } else if (dataQuery === 'customer_search') {
                            const name = queryParams?.name || '';
                            const customers = await prisma.customer.findMany({
                                where: {
                                    companyId,
                                    name: { contains: name, mode: 'insensitive' }
                                },
                                include: { sales: true }
                            });

                            const customerList = customers.map(c => {
                                let totalSales = 0;
                                let totalPaid = 0;
                                c.sales.forEach(s => {
                                    totalSales += s.total;
                                    totalPaid += s.paidAmount;
                                });
                                return {
                                    name: c.name,
                                    phone: c.phone || c.phoneNumber || '',
                                    totalSales,
                                    totalPaid,
                                    debt: totalSales - totalPaid
                                };
                            });

                            const formatted = formatCustomerData(customerList);
                            sendChunk({ text: formatted.text, done: true, executedTools: [{ name: 'get_customer', result: { success: true } }] });

                        } else if (dataQuery === 'low_stock') {
                            const materials = await prisma.factoryMaterial.findMany({
                                where: { companyId }
                            });
                            const lowStockList = materials
                                .filter(m => (m.inStock || 0) <= (m.minStock || 0))
                                .map(m => ({
                                    name: m.name,
                                    stock: m.inStock,
                                    minStock: m.minStock,
                                    category: m.category,
                                    sellingPrice: m.sellingPrice
                                }));

                            const formatted = formatLowStock(lowStockList);
                            sendChunk({ text: formatted.text, done: true, executedTools: [{ name: 'get_low_stock_products', result: { success: true } }] });

                        } else if (dataQuery === 'inventory_overview') {
                            const materials = await prisma.factoryMaterial.findMany({
                                where: { companyId }
                            });
                            const total = materials.length;
                            let totalValue = 0;
                            let totalCost = 0;
                            let lowStock = 0;
                            let outOfStock = 0;
                            const categories = new Set<string>();

                            materials.forEach(m => {
                                categories.add(m.category || 'Finished Goods');
                                const inStock = m.inStock || 0;
                                totalValue += inStock * Number(m.sellingPrice || 0);
                                totalCost += inStock * Number(m.purchasePrice || 0);
                                if (inStock === 0) outOfStock++;
                                else if (inStock <= (m.minStock || 0)) lowStock++;
                            });

                            const formatted = formatInventoryOverview({
                                total,
                                totalValue,
                                totalCost,
                                potentialProfit: totalValue - totalCost,
                                categories: Array.from(categories),
                                lowStock,
                                outOfStock
                            });

                            sendChunk({ text: formatted.text, done: true, executedTools: [{ name: 'get_inventory_overview', result: { success: true } }] });

                        } else if (dataQuery === 'employees_list') {
                            const employees = await prisma.employee.findMany({
                                where: { companyId }
                            });
                            let totalPayroll = 0;
                            employees.forEach(e => {
                                totalPayroll += Number(e.monthlySalary || 0);
                            });

                            const formatted = formatEmployees({
                                activeCount: employees.filter(e => e.isActive).length,
                                totalPayroll,
                                employees: employees.map(e => ({
                                    name: e.fullName,
                                    role: e.position,
                                    salary: Number(e.monthlySalary),
                                    isActive: e.isActive
                                }))
                            });

                            sendChunk({ text: formatted.text, done: true, executedTools: [{ name: 'get_employees', result: { success: true } }] });

                        } else if (dataQuery === 'accounts_overview') {
                            const accounts = await prisma.account.findMany({
                                where: { companyId }
                            });
                            const formatted = formatAccounts({
                                accounts: accounts.map(a => ({
                                    name: a.name,
                                    balance: Number(a.balance),
                                    currency: a.currency || 'ETB'
                                }))
                            });
                            sendChunk({ text: formatted.text, done: true, executedTools: [{ name: 'get_accounts', result: { success: true } }] });

                        } else if (dataQuery === 'summary') {
                            const sales = await prisma.sale.findMany({
                                where: { companyId }
                            });
                            const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
                            const materials = await prisma.factoryMaterial.findMany({
                                where: { companyId }
                            });
                            const lowStock = materials.filter(m => (m.inStock || 0) <= (m.minStock || 0)).length;

                            const formatted = formatSummary({
                                totalSales,
                                salesCount: sales.length,
                                productsCount: materials.length,
                                lowStockCount: lowStock
                            });
                            sendChunk({ text: formatted.text, done: true, executedTools: [{ name: 'get_summary', result: { success: true } }] });

                        } else if (dataQuery === 'product_search') {
                            const pName = queryParams?.productName || '';
                            const materials = await prisma.factoryMaterial.findMany({
                                where: {
                                    companyId,
                                    name: { contains: pName, mode: 'insensitive' }
                                }
                            });
                            const formatted = formatProductSearch(materials.map(m => ({
                                name: m.name,
                                sellingPrice: Number(m.sellingPrice),
                                costPrice: Number(m.purchasePrice),
                                stock: m.inStock,
                                status: m.inStock > 0 ? 'Waa diyaar' : 'Dhamaaday'
                            })));
                            sendChunk({ text: formatted.text, done: true, executedTools: [{ name: 'advanced_search', result: { success: true, results: materials } }] });

                        } else if (dataQuery === 'top_customers') {
                            const customers = await prisma.customer.findMany({
                                where: { companyId },
                                include: { sales: true },
                                take: 10
                            });

                            const list = customers.map(c => {
                                const totalSales = c.sales.reduce((sum, s) => sum + s.total, 0);
                                const totalPaid = c.sales.reduce((sum, s) => sum + s.paidAmount, 0);
                                return {
                                    name: c.name,
                                    totalSales,
                                    saleCount: c.sales.length,
                                    totalPaid
                                };
                            }).sort((a, b) => b.totalSales - a.totalSales);

                            const formatted = formatTopCustomers(list);
                            sendChunk({ text: formatted.text, done: true, executedTools: [{ name: 'get_top_customers', result: { success: true } }] });

                        } else if (dataQuery === 'expenses_overview') {
                            const startOfMonth = new Date();
                            startOfMonth.setDate(1);
                            startOfMonth.setHours(0,0,0,0);

                            const expenses = await prisma.expense.findMany({
                                where: { companyId, expenseDate: { gte: startOfMonth } }
                            });

                            const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
                            const byCategory: Record<string, number> = {};
                            expenses.forEach(e => {
                                byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
                            });

                            const formatted = formatExpenses({
                                total,
                                byCategory,
                                recent: expenses.slice(-5)
                            });

                            sendChunk({ text: formatted.text, done: true, executedTools: [{ name: 'get_expenses', result: { success: true } }] });

                        } else if (dataQuery === 'duplicate_customers') {
                            // Find duplicate customer names in company
                            const customers = await prisma.customer.findMany({
                                where: { companyId }
                            });

                            const checked = new Set<string>();
                            const duplicateGroups: any[] = [];

                            for (let i = 0; i < customers.length; i++) {
                                const c1 = customers[i];
                                if (checked.has(c1.id)) continue;

                                const n1 = normalizeName(c1.name);
                                if (!n1) continue;

                                const currentGroup: string[] = [c1.name];
                                checked.add(c1.id);

                                for (let j = i + 1; j < customers.length; j++) {
                                    const c2 = customers[j];
                                    if (checked.has(c2.id)) continue;

                                    const n2 = normalizeName(c2.name);
                                    if (!n2) continue;

                                    // Direct match or high Levenshtein similarity
                                    let isMatch = n1 === n2;
                                    if (!isMatch) {
                                        const maxLen = Math.max(n1.length, n2.length);
                                        if (maxLen > 0) {
                                            const dist = getLevenshtein(n1, n2);
                                            isMatch = (1 - dist / maxLen) >= 0.85;
                                        }
                                    }

                                    if (isMatch) {
                                        currentGroup.push(c2.name);
                                        checked.add(c2.id);
                                    }
                                }

                                if (currentGroup.length > 1) {
                                    duplicateGroups.push({ names: currentGroup });
                                }
                            }

                            const formatted = formatDuplicateCustomers(duplicateGroups);
                            sendChunk({ text: formatted.text, done: true, executedTools: [{ name: 'scan_duplicates', result: { success: true, groups: duplicateGroups } }] });

                        } else if (dataQuery === 'merge_customers') {
                            // Merge two duplicate customers
                            const sourceName = queryParams?.sourceName || '';
                            const destName = queryParams?.destName || '';

                            if (!sourceName || !destName) {
                                const formatted = formatMergeResult({ error: 'Magacyada macaamiisha oo saxan lama bixin.' });
                                sendChunk({ text: formatted.text, done: true, executedTools: [{ name: 'merge_customers', result: { success: false } }] });
                                controller.close();
                                return;
                            }

                            // Query DB
                            const sourceCust = await prisma.customer.findFirst({
                                where: { companyId, name: { equals: sourceName, mode: 'insensitive' } }
                            });
                            const destCust = await prisma.customer.findFirst({
                                where: { companyId, name: { equals: destName, mode: 'insensitive' } }
                            });

                            if (!sourceCust || !destCust) {
                                const formatted = formatMergeResult({ error: `Lama helo macmiil ${!sourceCust ? sourceName : destName}` });
                                sendChunk({ text: formatted.text, done: true, executedTools: [{ name: 'merge_customers', result: { success: false } }] });
                                controller.close();
                                return;
                            }

                            let salesCount = 0;
                            // Run merge inside transaction
                            await prisma.$transaction(async (tx) => {
                                // 1. Update sales
                                const updatedSales = await tx.sale.updateMany({
                                    where: { customerId: sourceCust.id },
                                    data: { customerId: destCust.id }
                                });
                                salesCount = updatedSales.count;

                                // 2. Update ledger transactions
                                await tx.transaction.updateMany({
                                    where: { customerId: sourceCust.id },
                                    data: { customerId: destCust.id }
                                });

                                // 3. Delete source customer
                                await tx.customer.delete({
                                    where: { id: sourceCust.id }
                                });
                            });

                            const formatted = formatMergeResult({
                                success: true,
                                sourceName: sourceCust.name,
                                destName: destCust.name,
                                salesCount
                            });

                            sendChunk({ text: formatted.text, done: true, executedTools: [{ name: 'create_customer', result: { success: true, message: `Successfully merged ${sourceCust.name} into ${destCust.name}` } }] });
                        }

                    // Case B: Static rule-based conversational response
                    } else if (engineResponse && engineResponse.text !== 'unknown' && engineResult.response.text !== buildUnknown(message).text) {
                        sendChunk({ text: engineResponse.text, done: true, executedTools: [] });

                    // Case C: Conversational Fallback → Call Gemini API in Somali
                    } else {
                        const apiKey = process.env.GEMINI_API_KEY;
                        if (!apiKey) {
                            sendChunk({ text: '⚠️ Gemini API key lagama helin .env', done: true, executedTools: [] });
                            controller.close();
                            return;
                        }

                        const genAI = new GoogleGenerativeAI(apiKey);
                        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

                        const systemPrompt = `Waxaad tahay Revlo AI, oo ah khabiir dhanka xisaabaadka iyo caawiyaha maamulka ee warshada AN-Industory ee Jigjiga.
Macaamiishu waxay kuula hadlayaan luuqada Soomaaliga. Ugu jawaab Soomaali qurxoon, kooban, oo waxtar leh.
Haddii lagaa weydiiyo xisaab, dakhli, ama inventory, u sheeg inuu toos kuu weydiin karo tusaale ahaan: "Maanta iibkii siduu ahaa?" ama "Alaabta dhamaanaysa ii sheeg" si aad xogta toos ugu soo saarto.
Ka jawaab fariintan soo socota:`;

                        const chatResult = await model.generateContent({
                            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nFariinta: ${message}` }] }]
                        });

                        const text = chatResult.response.text();
                        sendChunk({ text, done: true, executedTools: [] });
                    }

                } catch (err: any) {
                    console.error('AI Stream Error:', err);
                    sendChunk({ error: err.message || 'Khalad ayaa dhacay server-ka.' });
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            }
        });

    } catch (error: any) {
        console.error('Error in AI Chat Route:', error);
        return NextResponse.json({ error: 'Failed to process AI chat: ' + error.message }, { status: 500 });
    }
}

// Fallback buildUnknown helper
function buildUnknown(input: string) {
    return { text: "Su'aashaada uma garanayo. Isku day:\n  \"Maanta iibkii?\"\n  \"Sidee baan iib u sameeyaa?\"\n  \"Alaabta dhamaanaysa?\"\n\nAma dhig \"caawin\"." };
}
