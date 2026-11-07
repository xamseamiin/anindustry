import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resolveTelegramAccess } from '@/lib/telegram-access';

export const dynamic = 'force-dynamic';

function money(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : 0;
}

// GET: Fetch all unpaid customer sales and active accounts for Telegram Mini App
export async function GET(request: Request) {
  try {
    const initData = request.headers.get('x-telegram-init-data') || '';
    const access = await resolveTelegramAccess(initData);
    if (!access || !access.permissions.isActive || !(access.permissions.viewSales || access.permissions.viewReports || access.permissions.manageExpenses || access.permissions.isAdmin)) return NextResponse.json({ error: 'Fasax uma lihid inaad aragto daymaha.' }, { status: 403 });
    const companyId = process.env.TELEGRAM_COMPANY_ID || '';
    if (!companyId) return NextResponse.json({ error: 'Company is not configured.' }, { status: 500 });

    const searchParams = new URL(request.url).searchParams;
    const query = (searchParams.get('q') || '').trim().toLowerCase();

    // Fetch unpaid or partially paid sales
    const unpaidSales = await prisma.sale.findMany({
      where: {
        companyId,
        paymentStatus: { notIn: ['Paid', 'PAID', 'Refunded', 'REFUNDED'] }
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        account: { select: { id: true, name: true } },
        items: { select: { productName: true, quantity: true, unitPrice: true, total: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter valid debt records (> 0.01 ETB)
    const validReceivables = unpaidSales
      .map(s => {
        const total = money(s.total);
        const paid = money(s.paidAmount);
        const debt = money(total - paid);
        return {
          id: s.id,
          invoiceNumber: s.invoiceNumber,
          customerId: s.customer?.id || null,
          customerName: s.customer?.name || 'Walk-in Customer',
          customerPhone: s.customer?.phone || '',
          total,
          paidAmount: paid,
          debtAmount: debt,
          paymentStatus: s.paymentStatus,
          paymentMethod: s.paymentMethod,
          date: s.createdAt,
          itemsCount: s.items.length,
          itemNames: s.items.map(i => i.productName).filter(Boolean)
        };
      })
      .filter(s => s.debtAmount > 0.01);

    // Apply search if provided
    const filtered = query
      ? validReceivables.filter(r => 
          r.customerName.toLowerCase().includes(query) ||
          r.customerPhone.toLowerCase().includes(query) ||
          r.invoiceNumber.toLowerCase().includes(query)
        )
      : validReceivables;

    // Fetch active accounts for collection dropdown
    const accounts = await prisma.account.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true, type: true, balance: true, currency: true },
      orderBy: { balance: 'desc' }
    });

    const totalDebt = money(validReceivables.reduce((acc, curr) => acc + curr.debtAmount, 0));

    return NextResponse.json({
      success: true,
      receivables: filtered,
      accounts: accounts.map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: money(a.balance),
        currency: a.currency || 'ETB'
      })),
      summary: {
        totalDebt,
        count: validReceivables.length
      }
    });
  } catch (error: any) {
    console.error('Error fetching telegram receivables:', error);
    return NextResponse.json({ error: error.message || 'Error fetching receivables' }, { status: 500 });
  }
}

// POST: Collect customer debt payment (Full or Partial)
export async function POST(request: Request) {
  try {
    const initData = request.headers.get('x-telegram-init-data') || '';
    const access = await resolveTelegramAccess(initData);
    if (!access || !access.permissions.isActive || !(access.permissions.addSales || access.permissions.viewReports || access.permissions.manageExpenses || access.permissions.isAdmin)) return NextResponse.json({ error: 'Fasax uma lihid inaad deyn qabatid.' }, { status: 403 });

    const companyId = process.env.TELEGRAM_COMPANY_ID || '';
    const userId = process.env.TELEGRAM_USER_ID || String(access.identity.id);
    if (!companyId) return NextResponse.json({ error: 'Company is not configured.' }, { status: 500 });

    const body = await request.json();
    const { saleId, amountCollected, accountId, note, paymentDate } = body;
    const transactionDate = paymentDate ? new Date(`${String(paymentDate)}T12:00:00+03:00`) : new Date();
    if (Number.isNaN(transactionDate.getTime())) return NextResponse.json({ error: 'Taariikhda lacag-bixinta ma saxna.' }, { status: 400 });

    const collectionAmount = money(amountCollected);
    if (collectionAmount <= 0) {
      return NextResponse.json({ error: 'Qadarku waa inuu ka weynaadaa 0.' }, { status: 400 });
    }
    if (!accountId) {
      return NextResponse.json({ error: 'Fadlan dooro account-ka lacagta lagu shubay.' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch target sale
      const sale = await tx.sale.findFirst({
        where: { id: saleId, companyId },
        include: { customer: { select: { name: true, phone: true } } }
      });

      if (!sale) {
        throw new Error('Invoice-ka lama helin.');
      }

      const currentPaid = money(sale.paidAmount);
      const saleTotal = money(sale.total);
      const remainingDebt = money(saleTotal - currentPaid);

      if (collectionAmount > remainingDebt + 0.05) {
        throw new Error(`Lacagta aad bixinayso (${collectionAmount.toLocaleString()} ETB) waxay ka badan tahay deynta hadhay (${remainingDebt.toLocaleString()} ETB).`);
      }

      const newPaidAmount = money(currentPaid + collectionAmount);
      const isFullySettled = Math.abs(saleTotal - newPaidAmount) < 0.1;
      const newStatus = isFullySettled ? 'Paid' : 'Partial';

      // 2. Update Sale
      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: {
          paidAmount: newPaidAmount,
          paymentStatus: newStatus,
          accountId: accountId,
          // Sales History displays Sale.createdAt; keep it aligned with the
          // collection date selected by the user so the debt payment and its
          // ledger transaction show the same date.
          createdAt: transactionDate
        }
      });

      // 3. Deposit money into the selected account
      const updatedAccount = await tx.account.update({
        where: { id: accountId },
        data: {
          balance: { increment: collectionAmount }
        }
      });

      // 4. Create an income ledger transaction
      const customerName = sale.customer?.name || 'Walk-in Customer';
      const txn = await tx.transaction.create({
        data: {
          companyId,
          amount: collectionAmount,
          type: 'INCOME',
          description: `Deymoshub: #${sale.invoiceNumber} (${customerName})`,
          note: note ? String(note).slice(0, 500) : `Ururinta deynta invoice #${sale.invoiceNumber}`,
          transactionDate,
          accountId,
          userId
        }
      });

      return {
        updatedSale,
        accountName: updatedAccount.name,
        newAccountBalance: updatedAccount.balance,
        remainingDebt: Math.max(0, money(saleTotal - newPaidAmount)),
        isFullySettled
      };
    });

    return NextResponse.json({
      success: true,
      message: result.isFullySettled 
        ? `Deyntii #${result.updatedSale.invoiceNumber} si buuxda ayaa loo bixiyey! Account-ka ${result.accountName} ayaa lagu shubay.`
        : `Lacagta qaybta ah (${collectionAmount.toLocaleString()} ETB) waa la qabtay. Deynta hadhay: ${result.remainingDebt.toLocaleString()} ETB.`,
      result
    });
  } catch (error: any) {
    console.error('Error collecting debt in mini app:', error);
    return NextResponse.json({ error: error.message || 'Error collecting payment' }, { status: 500 });
  }
}
