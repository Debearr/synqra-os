# Python Model Service

Local HuggingFace model inference service for NØID Labs ecosystem.

## Features

- **Lazy Loading**: Models load on-demand to save memory
- **Multi-Model Support**: Llama 3.2, OpenCLIP, PaddleOCR, Faster-Whisper
- **Production Ready**: Health checks, logging, error handling
- **Railway Optimized**: Dockerfile and configuration included

## Quick Start

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Start service
python app.py
```

### Railway Deployment

1. Connect Railway to your GitHub repo
2. Create new service from `/python-model-service`
3. Set environment variables:
   - `MODEL_CACHE_PATH=/app/.model_cache` (auto-set)
   - `PORT=8000` (auto-set by Railway)

### Docker

```bash
# Build
docker build -t noid-model-service .

# Run
docker run -p 8000:8000 -v ./models:/app/.model_cache noid-model-service
```

## API Endpoints

### Health Check
```bash
GET /health
```

### List Models
```bash
GET /models
```

### Inference
```bash
POST /inference
{
  "model_id": "llama-3.2-1b",
  "input": "Your prompt here",
  "max_tokens": 600,
  "temperature": 0.7
}
```

## Supported Models

| Model | Type | Memory | Avg Latency |
|-------|------|--------|-------------|
| Llama 3.2 1B | LLM | 2GB | 800ms |
| OpenCLIP ViT-B/32 | Vision | 600MB | 150ms |
| PaddleOCR | OCR | 400MB | 200ms |
| Faster Whisper | Audio | 500MB | 1000ms |

## Environment Variables

```env
MODEL_CACHE_PATH=/app/.model_cache
PORT=8000
LOG_LEVEL=INFO
```

## Memory Requirements

- Minimum: 4GB RAM
- Recommended: 8GB RAM (for multiple models)
- All models loaded: ~3.5GB

## Cost Optimization

- Lazy loading reduces startup time and memory
- Local inference = $0 per request
- Railway Starter plan: ~$5-10/month for Python service

## Integration

```typescript
// In Next.js app
const response = await fetch('${PYTHON_MODEL_SERVICE_URL}/inference', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model_id: 'llama-3.2-1b',
    input: 'Your prompt',
    max_tokens: 600,
  }),
});

const data = await response.json();
console.log(data.output);
```

## Monitoring

Check service health:
```bash
curl https://your-service.railway.app/health
```

## Troubleshooting

### Model fails to load
- Check memory availability (need 2-4GB per model)
- Verify MODEL_CACHE_PATH is writable
- Check logs for specific error

### High latency
- First request loads model (slower)
- Subsequent requests are cached (faster)
- Consider GPU deployment for better performance

### Out of memory
- Reduce number of concurrent models
- Use smaller models
- Increase Railway plan memory
