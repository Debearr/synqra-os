import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Health check endpoint - NO database ping during CI
app.get('/api/health', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    service: 'MCP Server'
  };

  // Only ping Supabase if explicitly requested (post-deployment check)
  if (req.query.checkDb === 'true') {
    try {
      const { data, error } = await supabase
        .from('health_pulse')
        .select('last_ping')
        .limit(1);

      healthCheck.database = error ? 'ERROR' : 'OK';
      healthCheck.dbError = error?.message;
    } catch (err) {
      healthCheck.database = 'ERROR';
      healthCheck.dbError = err.message;
    }
  }

  res.status(200).json(healthCheck);
});

// Generate image endpoint - Leonardo AI integration
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, style = 'CINEMATIC' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Log to Supabase
    await supabase.from('ai_logs').insert({
      action: 'generate-image',
      model: 'leonardo',
      input: { prompt, style },
      status: 'initiated'
    });

    // Leonardo AI API call
    const response = await fetch('https://cloud.leonardo.ai/api/rest/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LEONARDO_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        modelId: process.env.LEONARDO_MODEL_ID || 'b24e16ff-06e3-43eb-8d33-4416c2d75876',
        width: 1024,
        height: 1024,
        num_images: 1,
        presetStyle: style
      })
    });

    const data = await response.json();

    // Update log
    await supabase.from('ai_logs').insert({
      action: 'generate-image',
      model: 'leonardo',
      output: data,
      status: 'completed'
    });

    res.status(200).json(data);
  } catch (error) {
    console.error('Image generation error:', error);

    await supabase.from('ai_logs').insert({
      action: 'generate-image',
      model: 'leonardo',
      error: error.message,
      status: 'failed'
    });

    res.status(500).json({ error: error.message });
  }
});

// Generate caption endpoint - AI Council Router (Claude + GPT-5)
app.post('/api/generate-caption', async (req, res) => {
  try {
    const { imageUrl, context, platform = 'linkedin' } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL is required' });
    }

    // AI Council: Route based on task complexity
    const useGPT5 = context?.length > 500 || context?.includes('technical');
    const model = useGPT5 ? 'gpt-5' : 'claude';

    // Log routing decision
    await supabase.from('ai_logs').insert({
      action: 'generate-caption',
      model,
      input: { imageUrl, context, platform },
      metadata: { routing_reason: useGPT5 ? 'complex_technical' : 'standard' },
      status: 'initiated'
    });

    let caption;

    if (useGPT5) {
      // GPT-5 API call (placeholder - replace with actual endpoint)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a luxury brand copywriter. Generate engaging ${platform} captions.`
            },
            {
              role: 'user',
              content: `Create a caption for this image: ${imageUrl}\nContext: ${context || 'Luxury brand content'}`
            }
          ]
        })
      });

      const data = await response.json();
      caption = data.choices[0]?.message?.content;
    } else {
      // Claude API call
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: `Generate a compelling ${platform} caption for this image: ${imageUrl}\n\nContext: ${context || 'Luxury brand content'}`
            }
          ]
        })
      });

      const data = await response.json();
      caption = data.content[0]?.text;
    }

    // Update log
    await supabase.from('ai_logs').insert({
      action: 'generate-caption',
      model,
      output: { caption },
      status: 'completed'
    });

    res.status(200).json({ caption, model_used: model });
  } catch (error) {
    console.error('Caption generation error:', error);

    await supabase.from('ai_logs').insert({
      action: 'generate-caption',
      error: error.message,
      status: 'failed'
    });

    res.status(500).json({ error: error.message });
  }
});

// Post to LinkedIn endpoint
app.post('/api/post-linkedin', async (req, res) => {
  try {
    const { text, imageUrl, authorId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text content is required' });
    }

    // Log to Supabase
    await supabase.from('posts').insert({
      platform: 'linkedin',
      content: text,
      image_url: imageUrl,
      author_id: authorId,
      status: 'pending'
    });

    // This would integrate with N8N webhook or LinkedIn API directly
    const webhookUrl = process.env.N8N_LINKEDIN_WEBHOOK_URL;

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, imageUrl, authorId })
      });
    }

    res.status(200).json({
      message: 'Post queued successfully',
      queued_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('LinkedIn post error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Metrics endpoint
app.get('/api/metrics', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    res.status(200).json({ metrics: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MCP Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
