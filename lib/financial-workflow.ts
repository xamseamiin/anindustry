import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

export const EXPENSE_STATES = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  AWAITING_RECEIPT: 'AWAITING_RECEIPT',
  RECEIPT_UNDER_REVIEW: 'RECEIPT_UNDER_REVIEW',
  PAID: 'PAID',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  RECEIPT_MISMATCH: 'RECEIPT_MISMATCH',
  REFUNDED: 'REFUNDED'
} as const;

export type ExpenseState = typeof EXPENSE_STATES[keyof typeof EXPENSE_STATES];

const ALLOWED_TRANSITIONS: Record<ExpenseState, ExpenseState[]> = {
  DRAFT: ['PENDING_APPROVAL', 'AWAITING_RECEIPT', 'INSUFFICIENT_FUNDS', 'CANCELLED'],
  PENDING_APPROVAL: ['APPROVED', 'AWAITING_RECEIPT', 'REJECTED', 'CANCELLED', 'INSUFFICIENT_FUNDS'],
  APPROVED: ['AWAITING_RECEIPT', 'INSUFFICIENT_FUNDS', 'CANCELLED'],
  AWAITING_RECEIPT: ['RECEIPT_UNDER_REVIEW', 'INSUFFICIENT_FUNDS', 'CANCELLED'],
  RECEIPT_UNDER_REVIEW: ['PAID', 'RECEIPT_MISMATCH', 'CANCELLED'],
  PAID: ['REFUNDED'],
  REJECTED: [],
  CANCELLED: [],
  INSUFFICIENT_FUNDS: ['PENDING_APPROVAL', 'APPROVED', 'AWAITING_RECEIPT', 'CANCELLED'],
  RECEIPT_MISMATCH: ['RECEIPT_UNDER_REVIEW', 'CANCELLED'],
  REFUNDED: []
};

type Actor = {
  id?: string | null;
  name?: string | null;
  source: 'MINI_APP' | 'TELEGRAM' | 'DASHBOARD' | 'SYSTEM';
  ipAddress?: string | null;
  userAgent?: string | null;
};

const jsonSafe = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;

export function makeIdempotencyKey(scope: string, parts: Array<string | number | null | undefined>) {
  return `${scope}:${crypto.createHash('sha256').update(parts.map(v => String(v ?? '')).join('|')).digest('hex')}`;
}

export async function getAccountAvailability(accountId: string) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) throw new Error('Koontada lama helin.');
  return {
    balance: Number(account.balance),
    reserved: Number(account.reservedBalance),
    available: Number(account.balance) - Number(account.reservedBalance)
  };
}

export async function reserveExpenseFunds(expenseId: string, actor: Actor) {
  const outcome = await prisma.$transaction(async tx => {
    const expense = await tx.expense.findUnique({ where: { id: expenseId }, include: { account: true } });
    if (!expense || !expense.accountId || !expense.account) throw new Error('Expense ama account lama helin.');

    const existing = await tx.accountReservation.findUnique({ where: { expenseId } });
    if (existing?.status === 'ACTIVE') return { insufficient: false as const, reservation: existing };

    const available = Number(expense.account.balance) - Number(expense.account.reservedBalance);
    const amount = Number(expense.amount);
    if (amount > available) {
      return { insufficient: true as const, available, amount, companyId: expense.companyId };
    }

    const reservation = existing
      ? await tx.accountReservation.update({
          where: { id: existing.id },
          data: { amount: expense.amount, status: 'ACTIVE', releasedAt: null, consumedAt: null }
        })
      : await tx.accountReservation.create({
          data: { companyId: expense.companyId, accountId: expense.accountId, expenseId, amount: expense.amount }
        });

    await tx.account.update({
      where: { id: expense.accountId },
      data: { reservedBalance: { increment: amount } }
    });
    await tx.expense.update({ where: { id: expenseId }, data: { reservedAmount: expense.amount } });
    await tx.financialAuditEvent.create({
      data: {
        companyId: expense.companyId,
        actorId: actor.id || null,
        actorName: actor.name || null,
        actorSource: actor.source,
        action: 'FUNDS_RESERVED',
        entity: 'Expense',
        entityId: expenseId,
        after: jsonSafe({ amount, availableBefore: available })
      }
    });
    return { insufficient: false as const, reservation };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  if (outcome.insufficient) {
    await prisma.expense.update({
      where: { id: expenseId },
      data: { workflowStatus: EXPENSE_STATES.INSUFFICIENT_FUNDS, paymentStatus: EXPENSE_STATES.INSUFFICIENT_FUNDS, version: { increment: 1 } }
    });
    await prisma.financialAuditEvent.create({
      data: {
        companyId: outcome.companyId,
        actorId: actor.id || null,
        actorName: actor.name || null,
        actorSource: actor.source,
        action: 'INSUFFICIENT_FUNDS',
        entity: 'Expense',
        entityId: expenseId,
        after: jsonSafe({ available: outcome.available, requested: outcome.amount })
      }
    });
    throw new Error(`Haraaga la isticmaali karo waa ${outcome.available.toLocaleString()} ETB; waxaa loo baahan yahay ${outcome.amount.toLocaleString()} ETB.`);
  }
  return outcome.reservation;
}

export async function releaseExpenseReservation(expenseId: string, actor: Actor, status = 'RELEASED') {
  return prisma.$transaction(async tx => {
    const reservation = await tx.accountReservation.findUnique({ where: { expenseId } });
    const expense = await tx.expense.findUnique({ where: { id: expenseId } });
    if (!reservation || !expense || reservation.status !== 'ACTIVE') return null;
    await tx.account.update({
      where: { id: reservation.accountId },
      data: { reservedBalance: { decrement: Number(reservation.amount) } }
    });
    const updated = await tx.accountReservation.update({
      where: { id: reservation.id },
      data: { status, releasedAt: new Date() }
    });
    await tx.expense.update({ where: { id: expenseId }, data: { reservedAmount: 0 } });
    await tx.financialAuditEvent.create({
      data: {
        companyId: expense.companyId,
        actorId: actor.id || null,
        actorName: actor.name || null,
        actorSource: actor.source,
        action: 'RESERVATION_RELEASED',
        entity: 'Expense',
        entityId: expenseId,
        after: jsonSafe({ amount: Number(reservation.amount), status })
      }
    });
    return updated;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function transitionExpense(expenseId: string, next: ExpenseState, actor: Actor, metadata?: unknown) {
  return prisma.$transaction(async tx => {
    const expense = await tx.expense.findUnique({ where: { id: expenseId } });
    if (!expense) throw new Error('Expense lama helin.');
    const current = (expense.workflowStatus || EXPENSE_STATES.DRAFT) as ExpenseState;
    if (current !== next && !ALLOWED_TRANSITIONS[current]?.includes(next)) {
      throw new Error(`Status-ka ${current} looma beddeli karo ${next}.`);
    }
    if (next === EXPENSE_STATES.PAID && !expense.receiptUrl) {
      throw new Error('Expense receipt la’aan PAID ma noqon karo.');
    }
    const updated = await tx.expense.update({
      where: { id: expenseId },
      data: {
        workflowStatus: next,
        version: { increment: 1 },
        approved: ([EXPENSE_STATES.APPROVED, EXPENSE_STATES.AWAITING_RECEIPT, EXPENSE_STATES.RECEIPT_UNDER_REVIEW, EXPENSE_STATES.PAID] as ExpenseState[]).includes(next),
        paymentStatus: next === EXPENSE_STATES.PAID ? 'PAID' : next
      }
    });
    await tx.financialAuditEvent.create({
      data: {
        companyId: expense.companyId,
        actorId: actor.id || null,
        actorName: actor.name || null,
        actorSource: actor.source,
        action: 'STATUS_CHANGED',
        entity: 'Expense',
        entityId: expenseId,
        before: jsonSafe({ workflowStatus: current }),
        after: jsonSafe({ workflowStatus: next, metadata })
      }
    });
    return updated;
  });
}

export async function finalizeExpensePayment(input: {
  expenseId: string;
  receiptUrl: string;
  receiptTransactionId?: string | null;
  idempotencyKey: string;
  actor: Actor;
}) {
  return prisma.$transaction(async tx => {
    const existingOperation = await tx.idempotencyRecord.findUnique({ where: { key: input.idempotencyKey } });
    if (existingOperation?.status === 'COMPLETED') return existingOperation.response;

    const expense = await tx.expense.findUnique({
      where: { id: input.expenseId },
      include: { account: true, transactions: { where: { type: 'EXPENSE' } } }
    });
    if (!expense || !expense.accountId || !expense.account) throw new Error('Expense ama account lama helin.');
    if (expense.transactions.length > 1) throw new Error('Expense-kan wuxuu leeyahay transactions isku noqnoqday; reconciliation ayaa loo baahan yahay.');

    if (expense.transactions.length === 1 && expense.workflowStatus === EXPENSE_STATES.PAID) {
      const response = jsonSafe({ expenseId: expense.id, transactionId: expense.transactions[0].id, alreadyCompleted: true });
      await tx.idempotencyRecord.upsert({
        where: { key: input.idempotencyKey },
        create: { key: input.idempotencyKey, scope: 'EXPENSE_PAYMENT', companyId: expense.companyId, status: 'COMPLETED', response },
        update: { status: 'COMPLETED', response }
      });
      return response;
    }

    const amount = Number(expense.amount);
    const balanceBefore = Number(expense.account.balance);
    if (amount > balanceBefore) {
      await tx.expense.update({ where: { id: expense.id }, data: { workflowStatus: EXPENSE_STATES.INSUFFICIENT_FUNDS } });
      throw new Error(`Koontada waxaa ku jira ${balanceBefore.toLocaleString()} ETB; waxaa loo baahan yahay ${amount.toLocaleString()} ETB.`);
    }

    const transaction = expense.transactions[0]
      ? await tx.transaction.update({
          where: { id: expense.transactions[0].id },
          data: { receiptUrl: input.receiptUrl, idempotencyKey: input.idempotencyKey }
        })
      : await tx.transaction.create({
          data: {
            companyId: expense.companyId,
            userId: expense.userId,
            description: expense.description,
            amount: expense.amount,
            type: 'EXPENSE',
            accountId: expense.accountId,
            expenseId: expense.id,
            employeeId: expense.employeeId,
            receiptUrl: input.receiptUrl,
            idempotencyKey: input.idempotencyKey,
            balanceBefore,
            balanceAfter: balanceBefore - amount
          }
        });

    if (!expense.transactions.length) {
      await tx.account.update({
        where: { id: expense.accountId },
        data: {
          balance: { decrement: amount },
          reservedBalance: { decrement: Math.min(Number(expense.reservedAmount), amount) }
        }
      });
    }

    await tx.accountReservation.updateMany({
      where: { expenseId: expense.id, status: 'ACTIVE' },
      data: { status: 'CONSUMED', consumedAt: new Date() }
    });
    await tx.expense.update({
      where: { id: expense.id },
      data: {
        receiptUrl: input.receiptUrl,
        receiptTransactionId: input.receiptTransactionId || null,
        workflowStatus: EXPENSE_STATES.PAID,
        paymentStatus: 'PAID',
        approved: true,
        paymentDate: new Date(),
        reservedAmount: 0,
        version: { increment: 1 }
      }
    });
    const response = jsonSafe({ expenseId: expense.id, transactionId: transaction.id, balanceBefore, balanceAfter: balanceBefore - amount });
    await tx.idempotencyRecord.upsert({
      where: { key: input.idempotencyKey },
      create: { key: input.idempotencyKey, scope: 'EXPENSE_PAYMENT', companyId: expense.companyId, status: 'COMPLETED', response },
      update: { status: 'COMPLETED', response }
    });
    await tx.financialAuditEvent.create({
      data: {
        companyId: expense.companyId,
        actorId: input.actor.id || null,
        actorName: input.actor.name || null,
        actorSource: input.actor.source,
        action: 'EXPENSE_PAID',
        entity: 'Expense',
        entityId: expense.id,
        after: response
      }
    });
    return response;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
