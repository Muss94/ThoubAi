from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from cutter import Cutter
from virtual_mirror import NeuralMirror
import traceback
import os
import shutil
from utils import convert_heic_to_jpg

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
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the uploads directory to serve static files
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

cutter_service = Cutter()
mirror_service = NeuralMirror()

@app.get("/")
def read_root():
    return {"message": "Thoub-AI Backend Operational"}

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
            
        result = cutter_service.process(front_content, height_cm, fit_type)
        
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
        # Construct absolute path to the saved image
        BASE_DIR = os.path.dirname(os.path.abspath(__file__))
        UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
        image_path = os.path.join(UPLOAD_DIR, profile_image_id)
        
        if not os.path.exists(image_path):
             return JSONResponse(status_code=404, content={"error": f"Image not found at {image_path}"})
        
        # Call Neural Mirror (Gemini)
        # Note: image_path needs to be absolute for some SDKs, or relative is fine.
        # virtual_mirror.py uses it directly.
        
        result = mirror_service.generate_try_on(
            image_path, 
            texture_id, 
            pattern_id, 
            style_config, 
            closure_type, 
            has_pocket, 
            extra_details,
            profile_image_id
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
        os.makedirs("uploads", exist_ok=True)
        
        # Save Image
        file_path = f"uploads/{image.filename}"
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        
        # Convert HEIC to JPG if necessary
        file_path = convert_heic_to_jpg(file_path)
        filename = os.path.basename(file_path)
            
        return {
            "success": True,
            "filename": filename,
            "url": f"http://localhost:8000/uploads/{filename}"
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
