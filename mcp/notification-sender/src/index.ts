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
        // Sanitize message to prevent injection
        const safeMessage = this.escapeHtml(request.message);
        await this.sendTelegram(safeMessage);
      }

      return wrapResponse({ sent: true }, 'notification-sender', startTime);
    } catch (error) {
      return wrapError(error as Error, 'notification-sender', startTime);
    }
  }

  /**
   * Escape HTML characters to prevent injection
   */
  private escapeHtml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private async sendTelegram(message: string): Promise<void> {
    if (!this.telegramBotToken || !this.telegramChannelId) {
      logger.warn('Telegram not configured');
      return;
    }

    // Construct URL carefully to avoid logging token on error
    const baseUrl = 'https://api.telegram.org';
    const endpoint = `/bot${this.telegramBotToken}/sendMessage`;
    const fullUrl = `${baseUrl}${endpoint}`;

    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.telegramChannelId,
          text: message,
          parse_mode: 'HTML', // Enable HTML parsing
          disable_web_page_preview: true
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Redact token from error message if it somehow appears
        const safeError = errorText.replace(this.telegramBotToken, '[REDACTED]');
        throw new Error(`Telegram API Error: ${response.status} ${safeError}`);
      }
    } catch (error) {
      // Ensure error logs don't leak the token URL
      const safeMessage = (error as Error).message.replace(this.telegramBotToken, '[REDACTED]');
      logger.error(`Failed to send Telegram message: ${safeMessage}`);
      throw new Error(safeMessage);
    }
  }
}

export const notificationSender = new NotificationSender();
