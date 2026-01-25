import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ExecSummaryData } from '@/features/executive-summary/execSummary.types';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const data: ExecSummaryData = body.data || body;

        if (!data.companyName) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let y = height - 50;
        const margin = 50;

        const drawText = (text: string, size: number, isBold: boolean = false, color = rgb(0, 0, 0)) => {
            const f = isBold ? boldFont : font;
            page.drawText(text, {
                x: margin,
                y,
                size,
                font: f,
                color,
            });
            y -= size + 10;
        };

        // Header
        drawText(data.companyName.toUpperCase(), 24, true);
        drawText(data.tagline, 14, false, rgb(0.08, 0.72, 0.65)); // Teal-ish
        y -= 20;

        // Sections
        const sections = [
            { title: 'Mission', content: data.mission },
            { title: 'The Problem', content: data.problem },
            { title: 'The Solution', content: data.solution },
            { title: 'Market Opportunity', content: data.marketSize },
            { title: 'Traction', content: data.traction },
            { title: 'Team', content: data.team },
            { title: 'The Ask', content: data.ask },
        ];

        for (const section of sections) {
            if (y < 50) {
                // Simple pagination check (could be improved)
                // For MVP, we just let it run off or stop
            }
            drawText(section.title.toUpperCase(), 10, true, rgb(0.6, 0.6, 0.6));

            // Simple text wrapping (very basic for MVP)
            const words = section.content.split(' ');
            let line = '';
            for (const word of words) {
                if ((line + word).length > 80) {
                    drawText(line, 11);
                    line = '';
                }
                line += word + ' ';
            }
            drawText(line, 11);
            y -= 10;
        }

        // Footer
        drawText(`Contact: ${data.contact}`, 10, false, rgb(0.5, 0.5, 0.5));

        const pdfBytes = await pdfDoc.save();

        return new NextResponse(pdfBytes, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${data.companyName}_Summary.pdf"`,
            },
        });
    } catch (error) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
}
