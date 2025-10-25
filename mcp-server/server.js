import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize API clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Service health tracking
const serviceHealth = {
  leonardo: { status: 'healthy', lastCheck: null, failures: 0 },
  claude: { status: 'healthy', lastCheck: null, failures: 0 },
  openai: { status: 'healthy', lastCheck: null, failures: 0 },
  voai: { status: 'healthy', lastCheck: null, failures: 0 },
  supabase: { status: 'healthy', lastCheck: null, failures: 0 },
};

// Logging utility
async function logToSupabase(level, message, metadata = {}) {
  try {
    await supabase.from('mcp_logs').insert({
      level,
      message,
      metadata,
      timestamp: new Date().toISOString(),
    });
    console.log(`[${level.toUpperCase()}] ${message}`, metadata);
  } catch (error) {
    console.error('Failed to log to Supabase:', error.message);
  }
}

// Service health checker
async function updateServiceHealth(service, status, error = null) {
  serviceHealth[service].status = status;
  serviceHealth[service].lastCheck = new Date().toISOString();

  if (status === 'unhealthy') {
    serviceHealth[service].failures += 1;
    await logToSupabase('error', `Service ${service} is unhealthy`, { error: error?.message });
  } else {
    serviceHealth[service].failures = 0;
  }
}

// Leonardo AI - Image Generation
async function generateImage(prompt, options = {}) {
  try {
    await logToSupabase('info', 'Generating image with Leonardo', { prompt });

    const response = await axios.post(
      'https://cloud.leonardo.ai/api/rest/v1/generations',
      {
        prompt,
        num_images: options.numImages || 1,
        width: options.width || 1024,
        height: options.height || 1024,
        modelId: options.modelId || 'aa77f04e-3eec-4034-9c07-d0f619684628',
        ...options,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.LEONARDO_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    await updateServiceHealth('leonardo', 'healthy');
    await logToSupabase('success', 'Image generated successfully', {
      generationId: response.data.sdGenerationJob?.generationId
    });

    return {
      success: true,
      generationId: response.data.sdGenerationJob?.generationId,
      data: response.data,
    };
  } catch (error) {
    await updateServiceHealth('leonardo', 'unhealthy', error);
    throw new Error(`Leonardo API failed: ${error.message}`);
  }
}

// Claude - Caption Generation
async function generateCaption(imageContext, tone = 'professional') {
  try {
    await logToSupabase('info', 'Generating caption with Claude', { tone });

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Create a ${tone} social media caption for an image about: ${imageContext}.
        Make it engaging, include relevant hashtags, and optimize for LinkedIn engagement.`,
      }],
    });

    await updateServiceHealth('claude', 'healthy');
    const caption = message.content[0].text;

    await logToSupabase('success', 'Caption generated successfully', { caption });
    return { success: true, caption };
  } catch (error) {
    await updateServiceHealth('claude', 'unhealthy', error);

    // Fallback to OpenAI
    await logToSupabase('warn', 'Claude failed, falling back to OpenAI', { error: error.message });
    return await generateCaptionFallback(imageContext, tone);
  }
}

// OpenAI Fallback for captions
async function generateCaptionFallback(imageContext, tone) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: `Create a ${tone} social media caption for an image about: ${imageContext}.
        Make it engaging, include relevant hashtags, and optimize for LinkedIn engagement.`,
      }],
    });

    await updateServiceHealth('openai', 'healthy');
    const caption = completion.choices[0].message.content;

    await logToSupabase('success', 'Caption generated via OpenAI fallback', { caption });
    return { success: true, caption, usedFallback: true };
  } catch (error) {
    await updateServiceHealth('openai', 'unhealthy', error);
    throw new Error(`Both Claude and OpenAI failed for caption generation: ${error.message}`);
  }
}

// GPT-5 (GPT-4O) - Advanced Logic & Reasoning
async function performLogicTask(task, context) {
  try {
    await logToSupabase('info', 'Performing logic task with GPT-4O', { task });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'system',
        content: 'You are an advanced AI assistant specialized in complex reasoning and decision-making.',
      }, {
        role: 'user',
        content: `Task: ${task}\n\nContext: ${JSON.stringify(context)}`,
      }],
      temperature: 0.7,
    });

    await updateServiceHealth('openai', 'healthy');
    const result = completion.choices[0].message.content;

    await logToSupabase('success', 'Logic task completed', { result });
    return { success: true, result };
  } catch (error) {
    await updateServiceHealth('openai', 'unhealthy', error);
    throw new Error(`GPT-4O logic task failed: ${error.message}`);
  }
}

// VOAI - Video Generation (Placeholder - API integration needed)
async function generateVideo(prompt, options = {}) {
  try {
    await logToSupabase('info', 'Video generation requested', { prompt });

    // Placeholder for VOAI integration
    // Replace with actual VOAI API when available
    await updateServiceHealth('voai', 'healthy');

    return {
      success: true,
      message: 'Video generation queued (VOAI integration pending)',
      prompt,
    };
  } catch (error) {
    await updateServiceHealth('voai', 'unhealthy', error);
    throw new Error(`VOAI video generation failed: ${error.message}`);
  }
}

// LinkedIn Posting
async function postToLinkedIn(content, imageUrl = null) {
  if (!process.env.LINKEDIN_ACCESS_TOKEN || !process.env.LINKEDIN_PERSON_ID) {
    await logToSupabase('warn', 'LinkedIn credentials not configured, skipping post');
    return { success: false, message: 'LinkedIn credentials not configured' };
  }

  try {
    await logToSupabase('info', 'Posting to LinkedIn', { content });

    const payload = {
      author: `urn:li:person:${process.env.LINKEDIN_PERSON_ID}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: imageUrl ? 'IMAGE' : 'NONE',
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    };

    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      payload,
      {
        headers: {
          'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    await logToSupabase('success', 'Posted to LinkedIn successfully', { postId: response.data.id });
    return { success: true, postId: response.data.id };
  } catch (error) {
    await logToSupabase('error', 'LinkedIn posting failed', { error: error.message });
    throw new Error(`LinkedIn posting failed: ${error.message}`);
  }
}

// AI Router - Intelligent orchestration
async function orchestrateAIPipeline(task) {
  const pipeline = {
    taskId: `task_${Date.now()}`,
    status: 'running',
    results: {},
    startTime: new Date().toISOString(),
  };

  try {
    await logToSupabase('info', 'Starting AI pipeline orchestration', { task });

    // Step 1: Generate image
    if (task.generateImage) {
      pipeline.results.image = await generateImage(task.imagePrompt, task.imageOptions);
    }

    // Step 2: Generate caption
    if (task.generateCaption) {
      pipeline.results.caption = await generateCaption(
        task.captionContext || task.imagePrompt,
        task.tone
      );
    }

    // Step 3: Perform logic/reasoning task
    if (task.logicTask) {
      pipeline.results.logic = await performLogicTask(task.logicTask, task.logicContext);
    }

    // Step 4: Generate video (if requested)
    if (task.generateVideo) {
      pipeline.results.video = await generateVideo(task.videoPrompt, task.videoOptions);
    }

    // Step 5: Post to LinkedIn (if requested)
    if (task.postToLinkedIn && pipeline.results.caption) {
      pipeline.results.linkedin = await postToLinkedIn(
        pipeline.results.caption.caption,
        pipeline.results.image?.data?.url
      );
    }

    pipeline.status = 'completed';
    pipeline.endTime = new Date().toISOString();

    // Store pipeline results in Supabase
    await supabase.from('mcp_pipelines').insert({
      task_id: pipeline.taskId,
      status: pipeline.status,
      results: pipeline.results,
      created_at: pipeline.startTime,
      completed_at: pipeline.endTime,
    });

    await logToSupabase('success', 'AI pipeline completed successfully', { taskId: pipeline.taskId });
    return pipeline;
  } catch (error) {
    pipeline.status = 'failed';
    pipeline.error = error.message;
    pipeline.endTime = new Date().toISOString();

    await logToSupabase('error', 'AI pipeline failed', {
      taskId: pipeline.taskId,
      error: error.message
    });

    return pipeline;
  }
}

// Routes
app.get('/health', async (req, res) => {
  const overallHealth = Object.values(serviceHealth).every(s => s.status === 'healthy');

  res.status(overallHealth ? 200 : 503).json({
    status: overallHealth ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: serviceHealth,
    uptime: process.uptime(),
  });
});

app.post('/api/orchestrate', async (req, res) => {
  try {
    const task = req.body;
    const result = await orchestrateAIPipeline(task);
    res.json(result);
  } catch (error) {
    await logToSupabase('error', 'Orchestration endpoint error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/image', async (req, res) => {
  try {
    const { prompt, options } = req.body;
    const result = await generateImage(prompt, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/caption', async (req, res) => {
  try {
    const { imageContext, tone } = req.body;
    const result = await generateCaption(imageContext, tone);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/generate/video', async (req, res) => {
  try {
    const { prompt, options } = req.body;
    const result = await generateVideo(prompt, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/linkedin/post', async (req, res) => {
  try {
    const { content, imageUrl } = req.body;
    const result = await postToLinkedIn(content, imageUrl);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health monitoring cron job (every 5 minutes)
cron.schedule('*/5 * * * *', async () => {
  await logToSupabase('info', 'Running scheduled health check');

  // Check Supabase connectivity
  try {
    await supabase.from('mcp_logs').select('count').limit(1);
    await updateServiceHealth('supabase', 'healthy');
  } catch (error) {
    await updateServiceHealth('supabase', 'unhealthy', error);
  }
});

// Startup
app.listen(PORT, async () => {
  console.log(`MCP Orchestration Server running on port ${PORT}`);
  await logToSupabase('info', `MCP Server started on port ${PORT}`, {
    nodeVersion: process.version,
    environment: process.env.NODE_ENV,
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await logToSupabase('info', 'MCP Server shutting down');
  process.exit(0);
});

export default app;
