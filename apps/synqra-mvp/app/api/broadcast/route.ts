import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client (Service Role for admin tasks if needed, or normal client)
// USING ENV VARS DIRECTLY to ensure no leakage via config files
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!; // Using service key for backend ops
const supabase = createClient(supabaseUrl, supabaseKey);

// Input Validation Schema
const broadcastSchema = z.object({
    symbol: z.string().min(1).max(10).toUpperCase(),
    direction: z.enum(['LONG', 'SHORT']),
    entry_price: z.number().positive(),
    stop_loss: z.number().positive(),
    take_profit_1: z.number().positive(),
    take_profit_2: z.number().positive().optional(),
    take_profit_3: z.number().positive().optional(),
    notes: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        // 1. Validate Input
        const body = await request.json();
        const result = broadcastSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.errors },
                { status: 400 }
            );
        }

        const {
            symbol, direction, entry_price,
            stop_loss, take_profit_1, take_profit_2, take_profit_3, notes
        } = result.data;

        // 2. Insert into DB
        const { data: signal, error: dbError } = await supabase
            .from('aura_signals')
            .insert({
                symbol,
                direction,
                entry_price,
                stop_loss,
                take_profit_1,
                take_profit_2,
                take_profit_3,
                status: 'open',
                notes
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database Error:', dbError.message); // Log message only, not full obj if it has secrets
            return NextResponse.json({ error: 'Database operation failed' }, { status: 500 });
        }

        // 3. Create History Entry
        await supabase.from('aura_signal_history').insert({
            signal_id: signal.id,
            new_status: 'open',
            price_at_update: entry_price,
            notes: 'Signal broadcasted'
        });

        // 4. Send Telegram Notification (Securely)
        // Inline implementation to avoid dependency hell and ensure security compliance
        await sendSecureTelegram(signal);

        // 5. Return Success (Sanitized)
        return NextResponse.json({
            success: true,
            signalId: signal.id,
            message: 'Signal broadcasted successfully'
        });

    } catch (error) {
        console.error('Broadcast Error:', (error as Error).message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Secure Telegram Sender (Duplicated/Adapted for strict isolation)
async function sendSecureTelegram(signal: any) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHANNEL_ID;

    if (!token || !chatId) {
        console.warn('Telegram credentials missing, skipping notification');
        return;
    }

    // Format Message (HTML Safe)
    const emoji = signal.direction === 'LONG' ? '🟢' : '🔴';
    const htmlMessage = `
<b>${emoji} NEW SIGNAL: ${signal.symbol} ${signal.direction}</b>

<b>Entry:</b> ${signal.entry_price}
<b>TP1:</b> ${signal.take_profit_1}
${signal.take_profit_2 ? `<b>TP2:</b> ${signal.take_profit_2}` : ''}
${signal.take_profit_3 ? `<b>TP3:</b> ${signal.take_profit_3}` : ''}
<b>SL:</b> ${signal.stop_loss}

${signal.notes ? `<i>${escapeHtml(signal.notes)}</i>` : ''}
  `.trim();

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: htmlMessage,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });

        if (!response.ok) {
            // Silent fail in terms of API response, but strictly logged (redacted)
            const err = await response.text();
            console.error(`Telegram Fail: ${err.replace(token, '[REDACTED]')}`);
        }
    } catch (e) {
        // Redact token from any potential error message
        const msg = (e as Error).message.replace(token, '[REDACTED]');
        console.error(`Telegram Network Error: ${msg}`);
    }
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
