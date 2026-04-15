"""
Test script for 360° Panorama API

This demonstrates how to use the panorama endpoints.
"""

import requests

# Your backend URL
BASE_URL = "https://realestateal.up.railway.app"  # or "http://localhost:8000" for local testing

def test_panorama_stitching():
    """Test basic panorama stitching"""
    
    # Example: Upload multiple images
    files = [
        ('images', open('test_image_1.jpg', 'rb')),
        ('images', open('test_image_2.jpg', 'rb')),
        ('images', open('test_image_3.jpg', 'rb')),
        ('images', open('test_image_4.jpg', 'rb')),
    ]
    
    response = requests.post(f"{BASE_URL}/panorama/stitch", files=files)
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Success!")
        print(f"Panorama URL: {BASE_URL}{data['panorama_url']}")
        print(f"Message: {data['message']}")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.json())


def test_panorama_for_listing(listing_id: int, firebase_uid: str):
    """Test adding panorama to a listing"""
    
    files = [
        ('images', open('test_image_1.jpg', 'rb')),
        ('images', open('test_image_2.jpg', 'rb')),
        ('images', open('test_image_3.jpg', 'rb')),
        ('images', open('test_image_4.jpg', 'rb')),
    ]
    
    data = {'firebase_uid': firebase_uid}
    
    response = requests.post(
        f"{BASE_URL}/panorama/stitch-for-listing/{listing_id}",
        files=files,
        data=data
    )
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Panorama added to listing!")
        print(f"Panorama URL: {BASE_URL}{result['panorama_url']}")
        print(f"Listing ID: {result['listing_id']}")
        print(f"Total images: {result['total_images']}")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.json())


def test_image_quality():
    """Test image quality before stitching"""
    
    files = [
        ('images', open('test_image_1.jpg', 'rb')),
        ('images', open('test_image_2.jpg', 'rb')),
    ]
    
    response = requests.post(f"{BASE_URL}/panorama/test-quality", files=files)
    
    if response.status_code == 200:
        data = response.json()
        print("📊 Quality Report:")
        print(f"Total images: {data['total_images']}")
        print(f"Ready to stitch: {data['ready_to_stitch']}")
        print("\nImage details:")
        for img in data['images']:
            print(f"  - {img['filename']}: {img['width']}x{img['height']} ({img['megapixels']}MP)")
        
        if data['recommendations']:
            print("\n💡 Recommendations:")
            for rec in data['recommendations']:
                print(f"  - {rec}")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.json())


if __name__ == "__main__":
    print("🧪 Panorama API Test Suite\n")
    
    # Uncomment the test you want to run:
    
    # test_panorama_stitching()
    # test_panorama_for_listing(listing_id=123, firebase_uid="your-firebase-uid")
    # test_image_quality()
    
    print("\n✅ Tests complete!")
