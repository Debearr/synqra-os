import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';

export async function run($json) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return [{ json: { status: 'error', message: 'Missing Supabase credentials in env' } }];
  }
  const supabase = createClient(url, key);

  const { data: councilRows, error: councilErr } = await supabase
    .from('council_digests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  const { data: uiRows, error: uiErr } = await supabase
    .from('ui_audit_results')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(1);

  if (councilErr || uiErr) {
    return [{ json: { status: 'error', message: (councilErr || uiErr)?.message } }];
  }

  const council = councilRows?.[0]?.digest || { executive_summary: 'N/A' };
  const ui = uiRows?.[0]?.feedback || {};

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();

  page.drawText('Launch Insight v1 Report', { x: 50, y: height - 60, size: 20, font, color: rgb(0, 0, 0) });
  page.drawText('Council Digest Summary:', { x: 50, y: height - 100, size: 12, font });
  const councilText = typeof council.executive_summary === 'string' ? council.executive_summary : JSON.stringify(council.executive_summary);
  page.drawText(councilText.slice(0, 800), { x: 50, y: height - 120, size: 9, font });
  page.drawText('UI Audit Highlights:', { x: 50, y: height - 300, size: 12, font });
  const uiText = JSON.stringify(ui).slice(0, 1000);
  page.drawText(uiText, { x: 50, y: height - 320, size: 9, font });

  const pdfBytes = await pdf.save();
  const { error: uploadErr } = await supabase.storage.from('reports').upload('Launch_Insight_v1.pdf', pdfBytes, { contentType: 'application/pdf', upsert: true });
  if (uploadErr) {
    return [{ json: { status: 'error', message: uploadErr.message } }];
  }
  return [{ json: { status: 'report_ready', path: '/storage/v1/object/public/reports/Launch_Insight_v1.pdf' } }];
}
