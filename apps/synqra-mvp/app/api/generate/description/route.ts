import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { features, address, type } = await req.json();

        // TODO: Integrate with Anthropic/OpenAI here
        // For now, return a high-quality mock response for the demo

        const mockDescription = `
      Presenting a stunning ${type} located in the heart of ${address || "the city"}. 
      
      This property boasts ${features?.join(", ") || "exceptional finishes and modern amenities"}. 
      Perfect for the discerning buyer looking for luxury and convenience. 
      
      Key highlights include spacious living areas, natural light, and premium fittings throughout. 
      Don't miss this opportunity to own a piece of prime real estate.
    `.trim();

        return NextResponse.json({
            description: mockDescription,
            status: "success"
        });

    } catch (error) {
        return NextResponse.json(
            { error: "Failed to generate description" },
            { status: 500 }
        );
    }
}
