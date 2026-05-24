'use client';

/**
 * Lightweight client-side event helpers so different pages (Projects, Expenses, etc.)
 * can stay in sync without a dedicated realtime backend connection.
 */
const EXPENSE_CHANGE_EVENT = 'revlo:expense-change';
let expenseChannel: BroadcastChannel | null = null;

export type ExpenseChangePayload = {
  expenseId: string;
  projectId?: string;
  employeeId?: string;
  customerId?: string;
  vendorId?: string;
  action: 'create' | 'update' | 'delete' | 'bulk-delete';
};

const getExpenseChannel = () => {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return null;
  }
  if (!expenseChannel) {
    expenseChannel = new BroadcastChannel(EXPENSE_CHANGE_EVENT);
  }
  return expenseChannel;
};

export const emitExpenseChange = (detail: ExpenseChangePayload) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ExpenseChangePayload>(EXPENSE_CHANGE_EVENT, { detail }));
  getExpenseChannel()?.postMessage(detail);
};

export const subscribeToExpenseChange = (
  callback: (payload: ExpenseChangePayload) => void
) => {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<ExpenseChangePayload>;
    callback(customEvent.detail);
  };

  window.addEventListener(EXPENSE_CHANGE_EVENT, handler as EventListener);

  const channel = getExpenseChannel();
  const channelHandler = (event: MessageEvent<ExpenseChangePayload>) => {
    callback(event.data);
  };
  channel?.addEventListener('message', channelHandler as EventListener);

  return () => {
    window.removeEventListener(EXPENSE_CHANGE_EVENT, handler as EventListener);
    channel?.removeEventListener('message', channelHandler as EventListener);
  };
};

