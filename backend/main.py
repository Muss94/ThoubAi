from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
# from cutter import Cutter (Moved to lazy loader)
# from virtual_mirror import NeuralMirror (Moved to lazy loader)
import traceback
import os
import shutil
from utils import convert_heic_to_jpg
from supabase import create_client, Client
import requests

from fastapi.security import APIKeyHeader
from fastapi import Depends, Security

app = FastAPI(title="Thoub-AI Backend", version="0.1.0")

# Security Configuration
API_KEY_NAME = "X-Thoub-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)

# This would ideally come from an environment variable in production
THOUB_API_KEY = os.getenv("THOUB_API_KEY", "thoub-ai-artisan-2025-v1")

async def get_api_key(api_key: str = Security(api_key_header)):
    if api_key == THOUB_API_KEY:
        return api_key
    raise HTTPException(
        status_code=403,
        detail="Unauthorized Access: Invalid API Key"
    )

# Describe allowed origins
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://thoub-ai.vercel.app", 
]

from fastapi import Request
import time

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    print(f"DEBUG: Incoming {request.method} {request.url}")
    try:
        response = await call_next(request)
        duration = time.time() - start_time
        print(f"DEBUG: Outgoing {response.status_code} (took {duration:.2f}s)")
        return response
    except Exception as e:
        print(f"DEBUG: Request failed: {e}")
        raise

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the uploads directory to serve static files
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Supabase Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "thoub-images")

import asyncio

supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"FAILED TO INITIALIZE SUPABASE: {e}")

cutter_service = Cutter()
mirror_service = NeuralMirror()

async def heartbeat():
    while True:
        print("DEBUG: HEARTBEAT - I AM ALIVE AND LISTENING")
        await asyncio.sleep(5)

@app.on_event("startup")
async def startup_event():
    print(f"DEBUG: Starting application on PORT: {os.getenv('PORT')}")
    # Start heartbeat
    asyncio.create_task(heartbeat())

_cutter_service = None
_mirror_service = None

def get_cutter_service():
    global _cutter_service
    if _cutter_service is None:
        from cutter import Cutter
        _cutter_service = Cutter()
    return _cutter_service

def get_mirror_service():
    global _mirror_service
    if _mirror_service is None:
        from virtual_mirror import NeuralMirror
        _mirror_service = NeuralMirror()
    return _mirror_service

@app.get("/")
def read_root():
    return {
        "message": "Thoub-AI Backend Operational",
        "status": "online"
    }

@app.get("/ping")
def ping():
    return "pong"

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/measure")
async def measure_body(
    front_image: UploadFile = File(...),
    side_image: Optional[UploadFile] = File(None),
    profile_image: UploadFile = File(...),
    height_cm: float = Form(...),
    fit_type: str = Form("Standard"),
    api_key: str = Depends(get_api_key)
):
    try:
        # Create uploads directory
        os.makedirs("uploads", exist_ok=True)
        
        # Save Front Image
        front_path = f"uploads/{front_image.filename}"
        with open(front_path, "wb") as buffer:
            shutil.copyfileobj(front_image.file, buffer)
        
        # Convert HEIC to JPG if necessary
        front_path = convert_heic_to_jpg(front_path)
        front_filename = os.path.basename(front_path)
            
        # Save Side Image if exists
        side_path = None
        side_filename = None
        if side_image:
            side_path = f"uploads/{side_image.filename}"
            with open(side_path, "wb") as buffer:
                shutil.copyfileobj(side_image.file, buffer)
            
            # Convert HEIC to JPG if necessary
            side_path = convert_heic_to_jpg(side_path)
            side_filename = os.path.basename(side_path)

        # Save Profile Image
        profile_path = f"uploads/{profile_image.filename}"
        with open(profile_path, "wb") as buffer:
            shutil.copyfileobj(profile_image.file, buffer)
        
        # Convert HEIC to JPG if necessary
        profile_path = convert_heic_to_jpg(profile_path)
        profile_filename = os.path.basename(profile_path)

        # Process measurements (still using in-memory bytes for Cutter for speed, or read from disk)
        # We'll read from disk to be consistent or just re-open. 
        # For Cutter.process, it takes bytes. Let's read from file.
        with open(front_path, "rb") as f:
            front_content = f.read()
            
        cutter = get_cutter_service()
        if not cutter:
            raise HTTPException(status_code=503, detail="Cutter service is not available (MediaPipe initialization failed)")
            
        result = cutter.process(front_content, height_cm, fit_type)
        
        # Add image_ids to result for frontend to pass back
        result["image_ids"] = {
            "front": front_filename,
            "side": side_filename,
            "profile": profile_filename
        }
        
        return result
        
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

@app.post("/try-on")
async def try_on(
    profile_image_id: str = Form(...),
    texture_id: str = Form(...),
    pattern_id: str = Form("solid"),
    style_config: str = Form(...),
    closure_type: str = Form("buttons"),
    has_pocket: bool = Form(True),
    extra_details: str = Form(""),
    api_key: str = Depends(get_api_key)
):
    try:
        image_path = f"uploads/{profile_image_id}"
        
        # If not local, try fetching from Supabase
        if not os.path.exists(image_path) and supabase:
            print(f"Image not found locally, fetching {profile_image_id} from Supabase...")
            res = supabase.storage.from_(SUPABASE_BUCKET).download(profile_image_id)
            os.makedirs("uploads", exist_ok=True)
            with open(image_path, "wb") as f:
                f.write(res)
        
        if not os.path.exists(image_path):
             return JSONResponse(status_code=404, content={"error": f"Image not found at {image_path}"})
        
        # Call Neural Mirror (Gemini)
        # Note: image_path needs to be absolute for some SDKs, or relative is fine.
        # virtual_mirror.py uses it directly.
        
        mirror = get_mirror_service()
        if not mirror:
             return JSONResponse(status_code=503, content={"error": "Neural Mirror service is not available (Gemini initialization failed)"})

        result = mirror.generate_try_on(
            image_path, 
            texture_id, 
            pattern_id, 
            style_config, 
            closure_type, 
            has_pocket, 
            extra_details,
            profile_image_id,
            supabase_client=supabase,
            bucket_name=SUPABASE_BUCKET
        ) # Updated to pass all new params
        
        return result

    except Exception as e:
        print(f"Error in try-on: {e}") # Changed error logging
        return JSONResponse(status_code=500, content={"error": str(e)}) # Changed to JSONResponse

@app.post("/upload-image")
async def upload_image(
    image: UploadFile = File(...),
    api_key: str = Depends(get_api_key)
):
    try:
        # Save Image locally first for conversion
        local_path = f"uploads/{image.filename}"
        os.makedirs("uploads", exist_ok=True)
        with open(local_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Convert HEIC to JPG if necessary
        local_path = convert_heic_to_jpg(local_path)
        filename = os.path.basename(local_path)
        
        # Upload to Supabase if configured
        public_url = filename
        if supabase:
            with open(local_path, "rb") as f:
                supabase.storage.from_(SUPABASE_BUCKET).upload(
                    path=filename,
                    file=f,
                    file_options={"upsert": "true"}
                )
            public_url = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(filename)
            
        return {
            "success": True,
            "filename": filename,
            "url": public_url
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
