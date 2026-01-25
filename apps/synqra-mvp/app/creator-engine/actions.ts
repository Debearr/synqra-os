'use server';

import { ModelRouter } from '@/lib/model-router';

const router = new ModelRouter();

export async function generateContentAction(prompt: string, type: 'creative' | 'analytical') {
    try {
        const config = router.getRoute(type);
        const content = await router.generateText(config, prompt);
        return { success: true, content };
    } catch (error) {
        console.error('Creator Engine Action Error:', error);
        return { success: false, error: 'Failed to generate content' };
    }
}
