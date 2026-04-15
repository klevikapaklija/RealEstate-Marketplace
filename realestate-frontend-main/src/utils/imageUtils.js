import API_URL from '../config';

/**
 * Get the correct image URL
 * If it's a Cloudinary URL (starts with http/https), use it directly
 * If it's a local path (uploads/...), prepend API_URL
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // If it's already a full URL (Cloudinary), use it as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Otherwise, it's a local path - prepend API_URL
  return `${API_URL}/${imagePath}`;
};
