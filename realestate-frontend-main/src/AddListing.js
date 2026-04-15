import React, { useState } from "react";
import { getAuth } from "firebase/auth"; // ✅ import to get current user
import { useNavigate } from "react-router-dom";
import { useLanguage } from "./context/LanguageContext";
import API_URL from "./config";
import { geocodeAddress } from "./utils/mapbox";

export default function AddListing() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    price: "",
    rooms: "",
    bathrooms: "",
    size: "",
    description: "",
    type: "sale", // default to "sale"
    property_type: "", // private_home, apartment, land
    images: [],
    floor_plan: null,
    latitude: null,
    longitude: null,
    // New apartment/house features
    has_elevator: false,
    has_parking: false,
    has_garage: false,
    floor: "",
    total_floors: "",
    has_balcony: false,
  });
  const [imagePreviews, setImagePreviews] = useState([]);
  const [floorPlanPreview, setFloorPlanPreview] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [switchingPropertyType, setSwitchingPropertyType] = useState(false);
  const geocodeTimeout = React.useRef(null); // For debouncing geocoding
  const [locationError, setLocationError] = useState(''); // For location format validation

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle property type change with loading animation
  const handlePropertyTypeChange = (e) => {
    const newPropertyType = e.target.value;

    // Show loading animation
    setSwitchingPropertyType(true);

    // After a brief delay, update the form
    setTimeout(() => {
      setFormData({
        ...formData,
        property_type: newPropertyType,
        // Clear fields that might not be relevant for new type
        rooms: newPropertyType === 'land' ? '' : formData.rooms,
        bathrooms: newPropertyType === 'land' ? '' : formData.bathrooms,
      });
      setSwitchingPropertyType(false);
    }, 500);
  };

  // Geocode location when user types (with debouncing and validation)
  const handleLocationChange = async (e) => {
    const address = e.target.value;
    setFormData(prev => ({ ...prev, location: address }));

    // Clear previous timeout
    if (geocodeTimeout.current) {
      clearTimeout(geocodeTimeout.current);
    }

    // Validate location format (must contain a comma)
    if (address.length > 0 && !address.includes(',')) {
      setLocationError(t('locationFormatError') || 'Please use format: City, Street (e.g., Vlore, Lungomare)');
      setFormData(prev => ({ ...prev, latitude: null, longitude: null }));
      return;
    } else {
      setLocationError('');
    }

    if (address.length < 5) {
      // Clear coordinates if address is too short
      setFormData(prev => ({ ...prev, latitude: null, longitude: null }));
      return;
    }

    // Check if location has proper format (City, Street)
    if (!address.includes(',')) {
      return; // Don't geocode without comma
    }

    // Debounce: wait 800ms after user stops typing
    geocodeTimeout.current = setTimeout(async () => {
      setGeocoding(true);
      try {
        console.log('🗺️ Geocoding address (client-side):', address);

        // Use client-side Mapbox geocoding (works with domain-restricted tokens)
        const coords = await geocodeAddress(address);

        console.log('✅ Geocoding success:', coords);

        setFormData(prev => ({
          ...prev,
          latitude: coords.latitude,
          longitude: coords.longitude
        }));

      } catch (error) {
        console.error('❌ Geocoding error:', error);

        // Keep the location text but clear coordinates
        setFormData(prev => ({ ...prev, latitude: null, longitude: null }));
      } finally {
        setGeocoding(false);
      }
    }, 800); // Wait 800ms after user stops typing
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate file types - only allow .jpg, .jpeg, and .png
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      alert('Only JPG and PNG images are allowed. Please select valid image files.');
      e.target.value = ''; // Clear the input
      return;
    }

    // Validate file sizes - maximum 6MB per image
    const maxSize = 6 * 1024 * 1024; // 6MB in bytes
    const oversizedFiles = files.filter(file => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      const oversizedNames = oversizedFiles.map(f => `${f.name} (${(f.size / 1024 / 1024).toFixed(2)}MB)`).join(', ');
      alert(`The following images exceed 6MB limit:\n${oversizedNames}\n\nPlease compress or select smaller images.`);
      e.target.value = ''; // Clear the input
      return;
    }

    setFormData({ ...formData, images: e.target.files });

    // Create preview URLs for the selected images
    const previews = [];
    for (let i = 0; i < files.length; i++) {
      previews.push(URL.createObjectURL(files[i]));
    }
    setImagePreviews(previews);
  };

  const removeImage = (index) => {
    // Create new FileList without the removed image
    const dt = new DataTransfer();
    const { images } = formData;

    for (let i = 0; i < images.length; i++) {
      if (i !== index) {
        dt.items.add(images[i]);
      }
    }

    setFormData({ ...formData, images: dt.files });

    // Remove preview
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImagePreviews(newPreviews);
  };

  const handleFloorPlanChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Validate file type - only allow .jpg, .jpeg, and .png
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('Only JPG and PNG images are allowed for floor plans.');
      e.target.value = '';
      return;
    }

    // Validate file size - maximum 6MB
    const maxSize = 6 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`Floor plan exceeds 6MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB). Please compress or select a smaller image.`);
      e.target.value = '';
      return;
    }

    setFormData({ ...formData, floor_plan: file });
    setFloorPlanPreview(URL.createObjectURL(file));
  };

  const removeFloorPlan = () => {
    setFormData({ ...formData, floor_plan: null });
    setFloorPlanPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert(t('mustBeLoggedIn'));
      return;
    }

    // Validate location format
    if (!formData.location.includes(',')) {
      alert(t('locationFormatError') || 'Please use proper format: City, Street (e.g., Vlore, Lungomare)');
      return;
    }

    // Check if location was successfully geocoded
    if (!formData.latitude || !formData.longitude) {
      alert(t('locationNotGeocoded') || 'Please wait for the location to be verified or use a different format');
      return;
    }

    setUploading(true);
    setUploadProgress(t('preparingListing'));

    const data = new FormData();
    data.append("firebase_uid", user.uid); // ✅ required by backend

    // Properly handle form data - don't send null or empty values
    Object.keys(formData).forEach((key) => {
      if (key === "images") {
        // Handle images separately
        for (let i = 0; i < formData.images.length; i++) {
          data.append("images", formData.images[i]);
        }
      } else if (key === "floor_plan") {
        // Handle floor plan separately
        if (formData.floor_plan) {
          data.append("floor_plan", formData.floor_plan);
        }
      } else if (key === "latitude" || key === "longitude") {
        // Only append coordinates if they exist and are valid numbers
        if (formData[key] !== null && formData[key] !== "" && !isNaN(formData[key])) {
          data.append(key, formData[key]);
        }
      } else if (formData[key] !== null && formData[key] !== "") {
        // Don't send empty or null values for other fields
        data.append(key, formData[key]);
      }
    });

    try {
      setUploadProgress(t('uploadingImages'));

      const response = await fetch(`${API_URL}/listings/`, {
        method: "POST",
        body: data,
      });

      if (response.ok) {
        const newListing = await response.json();
        // Debug: see what backend returns

        setUploadProgress(t('listingCreatedSuccess'));

        // Wait a moment to show success message
        setTimeout(() => {
          // Extract the listing ID - backend might return it in different formats
          const listingId = newListing.id || newListing.listing_id || newListing.data?.id;

          if (listingId) {
            // Redirect to the new listing page
            navigate(`/listing/${listingId}`);
          } else {

            // Fallback: redirect to profile page where user can see their listings
            navigate('/profile');
          }
        }, 1500);
      } else {
        const errorData = await response.json();

        setUploading(false);
        alert(t('listingAddedError') + ': ' + JSON.stringify(errorData.detail || errorData));
      }
    } catch (error) {

      setUploading(false);
      alert(t('listingUploadError'));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Upload Loading Screen */}
      {uploading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col justify-center items-center z-50">
          <div className="bg-white p-8 md:p-10 rounded-2xl shadow-2xl text-center max-w-md mx-4">
            {/* Animated Icon */}
            <div className="mb-6">
              {uploadProgress === t('listingCreatedSuccess') ? (
                // Success Checkmark
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                // Loading Spinner
                <div className="w-20 h-20 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              )}
            </div>

            {/* Progress Text */}
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {uploadProgress === t('listingCreatedSuccess') ? '🎉 ' + t('success') : t('uploadingListing')}
            </h3>
            <p className="text-lg text-gray-600 mb-2">{uploadProgress}</p>

            {uploadProgress === t('listingCreatedSuccess') && (
              <p className="text-sm text-gray-500 mt-4">{t('redirectingToListing')}</p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-blue-600 mb-6 text-center">
          {t('addNewListing')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Listing Type Toggle */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-gray-700 font-medium">{t('listingType')}:</span>
            <div className="flex bg-gray-200 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "sale" })}
                className={`px-6 py-2 rounded-lg font-semibold transition ${formData.type === "sale"
                  ? "bg-blue-600 text-white"
                  : "bg-transparent text-gray-700 hover:bg-gray-300"
                  }`}
              >
                {t('forSale')}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: "rent" })}
                className={`px-6 py-2 rounded-lg font-semibold transition ${formData.type === "rent"
                  ? "bg-blue-600 text-white"
                  : "bg-transparent text-gray-700 hover:bg-gray-300"
                  }`}
              >
                {t('forRent')}
              </button>
            </div>
          </div>

          {/* Form Fields in Grid Layout */}
          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="title"
              type="text"
              placeholder={t('propertyTitlePlaceholder')}
              value={formData.title}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg"
              required
            />
            <div className="relative">
              <div>
                <input
                  name="location"
                  type="text"
                  placeholder={t('locationPlaceholder') || "e.g., Vlore, Lungomare"}
                  value={formData.location}
                  onChange={handleLocationChange}
                  className={`w-full p-3 border ${locationError ? 'border-red-500' : 'border-gray-300'} rounded-lg`}
                  required
                />
                {/* Helper text */}
                <p className="text-xs text-gray-500 mt-1">
                  💡 {t('locationHint') || 'Use format: City, Street (e.g., Vlore, Lungomare)'}
                </p>

                {/* Error message */}
                {locationError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {locationError}
                  </p>
                )}
              </div>

              {/* Geocoding indicator */}
              {geocoding && (
                <span className="absolute right-3 top-3 text-xs text-gray-500">
                  📍 {t('geocoding')}...
                </span>
              )}

              {/* Success indicator */}
              {formData.latitude && formData.longitude && !geocoding && !locationError && (
                <span className="absolute right-3 top-3 text-xs text-green-600">
                  ✅ {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                </span>
              )}
            </div>
            <input
              name="price"
              type="number"
              placeholder={t('pricePlaceholder')}
              value={formData.price}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg"
              required
            />
            <select
              name="property_type"
              value={formData.property_type}
              onChange={handlePropertyTypeChange}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white"
              required
            >
              <option value="">{t('selectPropertyType')}</option>
              <option value="apartment">{t('apartment')}</option>
              <option value="private_home">{t('privateHome')}</option>
              <option value="land">{t('land')}</option>
              <option value="business">{t('business')}</option>
            </select>

            {/* Property Type Switching Loading */}
            {switchingPropertyType && (
              <div className="flex items-center justify-center py-4 gap-3">
                <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <span className="text-gray-600">{t('updatingForm')}...</span>
              </div>
            )}

            {/* Conditional Fields based on Property Type */}
            {!switchingPropertyType && (
              <div className="space-y-4">
                {/* Size - Show for all types */}
                <input
                  name="size"
                  type="number"
                  placeholder={t('sizePlaceholder')}
                  value={formData.size}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />

                {/* Rooms and Bathrooms - Only for Apartment and Private Home */}
                {(formData.property_type === 'apartment' || formData.property_type === 'private_home') && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        name="rooms"
                        type="number"
                        placeholder={t('roomsPlaceholder')}
                        value={formData.rooms}
                        onChange={handleChange}
                        className="p-3 border border-gray-300 rounded-lg"
                      />
                      <input
                        name="bathrooms"
                        type="number"
                        placeholder={t('bathroomsPlaceholder')}
                        value={formData.bathrooms}
                        onChange={handleChange}
                        className="p-3 border border-gray-300 rounded-lg"
                      />
                    </div>

                    {/* Additional apartment/house features */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-700">{t('additionalFeatures')}</h3>

                      {/* Floor Information */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('floor')}
                          </label>
                          <input
                            name="floor"
                            type="number"
                            min="0"
                            placeholder={t('floorPlaceholder')}
                            value={formData.floor}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {t('totalFloors')}
                          </label>
                          <input
                            name="total_floors"
                            type="number"
                            min="1"
                            placeholder={t('totalFloorsPlaceholder')}
                            value={formData.total_floors}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Amenities Checkboxes */}
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            name="has_elevator"
                            type="checkbox"
                            checked={formData.has_elevator}
                            onChange={(e) => setFormData({ ...formData, has_elevator: e.target.checked })}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{t('hasElevator')}</span>
                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            name="has_parking"
                            type="checkbox"
                            checked={formData.has_parking}
                            onChange={(e) => setFormData({ ...formData, has_parking: e.target.checked })}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{t('hasParking')}</span>
                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            name="has_garage"
                            type="checkbox"
                            checked={formData.has_garage}
                            onChange={(e) => setFormData({ ...formData, has_garage: e.target.checked })}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{t('hasGarage')}</span>
                        </label>

                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            name="has_balcony"
                            type="checkbox"
                            checked={formData.has_balcony}
                            onChange={(e) => setFormData({ ...formData, has_balcony: e.target.checked })}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{t('hasBalcony')}</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {/* Business-specific fields hint */}
                {formData.property_type === 'business' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                    <p className="font-semibold mb-1">💼 {t('businessPropertyNote')}</p>
                    <p>{t('businessPropertyDescription')}</p>
                  </div>
                )}

                {/* Land-specific fields hint */}
                {formData.property_type === 'land' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                    <p className="font-semibold mb-1">🌿 {t('landPropertyNote')}</p>
                    <p>{t('landPropertyDescription')}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <textarea
            name="description"
            placeholder={t('descriptionPlaceholder')}
            value={formData.description}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg"
            rows="3"
          ></textarea>

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('uploadImages')}
            </label>
            <input
              type="file"
              multiple
              onChange={handleImageChange}
              className="w-full p-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              accept=".jpg,.jpeg,.png"
            />
            <p className="text-sm text-gray-500 mt-1">
              {t('multipleImagesNote')} (Only JPG and PNG files, max 6MB each)
            </p>
          </div>

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                {t('selectedImages')} ({imagePreviews.length})
              </p>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Floor Plan Upload Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📐 Floor Plan (Optional)
            </label>
            <input
              type="file"
              onChange={handleFloorPlanChange}
              className="w-full p-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              accept=".jpg,.jpeg,.png"
            />
            <p className="text-sm text-gray-500 mt-1">
              Upload a floor plan image (JPG or PNG, max 6MB)
            </p>
          </div>

          {/* Floor Plan Preview */}
          {floorPlanPreview && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Floor Plan Preview
              </p>
              <div className="relative inline-block">
                <img
                  src={floorPlanPreview}
                  alt="Floor Plan Preview"
                  className="max-w-full h-48 object-contain rounded-lg border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeFloorPlan}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-2 hover:bg-red-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
          >
            {t('submitListing')}
          </button>
        </form>
      </div>
    </div>
  );
}

