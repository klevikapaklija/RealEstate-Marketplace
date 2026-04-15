"""
Cloudinary Integration for Image Uploads
Replace local file storage with cloud storage to persist images across deployments
"""

import cloudinary
import cloudinary.uploader
import os
from typing import List
from fastapi import UploadFile

# Configure Cloudinary (add these to Railway environment variables)
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET")
)

async def upload_image_to_cloudinary(file: UploadFile, folder: str = "listings") -> str:
    """
    Upload image to Cloudinary and return the URL
    
    Args:
        file: FastAPI UploadFile object
        folder: Cloudinary folder name
    
    Returns:
        str: Cloudinary image URL
    """
    try:
        # Read file content
        contents = await file.read()
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            contents,
            folder=folder,
            resource_type="auto",
            transformation=[
                {"width": 1200, "height": 900, "crop": "limit"},  # Max dimensions
                {"quality": "auto"},  # Auto quality optimization
                {"fetch_format": "auto"}  # Auto format (WebP for modern browsers)
            ]
        )
        
        return result["secure_url"]
    except Exception as e:
        print(f"Error uploading to Cloudinary: {e}")
        raise

async def upload_multiple_images(files: List[UploadFile], folder: str = "listings") -> List[str]:
    """
    Upload multiple images to Cloudinary
    
    Returns:
        List[str]: List of Cloudinary URLs
    """
    urls = []
    for file in files:
        url = await upload_image_to_cloudinary(file, folder)
        urls.append(url)
    return urls

def delete_image_from_cloudinary(public_id: str) -> bool:
    """
    Delete image from Cloudinary
    
    Args:
        public_id: Cloudinary public ID (extracted from URL)
    
    Returns:
        bool: True if deleted successfully
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        return result.get("result") == "ok"
    except Exception as e:
        print(f"Error deleting from Cloudinary: {e}")
        return False

def extract_public_id_from_url(url: str) -> str:
    """
    Extract Cloudinary public_id from URL
    Example: https://res.cloudinary.com/demo/image/upload/v1234/listings/abc123.jpg
    Returns: listings/abc123
    """
    parts = url.split("/")
    # Find 'upload' in URL and get everything after version number
    upload_index = parts.index("upload")
    public_id_parts = parts[upload_index + 2:]  # Skip version number
    public_id = "/".join(public_id_parts).rsplit(".", 1)[0]  # Remove file extension
    return public_id
