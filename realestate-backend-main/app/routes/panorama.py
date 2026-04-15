from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import List, Optional
import cv2
import numpy as np
import os
import uuid
from datetime import datetime
import json
from app.database import SessionLocal
from app.models import Listing

router = APIRouter()

UPLOAD_DIR = "uploads"
PANORAMA_DIR = os.path.join(UPLOAD_DIR, "panoramas")
os.makedirs(PANORAMA_DIR, exist_ok=True)


def preprocess_image(image: np.ndarray) -> np.ndarray:
    """Normalize exposure/contrast and gently denoise before stitching."""
    if image is None:
        return image

    h, w = image.shape[:2]
    max_dim = 1800
    if max(h, w) > max_dim:
        scale = max_dim / max(h, w)
        image = cv2.resize(image, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    blurred = cv2.GaussianBlur(image, (3, 3), 0)
    lab = cv2.cvtColor(blurred, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge((l, a, b))
    enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    return enhanced


def cylindrical_warp(image: np.ndarray, focal_length: Optional[float] = None) -> np.ndarray:
    """Apply cylindrical projection to minimize distortion at the edges."""
    if image is None:
        return image
    h, w = image.shape[:2]
    if h == 0 or w == 0:
        return image
    h, w = image.shape[:2]
    if focal_length is None:
        focal_length = max(w, h) / (2 * np.tan(np.pi / 8))

    K = np.array([[focal_length, 0, w / 2],
                  [0, focal_length, h / 2],
                  [0, 0, 1]], dtype=np.float32)

    y_i, x_i = np.indices((h, w))
    X = (x_i - K[0, 2]) / focal_length
    Y = (y_i - K[1, 2]) / focal_length
    Z = np.sqrt(X ** 2 + 1)

    map_x = focal_length * np.arctan(X) + K[0, 2]
    map_y = focal_length * (Y / Z) + K[1, 2]

    try:
        warped = cv2.remap(
            image,
            map_x.astype(np.float32),
            map_y.astype(np.float32),
            interpolation=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_REFLECT
        )
        if warped is None or warped.size == 0:
            return image
        return warped
    except cv2.error:
        # Fall back to original frame if remap fails
        return image


def auto_crop_panorama(panorama: np.ndarray) -> np.ndarray:
    """Remove black borders left from stitching."""
    if panorama is None:
        return panorama
    gray = cv2.cvtColor(panorama, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 1, 255, cv2.THRESH_BINARY)
    contours = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = contours[0] if len(contours) == 2 else contours[1]
    if not contours:
        return panorama
    largest = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest)
    cropped = panorama[y:y + h, x:x + w]
    return cropped


def enhance_panorama(panorama: np.ndarray) -> np.ndarray:
    """Final touchups for color and clarity."""
    if panorama is None:
        return panorama
    detailed = cv2.detailEnhance(panorama, sigma_s=10, sigma_r=0.15)
    sharpen = cv2.GaussianBlur(detailed, (0, 0), 0.7)
    enhanced = cv2.addWeighted(detailed, 1.15, sharpen, -0.15, 0)
    return enhanced


def configure_stitcher(instance):
    """Apply best-effort quality settings if available in current OpenCV build."""
    settings = [
        ("setPanoConfidenceThresh", 0.65),
        ("setSeamEstimationResol", 0.08),
        ("setCompositingResol", -1),
        ("setRegistrationResol", 0.6),
        ("setWaveCorrection", True),
    ]
    for attr, value in settings:
        if hasattr(instance, attr):
            getattr(instance, attr)(value)
    if hasattr(instance, "setWaveCorrectKind") and hasattr(cv2, "detail"):
        wave_kind = getattr(cv2.detail, "WAVE_CORRECT_HORIZ", None)
        if wave_kind is not None:
            instance.setWaveCorrectKind(wave_kind)


def stitch_panorama(image_files: List[UploadFile]) -> str:
    """
    Stitch multiple images into a 360° panorama using OpenCV.
    
    Args:
        image_files: List of uploaded image files
        
    Returns:
        str: Path to the stitched panorama image
        
    Raises:
        HTTPException: If stitching fails
    """
    try:
        # Read images
        images = []
        temp_paths = []
        for img_file in image_files:
            # Save temporarily
            temp_path = f"/tmp/{uuid.uuid4().hex}_{img_file.filename}"
            with open(temp_path, "wb") as f:
                f.write(img_file.file.read())
            temp_paths.append(temp_path)
            
            # Read with OpenCV
            img = cv2.imread(temp_path)
            if img is None:
                raise HTTPException(status_code=400, detail=f"Failed to read image: {img_file.filename}")
            processed = preprocess_image(img)
            warped = cylindrical_warp(processed)
            images.append(warped)
        
        # Validate we have enough images
        if len(images) < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 images for panorama")
        
        print(f"📸 Stitching {len(images)} images...")
        
        # Try SCANS mode first (more lenient, better for handheld photos)
        stitcher = cv2.Stitcher_create(cv2.Stitcher_SCANS)
        configure_stitcher(stitcher)
        status, panorama = stitcher.stitch(images)
        
        # If SCANS mode fails, try PANORAMA mode
        if status != cv2.Stitcher_OK:
            print("⚠️ SCANS mode failed, trying PANORAMA mode...")
            stitcher = cv2.Stitcher_create(cv2.Stitcher_PANORAMA)
            configure_stitcher(stitcher)
            status, panorama = stitcher.stitch(images)
        
        if status == cv2.Stitcher_OK:
            panorama = auto_crop_panorama(panorama)
            panorama = enhance_panorama(panorama)

            # Generate unique filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            panorama_filename = f"panorama_{timestamp}_{uuid.uuid4().hex[:8]}.jpg"
            panorama_path = os.path.join(PANORAMA_DIR, panorama_filename)
            
            # Save the panorama
            cv2.imwrite(panorama_path, panorama, [cv2.IMWRITE_JPEG_QUALITY, 95])
            
            print(f"✅ Panorama created: {panorama_path}")
            
            # Clean up temp files
            for temp_path in temp_paths:
                try:
                    os.remove(temp_path)
                except:
                    pass
            
            return f"panoramas/{panorama_filename}"
        
        else:
            error_messages = {
                cv2.Stitcher_ERR_NEED_MORE_IMGS: "Need more images",
                cv2.Stitcher_ERR_HOMOGRAPHY_EST_FAIL: "Homography estimation failed - images don't overlap enough",
                cv2.Stitcher_ERR_CAMERA_PARAMS_ADJUST_FAIL: "Camera parameters adjustment failed"
            }
            error_msg = error_messages.get(status, f"Unknown error (code: {status})")
            
            # Clean up temp files
            for temp_path in temp_paths:
                try:
                    os.remove(temp_path)
                except:
                    pass
            
            raise HTTPException(status_code=400, detail=f"Stitching failed: {error_msg}")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in stitch_panorama: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing images: {str(e)}")


@router.post("/panorama/stitch")
async def create_panorama(
    images: List[UploadFile] = File(..., description="Images to stitch (2-8 images recommended)")
):
    """
    Create a 360° panorama from multiple images.
    
    - **images**: Upload 2-8 overlapping images taken at different angles
    - Returns the path to the stitched panorama
    
    ## Usage:
    1. Capture 4-8 photos rotating around a point (0°, 45°, 90°, 135°, etc.)
    2. Upload them to this endpoint
    3. Get back a stitched panorama URL
    
    ## Tips for best results:
    - Use consistent camera settings
    - Overlap images by 30-50%
    - Keep the camera at the same height
    - Avoid moving objects in the scene
    """
    if len(images) < 2:
        raise HTTPException(status_code=400, detail="Please upload at least 2 images")
    
    if len(images) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 images allowed")
    
    panorama_path = stitch_panorama(images)
    
    return {
        "success": True,
        "panorama_url": f"/uploads/{panorama_path}",
        "message": f"Successfully stitched {len(images)} images into a panorama"
    }


@router.post("/panorama/stitch-for-listing/{listing_id}")
async def create_panorama_for_listing(
    listing_id: int,
    images: List[UploadFile] = File(...),
    firebase_uid: str = Form(...)
):
    """
    Create a 360° panorama and automatically add it to a listing.
    
    - **listing_id**: The ID of the listing to add the panorama to
    - **images**: Images to stitch
    - **firebase_uid**: User's Firebase UID for authorization
    
    Returns the updated listing with the panorama added to images
    """
    db = SessionLocal()
    try:
        # Verify listing exists and user owns it
        listing = db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if listing.firebase_uid != firebase_uid:
            raise HTTPException(status_code=403, detail="Not authorized to modify this listing")
        
        # Stitch the panorama
        panorama_path = stitch_panorama(images)
        panorama_url = f"/uploads/{panorama_path}"
        
        # Add to listing images
        current_images = json.loads(listing.images) if listing.images else []
        current_images.append(panorama_url)
        listing.images = json.dumps(current_images)
        
        db.commit()
        db.refresh(listing)
        
        return {
            "success": True,
            "panorama_url": panorama_url,
            "listing_id": listing_id,
            "total_images": len(current_images),
            "message": f"Panorama added to listing #{listing_id}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.post("/panorama/test-quality")
async def test_image_quality(
    images: List[UploadFile] = File(...)
):
    """
    Test if images are suitable for panorama stitching before actually stitching.
    Returns quality metrics and recommendations.
    """
    if len(images) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 images to test")
    
    try:
        quality_report = {
            "total_images": len(images),
            "images": [],
            "recommendations": []
        }
        
        for idx, img_file in enumerate(images):
            # Read image
            contents = await img_file.read()
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                quality_report["images"].append({
                    "index": idx,
                    "filename": img_file.filename,
                    "status": "error",
                    "message": "Could not read image"
                })
                continue
            
            height, width = img.shape[:2]
            
            # Check resolution
            megapixels = (height * width) / 1_000_000
            
            # Check if grayscale or color
            is_color = len(img.shape) == 3
            
            quality_report["images"].append({
                "index": idx,
                "filename": img_file.filename,
                "width": width,
                "height": height,
                "megapixels": round(megapixels, 2),
                "is_color": is_color,
                "status": "ok" if megapixels >= 1 else "low_quality"
            })
            
            # Reset file pointer for potential reuse
            await img_file.seek(0)
        
        # Add recommendations
        avg_megapixels = np.mean([img["megapixels"] for img in quality_report["images"] if img.get("megapixels")])
        
        if avg_megapixels < 2:
            quality_report["recommendations"].append("Consider using higher resolution images (2MP+)")
        
        if len(images) < 4:
            quality_report["recommendations"].append("4-8 images recommended for best panorama quality")
        
        if len(images) > 10:
            quality_report["recommendations"].append("Too many images may cause stitching issues")
        
        quality_report["ready_to_stitch"] = len(quality_report["recommendations"]) == 0
        
        return quality_report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing images: {str(e)}")
