/**
 * Expense Creation Service from Telegram
 * Creates expenses in the system from approved Telegram messages
 */

import prisma from '@/lib/db';
import { ProjectAutoCreate } from './project-auto-create';
import { telegramSender } from './telegram-sender';

interface CreateExpenseFromTelegramOptions {
  pendingExpenseId: string;
  companyId: string;
  userId: string;
  projectId?: string; // If project was already selected/created
  accountId?: string; // Account to pay from
}

export class ExpenseFromTelegram {
  /**
   * Create expense from approved pending expense
   */
  static async createExpense(options: CreateExpenseFromTelegramOptions): Promise<{ success: boolean; expenseId?: string; error?: string }> {
    const { pendingExpenseId, companyId, userId, projectId, accountId } = options;

    try {
      // Get pending expense
      const pendingExpense = (await prisma.pendingExpense.findUnique({
        where: { id: pendingExpenseId },
      })) as any;

      if (!pendingExpense) {
        return { success: false, error: 'Pending expense not found' };
      }

      if (pendingExpense.status !== 'PENDING') {
        return { success: false, error: 'Expense already processed' };
      }

      const parsedData = pendingExpense.parsedData as any;
      const { projectName, amount, category, description } = parsedData;

      // Get or create project
      let finalProjectId = projectId || pendingExpense.projectId || undefined;
      if (!finalProjectId && projectName) {
        const projectResult = await ProjectAutoCreate.findOrCreate({
          name: projectName,
          companyId,
        });
        finalProjectId = projectResult.id;
      }

      // Get default account if not provided
      let finalAccountId = accountId;
      if (!finalAccountId) {
        const defaultAccount = await prisma.account.findFirst({
          where: { companyId },
          orderBy: { createdAt: 'asc' },
        });
        
        if (!defaultAccount) {
          return { success: false, error: 'No account found. Please create an account first.' };
        }
        
        finalAccountId = defaultAccount.id;
      }

      // Create expense
      const expense = await prisma.expense.create({
        data: {
          description: description || `Expense from Telegram: ${projectName || 'Unknown'}`,
          amount: amount,
          category: category || 'Other',
          paidFrom: finalAccountId,
          expenseDate: new Date(),
          note: `Created from Telegram message. Sender: ${pendingExpense.telegramSenderName || 'Unknown'}`,
          approved: true,
          companyId,
          userId,
          projectId: finalProjectId || null,
        },
      });

      // Create transaction
      await prisma.transaction.create({
        data: {
          description: description || expense.description,
          amount: -Math.abs(amount), // Negative for expense
          type: 'EXPENSE',
          transactionDate: new Date(),
          accountId: finalAccountId,
          expenseId: expense.id,
          companyId,
          userId,
          projectId: finalProjectId || null,
        },
      });

      // Update account balance
      await prisma.account.update({
        where: { id: finalAccountId },
        data: {
          balance: { decrement: amount },
        },
      });

      // Update pending expense status
      await prisma.pendingExpense.update({
        where: { id: pendingExpenseId },
        data: {
          status: 'APPROVED',
          userId,
          approvedAt: new Date(),
        },
      });

      // Send confirmation to Telegram
      if (pendingExpense.telegramChatId && pendingExpense.telegramMessageId) {
        const messageId = parseInt(pendingExpense.telegramMessageId);
        if (!isNaN(messageId)) {
          await telegramSender.sendApprovalConfirmation(
            pendingExpense.telegramChatId,
            messageId,
            amount
          );
        }
      }

      return { success: true, expenseId: expense.id };
    } catch (error: any) {
      console.error('Error creating expense from Telegram:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Reject pending expense
   */
  static async rejectExpense(
    pendingExpenseId: string,
    userId: string,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const pendingExpense = (await prisma.pendingExpense.findUnique({
        where: { id: pendingExpenseId },
      })) as any;

      if (!pendingExpense) {
        return { success: false, error: 'Pending expense not found' };
      }

      // Update status
      await prisma.pendingExpense.update({
        where: { id: pendingExpenseId },
        data: {
          status: 'REJECTED',
          userId,
          approvedAt: new Date(),
        },
      });

      // Send rejection notification to Telegram
      if (pendingExpense.telegramChatId && pendingExpense.telegramMessageId) {
        const messageId = parseInt(pendingExpense.telegramMessageId);
        if (!isNaN(messageId)) {
          await telegramSender.sendRejectionNotification(
            pendingExpense.telegramChatId,
            messageId,
            reason
          );
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error rejecting expense:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }
}

