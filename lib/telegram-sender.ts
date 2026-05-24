/**
 * Telegram Bot Sender
 * Sends messages back to Telegram
 */

interface SendMessageOptions {
  chatId: string;
  text: string;
  replyToMessageId?: number;
}

export class TelegramSender {
  private botToken: string | null;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || null;
  }

  /**
   * Check if Telegram is configured
   */
  isConfigured(): boolean {
    return !!this.botToken;
  }

  /**
   * Send message to Telegram
   */
  async sendMessage(options: SendMessageOptions): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('Telegram not configured. Skipping message send.');
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: options.chatId,
          text: options.text,
          reply_to_message_id: options.replyToMessageId,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Telegram API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      if (!data.ok) {
        throw new Error(`Telegram API error: ${data.description || 'Unknown error'}`);
      }

      return true;
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      return false;
    }
  }

  /**
   * Send expense approval confirmation
   */
  async sendApprovalConfirmation(chatId: string, messageId: number, expenseAmount: number): Promise<boolean> {
    const message = `✅ *Kharashka waa la aqbalay*\n\nLacagta: $${expenseAmount.toLocaleString()}\n\nWaa la kaydiyay system-ka.`;
    return this.sendMessage({
      chatId,
      text: message,
      replyToMessageId: messageId,
    });
  }

  /**
   * Send expense rejection notification
   */
  async sendRejectionNotification(chatId: string, messageId: number, reason?: string): Promise<boolean> {
    let message = `❌ *Kharashka waa la diiday*`;
    if (reason) {
      message += `\n\nSababta: ${reason}`;
    }
    return this.sendMessage({
      chatId,
      text: message,
      replyToMessageId: messageId,
    });
  }

  /**
   * Send under review notification
   */
  async sendReviewNotification(chatId: string, messageId: number): Promise<boolean> {
    const message = `⏳ *Waa la baarayaa...*\n\nKharashkaagu waa la eegayaa. Waxaan ku soo wargelin doonaa marka la aqbalo ama la diido.`;
    return this.sendMessage({
      chatId,
      text: message,
      replyToMessageId: messageId,
    });
  }

  /**
   * Send clarification request
   */
  async sendClarificationRequest(chatId: string, messageId: number, missingFields: string[]): Promise<boolean> {
    const message = `❓ *Macluumaadka ma buuxna*\n\nWaxaa loo baahan yahay:\n${missingFields.map(f => `• ${f}`).join('\n')}\n\nFadlan soo celi macluumaadka buuxa.`;
    return this.sendMessage({
      chatId,
      text: message,
      replyToMessageId: messageId,
    });
  }

  /**
   * Notify chat that it is not linked to a project/company yet
   */
  async sendChatNotLinkedNotice(chatId: string, messageId?: number, chatName?: string) {
    const message = `⚠️ *Kooxdan lama xiriirin weli*\n\n${chatName ? `Kooxda *${chatName}*` : 'Kooxdan'} wali laguma xirinin Revlo.\n\nFadlan gal Revlo → Telegram Expenses → Settings si aad ugu darto chat-kan oo aad u doorato mashruuca/akoonka saxda ah.`;
    return this.sendMessage({ chatId, text: message, replyToMessageId: messageId });
  }

  /**
   * Notify chat that it is inactive/disabled from system
   */
  async sendChatInactiveNotice(chatId: string, messageId?: number) {
    const message = `⛔ *Kooxdan waa la xiray*\n\nFariimaha lama aqbalayo ilaa maamulka uu dib u hawlgeliyo chat-kan gudaha Revlo.`;
    return this.sendMessage({ chatId, text: message, replyToMessageId: messageId });
  }

  /**
   * Notify sender that they must wait for approval
   */
  async sendUserPendingApprovalNotice(chatId: string, messageId?: number) {
    const message = `👋 *Waad ku mahadsan tahay*\n\nWaxaan diiwaangelinay aqoonsigaaga Telegram. Maamulka ayaa u baahan inuu ku ansixiyo ka hor inta aan fariimahaaga la qaadin.`;
    return this.sendMessage({ chatId, text: message, replyToMessageId: messageId });
  }

  /**
   * Notify sender that they are blocked
   */
  async sendUserBlockedNotice(chatId: string, messageId?: number) {
    const message = `🚫 *Maamulka ayaa xannibay aqoonsigan*\n\nFadlan la xidhiidh maamulka shirkadda haddii aad u baahan tahay in laguu fasaxo.`; 
    return this.sendMessage({ chatId, text: message, replyToMessageId: messageId });
  }
}

// Export singleton instance
export const telegramSender = new TelegramSender();

