/**
 * ============================================================
 * KIE.AI MULTI-MODEL ROUTER
 * ============================================================
 * Routes requests through DeepSeek → Gemini → Claude fallback
 * Zero-cost optimization with intelligent model selection
 */

const KIE_API_KEY = process.env.KIE_API_KEY || '';
const KIE_PROJECT_ID = process.env.KIE_PROJECT_ID || '';
const KIE_ENDPOINT = 'https://api.kie.ai/v1/chat/completions';

export interface KIEMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface KIERequest {
  model?: 'deepseek' | 'gemini' | 'claude';
  messages: KIEMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface KIEResponse {
  content: string;
  model: string;
  tokens_used: number;
}

/**
 * Route a request through KIE.AI multi-model router
 */
export async function routeKIE(request: KIERequest): Promise<KIEResponse> {
  if (!KIE_API_KEY || !KIE_PROJECT_ID) {
    throw new Error('KIE.AI credentials not configured');
  }

  const model = request.model || 'deepseek'; // Default to most cost-effective
  
  const payload = {
    model,
    messages: request.messages,
    temperature: request.temperature || 0.7,
    max_tokens: request.max_tokens || 1000,
    project_id: KIE_PROJECT_ID,
  };

  try {
    const response = await fetch(KIE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`KIE.AI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model || model,
      tokens_used: data.usage?.total_tokens || 0,
    };
  } catch (error) {
    console.error('[KIE Router] Error:', error);
    throw error;
  }
}

/**
 * Generate trend-aware content using KIE.AI
 */
export async function generateTrendContent(
  brief: string,
  trends: string[],
  platform: string
): Promise<string> {
  const systemPrompt = `You are a social media content expert specializing in ${platform}. 
Create engaging, platform-native content that incorporates trending topics naturally.
Keep it authentic, valuable, and aligned with current trends.`;

  const userPrompt = `Create content for ${platform} about: ${brief}

Incorporate these trending topics naturally: ${trends.join(', ')}

Requirements:
- Platform-native format and tone
- Natural integration of trends (don't force them)
- Engaging hook that stops scrolling
- Clear value proposition
- Strong call-to-action

Return ONLY the content text, no explanations.`;

  const response = await routeKIE({
    model: 'deepseek', // Most cost-effective for content generation
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8, // Higher creativity for content
    max_tokens: 500,
  });

  return response.content.trim();
}

/**
 * Detect trending topics for a platform
 */
export async function detectTrends(platform: string): Promise<string[]> {
  const systemPrompt = `You are a social media trend analyst. 
Identify the top 5 trending topics for ${platform} right now.
Focus on evergreen and emerging trends that creators can leverage.`;

  const userPrompt = `What are the top 5 trending topics on ${platform} today?
Return ONLY a JSON array of strings, no explanations.
Example: ["topic 1", "topic 2", "topic 3", "topic 4", "topic 5"]`;

  const response = await routeKIE({
    model: 'gemini', // Good for analysis tasks
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3, // Lower for more factual responses
    max_tokens: 200,
  });

  try {
    // Parse JSON response
    const trends = JSON.parse(response.content);
    return Array.isArray(trends) ? trends : [];
  } catch (error) {
    console.error('[KIE Router] Failed to parse trends:', error);
    return [];
  }
}
