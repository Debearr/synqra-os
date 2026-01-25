import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { clientName, clientEmail, propertyId } = await req.json();

        // TODO: Integrate with email/SMS provider (SendGrid/Twilio)
        // TODO: Create database record in Supabase

        console.log(`FICA Request initiated for ${clientName} (${clientEmail}) on property ${propertyId}`);

        return NextResponse.json({
            message: "FICA request sent successfully",
            requestId: "req_" + Math.random().toString(36).substr(2, 9),
            status: "pending"
        });

    } catch (error) {
        return NextResponse.json(
            { error: "Failed to initiate FICA request" },
            { status: 500 }
        );
    }
}
