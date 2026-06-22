// app/api/manufacturing/sales/bulk/route.ts - AN-Industory Optimized Bulk Sales Engine
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function parseBulkDate(dateStr: string | undefined | null): Date {
    if (!dateStr) return new Date();
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) return parsed;

    // If parsing failed, try manual extraction for DD/MM/YYYY or MM/DD/YYYY
    const parts = dateStr.split(/[\/\-\.]/);
    if (parts.length === 3) {
        let p0 = parseInt(parts[0], 10);
        let p1 = parseInt(parts[1], 10);
        let yearStr = parts[2].trim();
        if (yearStr.length === 2) yearStr = '20' + yearStr;
        let year = parseInt(yearStr, 10);

        if (!isNaN(p0) && !isNaN(p1) && !isNaN(year)) {
            let month = p0;
            let day = p1;
            if (p0 > 12 && p1 <= 12) {
                day = p0;
                month = p1;
            }
            const d = new Date(year, month - 1, day);
            if (!isNaN(d.getTime())) return d;
        }
    }
    return new Date(); // Fallback
}

function cleanAndParseFloat(val: any): number {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const cleanStr = String(val).replace(/,/g, '').trim();
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
}

function normalizeCustomerName(name: string): string {
    // 1. Lowercase and remove all special characters except spaces
    let normalized = name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    if (!normalized) return '';

    // 2. Somali phonetic & transliteration normalizations
    const words = normalized.split(' ').map(word => {
        // Drop 'c' at the start of words (e.g. cabdi -> abdi, cali -> ali, cumar -> umar)
        if (word.startsWith('c')) {
            word = word.substring(1);
        }
        
        // Normalize 'o' at the start of words to 'u' (e.g. omar -> umar, osman -> usman)
        if (word.startsWith('o')) {
            word = 'u' + word.substring(1);
        }

        // Replace 'x' with 'h' (e.g. xasan -> hasan, xuseen -> huseen, maxamed -> mahamed)
        word = word.replace(/x/g, 'h');

        // Normalize ending 'o' to 'a' (e.g. caasho -> asha, xaliimo -> halima, khadro -> khadra)
        if (word.endsWith('o') && word.length > 2) {
            word = word.substring(0, word.length - 1) + 'a';
        }

        // Collapse duplicate letters (vowels and consonants, e.g. aa -> a, ss -> s, ll -> l)
        let collapsed = '';
        for (let i = 0; i < word.length; i++) {
            if (i === 0 || word[i] !== word[i - 1]) {
                collapsed += word[i];
            }
        }
        return collapsed;
    });

    return words.join(' ');
}

function levenshteinDistance(s1: string, s2: string): number {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

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

function findSmartMatch(customerName: string, customerList: any[]): any {
    const targetName = customerName.trim();
    if (!targetName) return null;

    const normalizedTarget = normalizeCustomerName(targetName);
    if (!normalizedTarget) return null;

    const targetTokens = normalizedTarget.split(' ').filter(Boolean);

    let bestMatch = null;
    let highestSimilarity = 0;

    for (const customer of customerList) {
        const candidateName = customer.name.trim();
        const normalizedCandidate = normalizeCustomerName(candidateName);
        if (!normalizedCandidate) continue;

        // 1. Direct normalized match
        if (normalizedTarget === normalizedCandidate) {
            return customer;
        }

        const candidateTokens = normalizedCandidate.split(' ').filter(Boolean);

        // 2. Token-subset matching (Layer 2)
        // If both names have at least 2 words, and one name is a subset of the other
        if (targetTokens.length >= 2 && candidateTokens.length >= 2) {
            const shorter = targetTokens.length < candidateTokens.length ? targetTokens : candidateTokens;
            const longer = targetTokens.length < candidateTokens.length ? candidateTokens : targetTokens;

            let matchedWords = 0;
            for (const sWord of shorter) {
                let foundMatch = false;
                for (const lWord of longer) {
                    if (sWord === lWord) {
                        foundMatch = true;
                        break;
                    }
                    const maxWordLen = Math.max(sWord.length, lWord.length);
                    if (maxWordLen > 0) {
                        const dist = levenshteinDistance(sWord, lWord);
                        const wordSim = 1 - dist / maxWordLen;
                        if (wordSim >= 0.85) {
                            foundMatch = true;
                            break;
                        }
                    }
                }
                if (foundMatch) {
                    matchedWords++;
                }
            }

            if (matchedWords === shorter.length) {
                return customer;
            }
        }

        // 3. String similarity match (Layer 1)
        const len1 = normalizedTarget.length;
        const len2 = normalizedCandidate.length;
        if (Math.abs(len1 - len2) > 4) continue;

        const maxLen = Math.max(len1, len2);
        if (maxLen === 0) continue;

        const distance = levenshteinDistance(normalizedTarget, normalizedCandidate);
        const similarity = 1 - distance / maxLen;

        if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            bestMatch = customer;
        }
    }

    if (highestSimilarity >= 0.85) {
        return bestMatch;
    }

    return null;
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        const body = await req.json();
        const { sales, accountId } = body;

        if (!sales || !Array.isArray(sales) || sales.length === 0) {
            return NextResponse.json({ error: 'No sales data provided' }, { status: 400 });
        }

        if (accountId) {
            const accountExists = await prisma.account.findUnique({
                where: { id: accountId }
            });
            if (!accountExists) {
                return NextResponse.json({ error: 'Deposit account not found' }, { status: 400 });
            }
        }

        // Execute all sales atomically with an extended timeout to avoid transaction crashes
        const results = await prisma.$transaction(async (tx) => {
            // 1. Preload master data to avoid query loops
            const allCustomers = await tx.customer.findMany({
                where: { companyId: user.companyId }
            });

            const closedPeriods = await tx.financialPeriod.findMany({
                where: { companyId: user.companyId, isClosed: true }
            });

            // 2. Provision 1L and 0.5L products if not present
            let material1L = await tx.factoryMaterial.findFirst({
                where: {
                    companyId: user.companyId,
                    category: 'Finished Goods',
                    OR: [
                        { name: { equals: '1L', mode: 'insensitive' } },
                        { name: { contains: '1L', mode: 'insensitive' } },
                        { name: { contains: '1 Litre', mode: 'insensitive' } },
                        { name: { contains: '1-L', mode: 'insensitive' } }
                    ]
                }
            });
            if (!material1L) {
                material1L = await tx.factoryMaterial.create({
                    data: {
                        companyId: user.companyId,
                        userId: session.user.id,
                        name: '1L',
                        sku: `FG-1L-${Math.random().toString(36).substring(7).toUpperCase()}`,
                        category: 'Finished Goods',
                        unit: 'pcs',
                        inStock: 0,
                        minStock: 10,
                        purchasePrice: 12,
                        sellingPrice: 20
                    }
                });
            }

            let material05L = await tx.factoryMaterial.findFirst({
                where: {
                    companyId: user.companyId,
                    category: 'Finished Goods',
                    OR: [
                        { name: { equals: '0.5L', mode: 'insensitive' } },
                        { name: { contains: '0.5L', mode: 'insensitive' } },
                        { name: { contains: '0.5 Litre', mode: 'insensitive' } },
                        { name: { contains: '500ml', mode: 'insensitive' } },
                        { name: { contains: '0.5-L', mode: 'insensitive' } }
                    ]
                }
            });
            if (!material05L) {
                material05L = await tx.factoryMaterial.create({
                    data: {
                        companyId: user.companyId,
                        userId: session.user.id,
                        name: '0.5L',
                        sku: `FG-05L-${Math.random().toString(36).substring(7).toUpperCase()}`,
                        category: 'Finished Goods',
                        unit: 'pcs',
                        inStock: 0,
                        minStock: 10,
                        purchasePrice: 8,
                        sellingPrice: 15
                    }
                });
            }

            const salesToCreate: any[] = [];
            const saleItemsToCreate: any[] = [];
            const transactionsToCreate: any[] = [];

            let totalQty1L = 0;
            let totalQty05L = 0;
            let totalPaidAmount = 0;

            let counter = 0;
            for (const item of sales) {
                counter++;
                const customerName = (item.customerName || 'Walk-in Customer').trim();
                const date = parseBulkDate(item.date);
                const qty1L = Math.round(cleanAndParseFloat(item.qty1L));
                const price1L = cleanAndParseFloat(item.price1L) || 20;
                const qty05L = Math.round(cleanAndParseFloat(item.qty05L));
                const price05L = cleanAndParseFloat(item.price05L) || 15;
                const paidAmount = cleanAndParseFloat(item.paidAmount);

                const total1L = qty1L * price1L;
                const total05L = qty05L * price05L;
                const grandTotal = total1L + total05L;

                if (grandTotal <= 0) continue; // Skip empty rows

                // Check for Closed Fiscal Period in-memory
                const closedPeriod = closedPeriods.find(p => date >= new Date(p.startDate) && date <= new Date(p.endDate));
                if (closedPeriod) {
                    throw new Error(`Muddada maaliyadeed ee ${closedPeriod.name} waa mid xiran. Iib cusub laguma kordhin karo mudadadaan.`);
                }

                // Find or register Customer using smart fuzzy match
                let customer = findSmartMatch(customerName, allCustomers);
                if (!customer) {
                    try {
                        customer = await tx.customer.create({
                            data: {
                                name: customerName,
                                companyId: user.companyId,
                                userId: session.user.id,
                                phone: '',
                                address: ''
                            }
                        });
                        allCustomers.push(customer);
                    } catch (dbErr: any) {
                        // Case-insensitive unique constraint fallback
                        if (dbErr.code === 'P2002') {
                            const existing = await tx.customer.findFirst({
                                where: {
                                    name: { equals: customerName, mode: 'insensitive' },
                                    companyId: user.companyId
                                }
                            });
                            if (existing) {
                                customer = existing;
                                allCustomers.push(customer);
                            } else {
                                throw dbErr;
                            }
                        } else {
                            throw dbErr;
                        }
                    }
                }

                const paymentStatus = paidAmount >= grandTotal ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Unpaid';
                const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
                const invoiceNumber = `AN-${Date.now().toString().slice(-4)}${counter.toString().padStart(3, '0')}-${randomSuffix}`;
                const saleId = crypto.randomUUID();

                salesToCreate.push({
                    id: saleId,
                    invoiceNumber,
                    userId: session.user.id,
                    companyId: user.companyId,
                    customerId: customer.id,
                    accountId: accountId || null,
                    subtotal: grandTotal,
                    tax: 0,
                    total: grandTotal,
                    paidAmount,
                    paymentStatus,
                    status: 'Completed',
                    createdAt: date,
                    updatedAt: new Date()
                });

                if (qty1L > 0) {
                    saleItemsToCreate.push({
                        id: crypto.randomUUID(),
                        saleId,
                        productId: material1L.id,
                        productName: '1L',
                        quantity: qty1L,
                        unitPrice: price1L,
                        total: total1L,
                        costPrice: Number(material1L.purchasePrice),
                        totalCost: Number(material1L.purchasePrice) * qty1L,
                        createdAt: date
                    });
                    totalQty1L += qty1L;
                }

                if (qty05L > 0) {
                    saleItemsToCreate.push({
                        id: crypto.randomUUID(),
                        saleId,
                        productId: material05L.id,
                        productName: '0.5L',
                        quantity: qty05L,
                        unitPrice: price05L,
                        total: total05L,
                        costPrice: Number(material05L.purchasePrice),
                        totalCost: Number(material05L.purchasePrice) * qty05L,
                        createdAt: date
                    });
                    totalQty05L += qty05L;
                }

                if (accountId && paidAmount > 0) {
                    transactionsToCreate.push({
                        id: crypto.randomUUID(),
                        description: `Iibka (Bulk): #${invoiceNumber} - ${customerName}`,
                        amount: paidAmount,
                        type: 'INCOME',
                        accountId: accountId,
                        companyId: user.companyId,
                        userId: session.user.id,
                        customerId: customer.id,
                        transactionDate: date,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                    totalPaidAmount += paidAmount;
                }
            }

            // Execute batch inserts
            if (salesToCreate.length > 0) {
                await tx.sale.createMany({ data: salesToCreate });
            }
            if (saleItemsToCreate.length > 0) {
                await tx.saleItem.createMany({ data: saleItemsToCreate });
            }
            if (transactionsToCreate.length > 0) {
                await tx.transaction.createMany({ data: transactionsToCreate });
            }

            // Deduct Inventory Stock (aggregated)
            if (totalQty1L > 0) {
                await tx.factoryMaterial.update({
                    where: { id: material1L.id },
                    data: { inStock: { decrement: totalQty1L } }
                });
            }
            if (totalQty05L > 0) {
                await tx.factoryMaterial.update({
                    where: { id: material05L.id },
                    data: { inStock: { decrement: totalQty05L } }
                });
            }

            // Update Bank Account Balance (aggregated)
            if (accountId && totalPaidAmount > 0) {
                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { increment: totalPaidAmount } }
                });
            }

            return salesToCreate;
        }, {
            maxWait: 30000,
            timeout: 120000 // Extended to 2 minutes for massive excel sheets
        });

        // Audit the bulk operation
        await logAudit({
            action: 'CREATE_SALE_BULK',
            entity: 'Sale',
            entityId: session.user.id,
            details: `Successfully processed ${results.length} sales in bulk using batch operations.`,
            userId: session.user.id,
            companyId: user.companyId,
            userAgent: req.headers.get('user-agent') || undefined
        });

        return NextResponse.json({ success: true, count: results.length });
    } catch (error: any) {
        console.error('Error creating bulk sales:', error);
        return NextResponse.json({ error: 'Failed to create bulk sales: ' + error.message }, { status: 500 });
    }
}
