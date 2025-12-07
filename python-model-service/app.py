"""
============================================================
PYTHON MODEL SERVICE - HUGGINGFACE LOCAL MODELS
============================================================
FastAPI service for local model inference
Supports: Llama 3.2, OpenCLIP, PaddleOCR, Donut, Faster-Whisper
Tesla minimalism × production-ready × zero clutter
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI
app = FastAPI(
    title="NØID Labs Model Service",
    description="Local HuggingFace model inference service",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
MODEL_CACHE_DIR = os.getenv("MODEL_CACHE_PATH", "/app/.model_cache")
MAX_RETRIES = 3
TIMEOUT = 30

# Model registry (lazy-loaded)
models: Dict[str, Any] = {}

# ============================================================
# REQUEST/RESPONSE MODELS
# ============================================================

class InferenceRequest(BaseModel):
    model_id: str
    input: str
    system_prompt: Optional[str] = None
    max_tokens: int = 600
    temperature: float = 0.7

class InferenceResponse(BaseModel):
    output: str
    input_tokens: int
    output_tokens: int
    model: str
    finish_reason: Optional[str] = None
    latency_ms: float

class HealthResponse(BaseModel):
    status: str
    models_loaded: int
    models_available: list
    memory_usage_mb: float
    uptime_seconds: float

# ============================================================
# MODEL LOADERS (LAZY)
# ============================================================

def load_llama_3_2_1b():
    """Load Llama 3.2 1B model"""
    try:
        from transformers import AutoTokenizer, AutoModelForCausalLM
        import torch
        
        logger.info("Loading Llama 3.2 1B...")
        
        model_path = f"{MODEL_CACHE_DIR}/llama-3.2-1b"
        tokenizer = AutoTokenizer.from_pretrained(
            "meta-llama/Llama-3.2-1B",
            cache_dir=model_path
        )
        model = AutoModelForCausalLM.from_pretrained(
            "meta-llama/Llama-3.2-1B",
            cache_dir=model_path,
            torch_dtype=torch.float16,
            device_map="auto",
            low_cpu_mem_usage=True
        )
        
        logger.info("✅ Llama 3.2 1B loaded")
        return {"model": model, "tokenizer": tokenizer}
    except Exception as e:
        logger.error(f"❌ Failed to load Llama 3.2 1B: {e}")
        raise

def load_openclip():
    """Load OpenCLIP model"""
    try:
        import open_clip
        
        logger.info("Loading OpenCLIP...")
        
        model, _, preprocess = open_clip.create_model_and_transforms(
            'ViT-B-32',
            pretrained='laion2b_s34b_b79k'
        )
        tokenizer = open_clip.get_tokenizer('ViT-B-32')
        
        logger.info("✅ OpenCLIP loaded")
        return {"model": model, "preprocess": preprocess, "tokenizer": tokenizer}
    except Exception as e:
        logger.error(f"❌ Failed to load OpenCLIP: {e}")
        raise

def load_paddle_ocr():
    """Load PaddleOCR"""
    try:
        from paddleocr import PaddleOCR
        
        logger.info("Loading PaddleOCR...")
        
        ocr = PaddleOCR(
            use_angle_cls=True,
            lang='en',
            use_gpu=False,
            show_log=False
        )
        
        logger.info("✅ PaddleOCR loaded")
        return {"ocr": ocr}
    except Exception as e:
        logger.error(f"❌ Failed to load PaddleOCR: {e}")
        raise

def load_faster_whisper():
    """Load Faster Whisper"""
    try:
        from faster_whisper import WhisperModel
        
        logger.info("Loading Faster Whisper...")
        
        model = WhisperModel("base", device="cpu", compute_type="int8")
        
        logger.info("✅ Faster Whisper loaded")
        return {"model": model}
    except Exception as e:
        logger.error(f"❌ Failed to load Faster Whisper: {e}")
        raise

# ============================================================
# MODEL INFERENCE FUNCTIONS
# ============================================================

def infer_llama(model_data: Dict, prompt: str, max_tokens: int, temperature: float) -> Dict:
    """Run Llama 3.2 1B inference"""
    import torch
    import time
    
    start = time.time()
    
    tokenizer = model_data["tokenizer"]
    model = model_data["model"]
    
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            temperature=temperature,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )
    
    output_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Remove input prompt from output
    if output_text.startswith(prompt):
        output_text = output_text[len(prompt):].strip()
    
    latency = (time.time() - start) * 1000
    
    return {
        "output": output_text,
        "input_tokens": len(inputs.input_ids[0]),
        "output_tokens": len(outputs[0]) - len(inputs.input_ids[0]),
        "latency_ms": latency
    }

# ============================================================
# API ENDPOINTS
# ============================================================

@app.get("/", response_model=Dict)
async def root():
    """Root endpoint"""
    return {
        "service": "NØID Labs Model Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": [
            "/inference",
            "/health",
            "/models"
        ]
    }

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    import psutil
    import time
    
    process = psutil.Process()
    memory_mb = process.memory_info().rss / 1024 / 1024
    
    return HealthResponse(
        status="healthy",
        models_loaded=len(models),
        models_available=[
            "llama-3.2-1b",
            "openclip-vit-b32",
            "paddle-ocr",
            "faster-whisper"
        ],
        memory_usage_mb=memory_mb,
        uptime_seconds=time.time() - app.state.start_time if hasattr(app.state, "start_time") else 0
    )

@app.get("/models", response_model=Dict)
async def list_models():
    """List available models"""
    return {
        "models": {
            "llama-3.2-1b": {
                "type": "llm",
                "loaded": "llama-3.2-1b" in models,
                "memory_mb": 2048,
                "avg_latency_ms": 800
            },
            "openclip-vit-b32": {
                "type": "vision",
                "loaded": "openclip-vit-b32" in models,
                "memory_mb": 600,
                "avg_latency_ms": 150
            },
            "paddle-ocr": {
                "type": "ocr",
                "loaded": "paddle-ocr" in models,
                "memory_mb": 400,
                "avg_latency_ms": 200
            },
            "faster-whisper": {
                "type": "audio",
                "loaded": "faster-whisper" in models,
                "memory_mb": 500,
                "avg_latency_ms": 1000
            }
        }
    }

@app.post("/inference", response_model=InferenceResponse)
async def inference(request: InferenceRequest):
    """Run model inference"""
    try:
        logger.info(f"Inference request: {request.model_id}")
        
        # Load model if not already loaded (lazy loading)
        if request.model_id not in models:
            logger.info(f"Loading model: {request.model_id}")
            
            if request.model_id == "llama-3.2-1b":
                models[request.model_id] = load_llama_3_2_1b()
            elif request.model_id == "openclip-vit-b32":
                models[request.model_id] = load_openclip()
            elif request.model_id == "paddle-ocr":
                models[request.model_id] = load_paddle_ocr()
            elif request.model_id == "faster-whisper":
                models[request.model_id] = load_faster_whisper()
            else:
                raise HTTPException(
                    status_code=404,
                    detail=f"Model {request.model_id} not found"
                )
        
        # Run inference based on model type
        if request.model_id == "llama-3.2-1b":
            result = infer_llama(
                models[request.model_id],
                request.input,
                request.max_tokens,
                request.temperature
            )
        else:
            raise HTTPException(
                status_code=501,
                detail=f"Inference for {request.model_id} not yet implemented"
            )
        
        return InferenceResponse(
            output=result["output"],
            input_tokens=result["input_tokens"],
            output_tokens=result["output_tokens"],
            model=request.model_id,
            finish_reason="stop",
            latency_ms=result["latency_ms"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Inference error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.on_event("startup")
async def startup_event():
    """Initialize service on startup"""
    import time
    app.state.start_time = time.time()
    
    logger.info("🚀 NØID Labs Model Service starting...")
    logger.info(f"   Model cache: {MODEL_CACHE_DIR}")
    logger.info(f"   Max retries: {MAX_RETRIES}")
    logger.info(f"   Timeout: {TIMEOUT}s")
    
    # Create model cache directory
    Path(MODEL_CACHE_DIR).mkdir(parents=True, exist_ok=True)
    
    logger.info("✅ Service ready")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("🛑 Shutting down model service...")
    
    # Clear models from memory
    models.clear()
    
    logger.info("✅ Shutdown complete")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
