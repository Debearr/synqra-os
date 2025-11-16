/**
 * ============================================================
 * NOTIFICATION SENDER MCP
 * ============================================================
 * Telegram alerts and system notifications
 */

import { loadEnvConfig } from '../../shared/config';
import { MCPResponse } from '../../shared/types';
import { wrapResponse, wrapError, Logger } from '../../shared/utils';

const logger = new Logger('notification-sender');

export interface NotificationRequest {
  message: string;
  channel?: 'telegram' | 'email' | 'sms';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export class NotificationSender {
  private telegramBotToken: string;
  private telegramChannelId: string;
  
  constructor() {
    const config = loadEnvConfig([]);
    this.telegramBotToken = config.telegramBotToken || '';
    this.telegramChannelId = config.telegramChannelId || '';
  }
  
  async send(request: NotificationRequest): Promise<MCPResponse<{ sent: boolean }>> {
    const startTime = Date.now();
    
    try {
      const channel = request.channel || 'telegram';
      
      if (channel === 'telegram') {
        await this.sendTelegram(request.message);
      }
      
      return wrapResponse({ sent: true }, 'notification-sender', startTime);
    } catch (error) {
      return wrapError(error as Error, 'notification-sender', startTime);
    }
  }
  
  private async sendTelegram(message: string): Promise<void> {
    if (!this.telegramBotToken || !this.telegramChannelId) {
      logger.warn('Telegram not configured');
      return;
    }
    
    const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
    
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: this.telegramChannelId,
        text: message,
      }),
    });
  }
}

export const notificationSender = new NotificationSender();
