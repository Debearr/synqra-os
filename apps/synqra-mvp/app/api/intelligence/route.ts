import { NextResponse } from 'next/server';
import { ModelRouter, ModelConfig } from '@/lib/model-router';

const router = new ModelRouter();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { prompt, taskType } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        const config: ModelConfig = router.getRoute(taskType || 'analytical');
        const result = await router.generateText(config, prompt);

        return NextResponse.json({ result });
    } catch (error) {
        console.error('Intelligence API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
