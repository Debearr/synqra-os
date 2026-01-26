import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const updateSchema = z.object({
    signalId: z.string().uuid(),
    newStatus: z.enum(['open', 'tp1', 'tp2', 'tp3', 'closed', 'stopped']),
    currentPrice: z.number().optional(),
    notes: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        // 1. Validate Input
        const body = await request.json();
        const result = updateSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: result.error.errors },
                { status: 400 }
            );
        }

        const { signalId, newStatus, currentPrice, notes } = result.data;

        // 2. Fetch Current Signal (to compare status)
        const { data: currentSignal, error: fetchError } = await supabase
            .from('aura_signals')
            .select('*')
            .eq('id', signalId)
            .single();

        if (fetchError || !currentSignal) {
            return NextResponse.json({ error: 'Signal not found' }, { status: 404 });
        }

        // 3. Update Signal
        const { data: updatedSignal, error: updateError } = await supabase
            .from('aura_signals')
            .update({
                status: newStatus,
                notes: notes ? `${currentSignal.notes || ''}\n[Update]: ${notes}` : currentSignal.notes
            })
            .eq('id', signalId)
            .select()
            .single();

        if (updateError) {
            console.error('Update Error:', updateError.message);
            return NextResponse.json({ error: 'Failed to update signal' }, { status: 500 });
        }

        // 4. Log to History
        await supabase.from('aura_signal_history').insert({
            signal_id: signalId,
            previous_status: currentSignal.status,
            new_status: newStatus,
            price_at_update: currentPrice,
            notes: notes || `Status changed from ${currentSignal.status} to ${newStatus}`
        });

        // 5. Notify Telegram
        await sendUpdateNotification(updatedSignal, currentSignal.status, newStatus, currentPrice);

        return NextResponse.json({ success: true, message: 'Signal updated' });

    } catch (error) {
        console.error('Signal Update Error:', (error as Error).message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function sendUpdateNotification(signal: any, oldStatus: string, newStatus: string, price?: number) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHANNEL_ID;

    if (!token || !chatId) return;

    let emoji = '⚠️';
    if (newStatus === 'closed') emoji = '🏁';
    if (newStatus === 'stopped') emoji = '🛑';
    if (newStatus.startsWith('tp')) emoji = '💰';

    const htmlMessage = `
<b>${emoji} SIGNAL UPDATE: ${signal.symbol}</b>

<b>Status:</b> ${oldStatus.toUpperCase()} ➡️ <b>${newStatus.toUpperCase()}</b>
${price ? `<b>Price:</b> ${price}` : ''}

${signal.notes ? `<i>${escapeHtml(signal.notes.split('\n').pop())}</i>` : ''}
    `.trim();

    try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: htmlMessage,
                parse_mode: 'HTML',
                disable_web_page_preview: true
            })
        });
    } catch (e) {
        // Redact and log
        const msg = (e as Error).message.replace(token, '[REDACTED]');
        console.error(`Telegram Update Error: ${msg}`);
    }
}

function escapeHtml(text: string | undefined): string {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
