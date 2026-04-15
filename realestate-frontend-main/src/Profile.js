import React, { useEffect, useState } from "react";
import { useAuth } from "./context/AuthContext";
import { useLanguage } from "./context/LanguageContext";
import { useNavigate } from "react-router-dom";
import API_URL from "./config";
import { getImageUrl } from './utils/imageUtils';
import PayPalCardPayment from './components/PayPalCardPayment';
import {
  getAuth,
  deleteUser,
  reauthenticateWithPopup,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  EmailAuthProvider,
  signOut,
  verifyBeforeUpdateEmail,
  updatePassword,
} from "firebase/auth";

export default function Profile() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [editingListing, setEditingListing] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [boostingListing, setBoostingListing] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false); // Show card form or promo details
  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [newFloorPlan, setNewFloorPlan] = useState(null);
  const [floorPlanPreview, setFloorPlanPreview] = useState(null);
  const [removeFloorPlan, setRemoveFloorPlan] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [removeProfilePicture, setRemoveProfilePicture] = useState(false);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [updatingListing, setUpdatingListing] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successType, setSuccessType] = useState('success'); // 'success', 'error', 'warning'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [listingToDelete, setListingToDelete] = useState(null);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showSoldConfirm, setShowSoldConfirm] = useState(false);
  const [listingToMarkSold, setListingToMarkSold] = useState(null);
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false);
  const [showBoostSuccessModal, setShowBoostSuccessModal] = useState(false);

  useEffect(() => {
    if (!user?.firebase_uid) return;

    const fetchUserData = async () => {
      try {
        const currentUser = getAuth().currentUser;
        if (!currentUser) return;

        const token = await currentUser.getIdToken();

        // ✅ Fetch user profile with authorization
        const profileRes = await fetch(`${API_URL}/users/${user.firebase_uid}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        }

        // ✅ Fetch user's listings
        const listingsRes = await fetch(`${API_URL}/listings/user/${user.firebase_uid}`);
        if (listingsRes.ok) {
          const listingsData = await listingsRes.json();
          setListings(listingsData);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };

    fetchUserData();

    // ✅ Listen for email verification and update backend
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      // Check if email was recently updated and sync with backend
      const checkEmailUpdate = async () => {
        await currentUser.reload(); // Refresh user data from Firebase

        // If Firebase email differs from profile email, update backend
        if (currentUser.email && profile && currentUser.email !== profile.email) {
          try {
            const token = await currentUser.getIdToken();
            const res = await fetch(`${API_URL}/users/${user.firebase_uid}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({
                email: currentUser.email,
                name: profile.name,
                surname: profile.surname,
                phone: profile.phone,
              }),
            });

            if (res.ok) {
              const data = await res.json();
              setProfile(data.user);
              console.log('✅ Email updated in backend after verification');
            }
          } catch (error) {
            console.error('Failed to sync email with backend:', error);
          }
        }
      };

      // Check on mount
      checkEmailUpdate();

      // Check periodically for email updates
      const interval = setInterval(checkEmailUpdate, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [user, profile?.email]);


  // ✅ Delete user account (backend + Firebase)
  const handleDeleteAccount = async () => {
    setShowDeleteAccountConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    // Step 0: Ask for password confirmation BEFORE starting deletion
    if (currentUser) {
      // Google login - require reauthentication first
      if (currentUser.providerData.some((p) => p.providerId === "google.com")) {
        const provider = new GoogleAuthProvider();
        try {
          await reauthenticateWithPopup(currentUser, provider);
        } catch (reauthError) {
          // User cancelled reauthentication
          if (reauthError.code === 'auth/popup-closed-by-user' || reauthError.code === 'auth/cancelled-popup-request') {
            setShowDeleteAccountConfirm(false);
            setSuccessMessage(t('accountDeletionCancelled') || 'Account deletion cancelled.');
            setSuccessType('warning');
            setShowSuccessModal(true);
            return;
          }
          setShowDeleteAccountConfirm(false);
          setSuccessMessage(t('accountDeletionError') || `Failed to delete account: ${reauthError.message}`);
          setSuccessType('error');
          setShowSuccessModal(true);
          return;
        }
      }
      // Email/password login - ask for password first
      else if (currentUser.email) {
        const password = window.prompt(t('confirmPasswordToDelete') || "Please confirm your password to delete your account:");
        if (!password) {
          // User cancelled password prompt
          setShowDeleteAccountConfirm(false);
          setSuccessMessage(t('accountDeletionCancelled') || 'Account deletion cancelled.');
          setSuccessType('warning');
          setShowSuccessModal(true);
          return;
        }
        try {
          const credential = EmailAuthProvider.credential(currentUser.email, password);
          await reauthenticateWithCredential(currentUser, credential);
        } catch (reauthError) {
          setShowDeleteAccountConfirm(false);
          setSuccessMessage(t('wrongPassword') || 'Incorrect password. Account deletion cancelled.');
          setSuccessType('error');
          setShowSuccessModal(true);
          return;
        }
      }
    }

    // Password/auth confirmed, NOW proceed with deletion
    setDeletingAccount(true);

    try {
      // Get token before deleting from Firebase
      const token = await currentUser.getIdToken();

      // Step 1: Delete from Firebase Auth first
      if (currentUser) {
        await deleteUser(currentUser);

      }

      // Step 2: Delete user data from backend
      await fetch(`${API_URL}/users/${user.firebase_uid}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Step 3: Cleanup
      setDeletingAccount(false);
      setShowDeleteAccountConfirm(false);
      setSuccessMessage(t('accountDeletedSuccess') || 'Your account has been permanently deleted.');
      setSuccessType('success');
      setShowSuccessModal(true);

      // Wait for user to see the message, then logout
      setTimeout(async () => {
        await signOut(auth);
        window.location.href = "/login";
      }, 2000);
    } catch (error) {

      setDeletingAccount(false);
      setShowDeleteAccountConfirm(false);
      setSuccessMessage(t('accountDeletionError') || `Failed to delete account: ${error.message}`);
      setSuccessType('error');
      setShowSuccessModal(true);
    }
  };

  // ✅ Logout user
  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      window.location.href = "/login";
    } catch (error) {

      alert("Failed to log out: " + error.message);
    }
  };

  // ✅ Reauthentication helper
  const reauthenticate = async (currentUser) => {
    if (currentUser.providerData.some((p) => p.providerId === "google.com")) {
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(currentUser, provider);
    } else if (currentUser.email) {
      const password = window.prompt("Please confirm your password to update your email:");
      if (!password) throw new Error("Reauthentication cancelled.");
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
    }
  };

  // ✅ Update profile info
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    const form = e.target;

    const formData = new FormData();
    formData.append('name', form.name.value);
    formData.append('surname', form.surname.value);
    formData.append('email', form.email.value);
    formData.append('phone', form.phone.value);

    // Handle profile picture
    if (profilePicture) {
      formData.append('profile_picture', profilePicture);
    } else if (removeProfilePicture) {
      formData.append('remove_profile_picture', 'true');
    }

    const auth = getAuth();
    const currentUser = auth.currentUser;

    try {
      // Handle email change in Firebase if changed
      const newEmail = form.email.value;
      if (newEmail !== profile.email && currentUser) {
        try {
          // Send verification email to new address
          await verifyBeforeUpdateEmail(currentUser, newEmail);

          setSuccessMessage(
            t('emailVerificationSent') ||
            `A verification link has been sent to ${newEmail}. Please verify your new email address to complete the change.`
          );
          setSuccessType('warning');
          setShowSuccessModal(true);

          // Note: Don't update backend yet - will update after email is verified
          // User needs to click the link in the email first
          setEditingProfile(false);
          setUpdatingProfile(false);
          return;

        } catch (error) {
          if (error.code === "auth/requires-recent-login") {

            await reauthenticate(currentUser);
            await verifyBeforeUpdateEmail(currentUser, newEmail);

            setSuccessMessage(
              t('emailVerificationSent') ||
              `A verification link has been sent to ${newEmail}. Please verify your new email address to complete the change.`
            );
            setSuccessType('warning');
            setShowSuccessModal(true);
            setEditingProfile(false);
            setUpdatingProfile(false);
            return;
          } else if (error.code === "auth/email-already-in-use") {
            throw new Error(t('emailAlreadyInUse') || 'This email is already in use by another account');
          } else if (error.code === "auth/invalid-email") {
            throw new Error(t('invalidEmail') || 'Invalid email address');
          } else {
            throw error;
          }
        }
      }

      // Update backend (only if email hasn't changed)
      const token = await currentUser.getIdToken();
      const res = await fetch(`${API_URL}/users/${user.firebase_uid}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (jsonError) {
          throw new Error("Failed to parse error response");
        }

        let errorMsg = "Failed to update profile";
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMsg = errorData.detail.map((d) => `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg}`).join("; ");
          } else {
            errorMsg = errorData.detail;
          }
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      setProfile(data.user);
      setEditingProfile(false);
      setProfilePicture(null);
      setProfilePicturePreview(null);
      setRemoveProfilePicture(false);
      setSuccessMessage(t('profileUpdatedSuccess') || 'Profile updated successfully!');
      setSuccessType('success');
      setShowSuccessModal(true);
    } catch (error) {

      setSuccessMessage(t('profileUpdateError') || `Failed to update profile: ${error.message}`);
      setSuccessType('error');
      setShowSuccessModal(true);
    } finally {
      setUpdatingProfile(false);
    }
  };

  // ✅ Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setUpdatingPassword(true);

    const { currentPassword, newPassword, confirmNewPassword } = passwordData;

    // Validate passwords match
    if (newPassword !== confirmNewPassword) {
      setSuccessMessage(t('passwordsDoNotMatch') || 'New passwords do not match!');
      setSuccessType('error');
      setShowSuccessModal(true);
      setUpdatingPassword(false);
      return;
    }

    // Validate password strength
    if (newPassword.length < 6) {
      setSuccessMessage(t('weakPassword') || 'Password must be at least 6 characters long.');
      setSuccessType('error');
      setShowSuccessModal(true);
      setUpdatingPassword(false);
      return;
    }

    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setSuccessMessage(t('pleaseLoginAgain') || 'User not authenticated. Please log in again.');
      setSuccessType('error');
      setShowSuccessModal(true);
      setUpdatingPassword(false);
      return;
    }

    try {
      // Check if user signed in with Google
      const isGoogleUser = currentUser.providerData.some((p) => p.providerId === "google.com");

      if (isGoogleUser) {
        setSuccessMessage(t('cannotChangePasswordGoogle') || 'You signed in with Google. Password change is not available for Google accounts.');
        setSuccessType('warning');
        setShowSuccessModal(true);
        setUpdatingPassword(false);
        setShowChangePassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
        return;
      }

      // Reauthenticate with current password
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);


      // Update password
      await updatePassword(currentUser, newPassword);


      setShowChangePassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setSuccessMessage(t('passwordChangedSuccess') || 'Password changed successfully!');
      setSuccessType('success');
      setShowSuccessModal(true);
    } catch (error) {


      let errorMessage = 'Failed to change password: ';
      if (error.code === 'auth/wrong-password') {
        errorMessage = t('wrongCurrentPassword') || 'Current password is incorrect.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t('weakPassword') || 'New password is too weak.';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = t('pleaseLoginAgain') || 'Please log out and log in again before changing your password.';
      } else {
        errorMessage += error.message;
      }

      setSuccessMessage(errorMessage);
      setSuccessType('error');
      setShowSuccessModal(true);
    } finally {
      setUpdatingPassword(false);
    }
  };

  // ✅ Delete listing
  const handleDeleteListing = async (id) => {
    setListingToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteListing = async () => {
    if (!listingToDelete) return;

    try {
      await fetch(`${API_URL}/listings/${listingToDelete}`, { method: "DELETE" });
      setListings(listings.filter((l) => l.id !== listingToDelete));
      setShowDeleteConfirm(false);
      setListingToDelete(null);

      // Show success message
      setSuccessMessage(t('listingDeletedSuccess') || 'Listing deleted successfully!');
      setSuccessType('success');
      setShowSuccessModal(true);
    } catch (error) {

      setSuccessMessage(t('listingDeleteError') || 'Failed to delete listing. Please try again.');
      setSuccessType('error');
      setShowSuccessModal(true);
    }
  };

  // ✅ Mark listing as sold
  const handleMarkAsSold = async (id) => {
    setListingToMarkSold(id);
    setShowSoldConfirm(true);
  };

  const confirmMarkAsSold = async () => {
    if (!listingToMarkSold) return;

    const listingId = listingToMarkSold; // Store ID before clearing state

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const token = await currentUser.getIdToken();

      // Mark as sold in backend (this will save to database and delete the listing)
      const response = await fetch(`${API_URL}/listings/${listingId}/mark-sold`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to mark as sold');
      }

      // Close confirmation modal first
      setShowSoldConfirm(false);
      setListingToMarkSold(null);

      // Remove from local state using stored ID
      setListings(listings.filter((l) => l.id !== listingId));

      // Show congratulations modal
      setShowCongratulationsModal(true);

      // Auto-close congratulations after 4 seconds
      setTimeout(() => {
        setShowCongratulationsModal(false);
      }, 4000);

    } catch (error) {
      // Close the sold confirm modal
      setShowSoldConfirm(false);
      setListingToMarkSold(null);

      // Show error in a separate modal
      alert(t('markSoldError') || `Failed to mark as sold: ${error.message}`);
    }
  };

  // ✅ Handle new image selection
  const handleNewImagesChange = (e) => {
    const files = Array.from(e.target.files);

    // Validate file types - only allow .jpg, .jpeg, and .png
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      setSuccessMessage('Only JPG and PNG images are allowed. Please select valid image files.');
      setSuccessType('error');
      setShowSuccessModal(true);
      e.target.value = ''; // Clear the input
      return;
    }

    setNewImages(prev => [...prev, ...files]);

    // Create previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  // ✅ Remove existing image
  const handleRemoveExistingImage = (index) => {
    const imageToRemove = editingListing.images[index];
    setRemovedImages(prev => [...prev, imageToRemove]);
    setEditingListing({
      ...editingListing,
      images: editingListing.images.filter((_, i) => i !== index)
    });
  };

  // ✅ Remove new image preview
  const handleRemoveNewImage = (index) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // ✅ Handle floor plan selection
  const handleFloorPlanChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file types - only allow .jpg, .jpeg, and .png
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setSuccessMessage('Only JPG and PNG images are allowed for floor plans.');
      setSuccessType('error');
      setShowSuccessModal(true);
      e.target.value = '';
      return;
    }

    setNewFloorPlan(file);
    setFloorPlanPreview(URL.createObjectURL(file));
    setRemoveFloorPlan(false); // If uploading new, don't remove existing
  };

  // ✅ Remove floor plan
  const handleRemoveFloorPlan = () => {
    setRemoveFloorPlan(true);
    setNewFloorPlan(null);
    if (floorPlanPreview) {
      URL.revokeObjectURL(floorPlanPreview);
      setFloorPlanPreview(null);
    }
  };

  // ✅ Cancel new floor plan selection
  const handleCancelNewFloorPlan = () => {
    setNewFloorPlan(null);
    if (floorPlanPreview) {
      URL.revokeObjectURL(floorPlanPreview);
      setFloorPlanPreview(null);
    }
  };

  // ✅ Handle profile picture selection
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file types - only allow .jpg, .jpeg, and .png
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setSuccessMessage('Only JPG and PNG images are allowed for profile picture.');
      setSuccessType('error');
      setShowSuccessModal(true);
      e.target.value = '';
      return;
    }

    // Validate file size (max 6MB)
    if (file.size > 6 * 1024 * 1024) {
      setSuccessMessage('Profile picture must be less than 6MB.');
      setSuccessType('error');
      setShowSuccessModal(true);
      e.target.value = '';
      return;
    }

    setProfilePicture(file);
    setProfilePicturePreview(URL.createObjectURL(file));
    setRemoveProfilePicture(false);
  };

  // ✅ Remove profile picture
  const handleRemoveProfilePicture = () => {
    setRemoveProfilePicture(true);
    setProfilePicture(null);
    if (profilePicturePreview) {
      URL.revokeObjectURL(profilePicturePreview);
      setProfilePicturePreview(null);
    }
  };

  // ✅ Cancel new profile picture selection
  const handleCancelNewProfilePicture = () => {
    setProfilePicture(null);
    if (profilePicturePreview) {
      URL.revokeObjectURL(profilePicturePreview);
      setProfilePicturePreview(null);
    }
  };

  // ✅ Update listing
  const handleUpdateListing = async (e) => {
    e.preventDefault();
    setUpdatingListing(true);
    const form = e.target;

    const formData = new FormData();
    formData.append('title', form.title.value);
    formData.append('price', form.price.value);
    formData.append('location', form.location.value);
    formData.append('firebase_uid', user.firebase_uid);
    formData.append('type', editingListing.type);
    formData.append('rooms', editingListing.rooms);
    formData.append('bathrooms', editingListing.bathrooms);
    formData.append('size', editingListing.size);
    formData.append('description', editingListing.description);

    // Add new apartment/house features if applicable
    if (editingListing.property_type === 'apartment' || editingListing.property_type === 'private_home') {
      formData.append('has_elevator', editingListing.has_elevator || false);
      formData.append('has_parking', editingListing.has_parking || false);
      formData.append('has_garage', editingListing.has_garage || false);
      formData.append('has_balcony', editingListing.has_balcony || false);
      if (editingListing.floor) formData.append('floor', editingListing.floor);
      if (editingListing.total_floors) formData.append('total_floors', editingListing.total_floors);
    }

    // Add new images
    newImages.forEach(image => {
      formData.append('images', image);
    });

    // Add removed images info
    if (removedImages.length > 0) {
      formData.append('removed_images', JSON.stringify(removedImages));
    }

    // Handle floor plan
    if (newFloorPlan) {
      formData.append('floor_plan', newFloorPlan);
    } else if (removeFloorPlan) {
      formData.append('remove_floor_plan', 'true');
    }

    try {
      const res = await fetch(`${API_URL}/listings/${editingListing.id}`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to update listing");
      }

      const data = await res.json();

      // ✅ Update the listing in state
      setListings(
        listings.map((l) =>
          l.id === editingListing.id ? data.listing : l
        )
      );

      // Reset states
      setEditingListing(null);
      setNewImages([]);
      setImagePreviews([]);
      setRemovedImages([]);
      setNewFloorPlan(null);
      setFloorPlanPreview(null);
      setRemoveFloorPlan(false);

      // Show success message
      setSuccessMessage(t('listingUpdatedSuccess') || 'Listing updated successfully!');
      setSuccessType('success');
      setShowSuccessModal(true);
    } catch (error) {

      setSuccessMessage(t('listingUpdateError') || 'Failed to update listing. Please try again.');
      setSuccessType('error');
      setShowSuccessModal(true);
    } finally {
      setUpdatingListing(false);
    }
  };

  // ✅ Calculate boost days remaining
  const getBoostDaysRemaining = (expiresAt) => {
    if (!expiresAt) return 0;
    const expireDate = new Date(expiresAt);
    const today = new Date();
    const diffTime = expireDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // ✅ Free Boost Handler - No payment required
  const handleFreeBoost = async () => {
    if (!boostingListing) return;

    try {
      // Get fresh Firebase token
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      const token = await currentUser.getIdToken();

      const response = await fetch(`${API_URL}/listings/${boostingListing.id}/boost`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to boost listing');
      }

      const data = await response.json();
      console.log('✅ Free boost successful:', data);

      setBoostingListing(null);
      setShowBoostSuccessModal(true);

      // Auto-refresh after 3 seconds
      setTimeout(() => {
        setShowBoostSuccessModal(false);
        window.location.reload();
      }, 3000);
    } catch (error) {
      console.error('❌ Error boosting listing:', error);
      alert(error.message || t('boostError') || 'Failed to boost listing. Please try again.');
      setBoostingListing(null);
    }
  };

  // Legacy payment success handler (kept for compatibility)
  const handleBoostSuccess = (paymentData) => {
    console.log('✅ Payment successful:', paymentData);
    setBoostingListing(null);
    setShowPaymentForm(false);
    setShowBoostSuccessModal(true);

    // Auto-refresh after 3 seconds
    setTimeout(() => {
      setShowBoostSuccessModal(false);
      window.location.reload();
    }, 3000);
  };

  const handleBoostCancel = () => {
    setBoostingListing(null);
    setShowPaymentForm(false);
  };

  const handleShowPaymentForm = () => {
    setShowPaymentForm(true);
  };

  // ✅ Auth checks
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>{t('pleaseLogInToViewProfile')}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>{t('loadingProfile')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 md:py-8 px-2 sm:px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-8 mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6">
            <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold shadow-lg flex-shrink-0 overflow-hidden">
                {profile.profile_picture ? (
                  <img
                    src={profile.profile_picture}
                    alt={`${profile.name}'s profile`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.name?.charAt(0).toUpperCase() || "U"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-3xl font-bold text-gray-800 truncate">
                  {profile.name} {profile.surname}
                </h1>
                <p className="text-sm md:text-base text-gray-500 truncate">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
              <span className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-semibold text-xs md:text-sm flex-shrink-0 ${profile.role === 'agent'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : profile.role === 'admin'
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                }`}>
                {profile.role === 'agent' ? `🏢 ${t('agent')}` : profile.role === 'admin' ? '👑 Admin' : `👤 ${t('user')}`}
              </span>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 md:px-6 py-1.5 md:py-2 rounded-lg hover:bg-gray-700 transition shadow-md text-sm md:text-base"
              >
                {t('logOut')}
              </button>
            </div>
          </div>

          {/* Profile Info Section */}
          <div className="border-t pt-4 md:pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">{t('profileInformation')}</h2>
              <div className="flex gap-2">
                {!editingProfile && (
                  <>
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2 text-sm md:text-base"
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {t('edit')}
                    </button>
                    <button
                      onClick={() => setShowChangePassword(true)}
                      className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2 text-sm md:text-base"
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      {t('changePassword')}
                    </button>
                  </>
                )}
              </div>
            </div>

            {editingProfile ? (
              <form onSubmit={handleUpdateProfile} className="space-y-3 md:space-y-4 relative">
                {updatingProfile && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-gray-700 font-semibold">{t('updatingProfile')}</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={profile.email}
                      required
                      className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={profile.phone}
                      required
                      className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">{t('firstName')}</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={profile.name}
                      required
                      className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">{t('lastName')}</label>
                    <input
                      type="text"
                      name="surname"
                      defaultValue={profile.surname}
                      required
                      className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    />
                  </div>
                </div>

                {/* Profile Picture Section */}
                <div className="border-t pt-4">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Profile Picture (Optional)</label>

                  {/* Current Profile Picture */}
                  {profile.profile_picture && !removeProfilePicture && !profilePicture && (
                    <div className="mb-3 flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={profile.profile_picture}
                          alt="Current Profile"
                          className="w-20 h-20 object-cover rounded-full border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveProfilePicture}
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-gray-600">Current profile picture</p>
                    </div>
                  )}

                  {/* Profile Picture Removed Message */}
                  {removeProfilePicture && !profilePicture && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">Profile picture will be removed when you save changes.</p>
                      <button
                        type="button"
                        onClick={() => setRemoveProfilePicture(false)}
                        className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                      >
                        Undo removal
                      </button>
                    </div>
                  )}

                  {/* New Profile Picture Preview */}
                  {profilePicturePreview && profilePicture && (
                    <div className="mb-3 flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={profilePicturePreview}
                          alt="New Profile"
                          className="w-20 h-20 object-cover rounded-full border-2 border-green-300"
                        />
                        <button
                          type="button"
                          onClick={handleCancelNewProfilePicture}
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-green-600">New profile picture (not saved yet)</p>
                    </div>
                  )}

                  {/* Upload New Profile Picture */}
                  {!removeProfilePicture && (
                    <div>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={handleProfilePictureChange}
                        className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">Upload a profile picture (JPG or PNG, max 6MB)</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 md:gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="bg-blue-600 text-white px-4 md:px-6 py-2 rounded-lg hover:bg-blue-700 transition shadow-md text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingProfile ? t('updatingProfile') : t('saveChanges')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    disabled={updatingProfile}
                    className="bg-gray-200 text-gray-700 px-4 md:px-6 py-2 rounded-lg hover:bg-gray-300 transition text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">{t('email')}</p>
                  <p className="text-sm md:text-base text-gray-800 font-medium break-all">{profile.email}</p>
                </div>
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">{t('phone')}</p>
                  <p className="text-sm md:text-base text-gray-800 font-medium">{profile.phone}</p>
                </div>
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">{t('firstName')}</p>
                  <p className="text-sm md:text-base text-gray-800 font-medium">{profile.name}</p>
                </div>
                <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                  <p className="text-xs md:text-sm text-gray-500 mb-1">{t('lastName')}</p>
                  <p className="text-sm md:text-base text-gray-800 font-medium">{profile.surname}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* My Listings Section */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-8 mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">{t('myListings')}</h2>
          {listings.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-3 md:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <p className="text-gray-500 text-base md:text-lg">{t('noListings')}</p>
              <p className="text-gray-400 text-xs md:text-sm mt-2">{t('noListingsDesc')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="border border-gray-200 rounded-lg md:rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                  onClick={() => navigate(`/listing/${listing.id}`)}
                >
                  {listing.images?.length > 0 && (
                    <div className="relative">
                      <img
                        src={getImageUrl(listing.images[0])}
                        alt={listing.title}
                        className="w-full h-40 md:h-48 object-cover"
                      />
                      {listing.boosted > 0 && (
                        <span className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-400 to-emerald-500 text-white">
                          ⭐ FEATURED
                        </span>
                      )}
                    </div>
                  )}
                  <div className="p-3 md:p-4">
                    <h3 className="text-base md:text-lg font-bold text-gray-800 mb-1 truncate">{listing.title}</h3>
                    <p className="text-gray-600 text-xs md:text-sm mb-2 truncate">{listing.location}</p>
                    <p className="text-blue-600 font-bold text-lg md:text-xl mb-2">€{listing.price}</p>

                    {/* Views Counter */}
                    <div className="flex items-center gap-2 text-gray-500 text-xs md:text-sm mb-3">
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="font-medium">{listing.views || 0} {t('views')}</span>
                    </div>

                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingListing(listing);
                        }}
                        className="flex-1 bg-blue-50 text-blue-600 px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-blue-100 transition font-medium text-xs md:text-sm"
                      >
                        {t('editListing')}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteListing(listing.id);
                        }}
                        className="flex-1 bg-red-50 text-red-600 px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:bg-red-100 transition font-medium text-xs md:text-sm"
                      >
                        {t('deleteListing')}
                      </button>
                    </div>

                    {/* Mark as Sold Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsSold(listing.id);
                      }}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition font-medium flex items-center justify-center gap-2 shadow-md text-xs md:text-sm mb-2"
                    >
                      <span>✓</span>
                      {t('markAsSold') || 'Mark as Sold'}
                    </button>

                    {/* Boost Button */}
                    {listing.boosted === 0 || !listing.boosted ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setBoostingListing(listing);
                        }}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 md:px-4 py-1.5 md:py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition font-semibold flex items-center justify-center gap-2 shadow-lg text-xs md:text-sm"
                      >
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        {t('boostListingButton')}
                      </button>
                    ) : (
                      <div className="text-center py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <span className="text-green-700 font-semibold text-xs md:text-sm flex items-center justify-center gap-2">
                          ⭐ {t('featuredListing')}
                          {listing.boost_expires_at && (() => {
                            const daysLeft = getBoostDaysRemaining(listing.boost_expires_at);
                            return daysLeft > 0 ? (
                              <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                                {daysLeft} {t('daysLeft')}
                              </span>
                            ) : (
                              <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                                {t('expiresSoon')}
                              </span>
                            );
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger Zone - Collapsible */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 border-2 border-red-200">
          <button
            onClick={() => setShowDangerZone(!showDangerZone)}
            className="w-full flex justify-between items-center"
          >
            <div className="flex items-center gap-2 md:gap-3">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-base md:text-xl font-bold text-red-600">{t('deleteAccount')}</h2>
            </div>
            <svg
              className={`w-5 h-5 text-red-600 transition-transform ${showDangerZone ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDangerZone && (
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-red-200">
              <p className="text-sm md:text-base text-gray-600 mb-4">
                {t('deleteAccountWarning')}
              </p>
              <button
                onClick={handleDeleteAccount}
                className="bg-red-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-red-700 transition shadow-md font-medium text-sm md:text-base"
              >
                {t('deleteAccountPermanently')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Edit Listing Modal */}
      {editingListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white p-4 md:p-8 rounded-xl md:rounded-2xl shadow-2xl w-full max-w-2xl my-4 md:my-8 relative">
            <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-800">{t('editListingTitle')}</h3>
            {updatingListing && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-gray-700 font-semibold">{t('updatingListing')}</p>
                </div>
              </div>
            )}
            <form onSubmit={handleUpdateListing} className="space-y-3 md:space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">{t('title')}</label>
                <input
                  name="title"
                  defaultValue={editingListing.title}
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">{t('price')} (€)</label>
                  <input
                    name="price"
                    type="number"
                    defaultValue={editingListing.price}
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">{t('location')}</label>
                  <input
                    name="location"
                    defaultValue={editingListing.location}
                    className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                    required
                  />
                </div>
              </div>

              {/* Additional Features for Apartments/Houses */}
              {(editingListing.property_type === 'apartment' || editingListing.property_type === 'private_home') && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="text-sm md:text-base font-semibold text-gray-700 mb-3">{t('additionalFeatures')}</h4>

                  {/* Floor Information */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">{t('floor')}</label>
                      <input
                        type="number"
                        min="0"
                        value={editingListing.floor || ''}
                        onChange={(e) => setEditingListing({ ...editingListing, floor: e.target.value })}
                        placeholder={t('floorPlaceholder')}
                        className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                      />
                    </div>
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1">{t('totalFloors')}</label>
                      <input
                        type="number"
                        min="1"
                        value={editingListing.total_floors || ''}
                        onChange={(e) => setEditingListing({ ...editingListing, total_floors: e.target.value })}
                        placeholder={t('totalFloorsPlaceholder')}
                        className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                      />
                    </div>
                  </div>

                  {/* Amenities Checkboxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer text-sm md:text-base">
                      <input
                        type="checkbox"
                        checked={editingListing.has_elevator || false}
                        onChange={(e) => setEditingListing({ ...editingListing, has_elevator: e.target.checked })}
                        className="w-4 h-4 md:w-5 md:h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{t('hasElevator')}</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer text-sm md:text-base">
                      <input
                        type="checkbox"
                        checked={editingListing.has_parking || false}
                        onChange={(e) => setEditingListing({ ...editingListing, has_parking: e.target.checked })}
                        className="w-4 h-4 md:w-5 md:h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{t('hasParking')}</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer text-sm md:text-base">
                      <input
                        type="checkbox"
                        checked={editingListing.has_garage || false}
                        onChange={(e) => setEditingListing({ ...editingListing, has_garage: e.target.checked })}
                        className="w-4 h-4 md:w-5 md:h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{t('hasGarage')}</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer text-sm md:text-base">
                      <input
                        type="checkbox"
                        checked={editingListing.has_balcony || false}
                        onChange={(e) => setEditingListing({ ...editingListing, has_balcony: e.target.checked })}
                        className="w-4 h-4 md:w-5 md:h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-gray-700">{t('hasBalcony')}</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Current Images */}
              {editingListing.images && editingListing.images.length > 0 && (
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">{t('currentImages')}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                    {editingListing.images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={`${API_URL}/${img}`}
                          alt={`Current ${index + 1}`}
                          className="w-full h-20 md:h-24 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 text-sm md:text-base"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images Preview */}
              {imagePreviews.length > 0 && (
                <div>
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">{t('newImages')}</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`New ${index + 1}`}
                          className="w-full h-20 md:h-24 object-cover rounded-lg border-2 border-green-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 text-sm md:text-base"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Images Button */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">{t('addMoreImages')}</label>
                <input
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png"
                  onChange={handleNewImagesChange}
                  className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">{t('youCanSelectMultiple')} (Only JPG and PNG files)</p>
              </div>

              {/* Floor Plan Section */}
              <div>
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">📐 Floor Plan (Optional)</label>

                {/* Current Floor Plan */}
                {editingListing.floor_plan && !removeFloorPlan && !newFloorPlan && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-2">Current floor plan:</p>
                    <div className="relative inline-block">
                      <img
                        src={editingListing.floor_plan}
                        alt="Current Floor Plan"
                        className="h-32 object-contain rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveFloorPlan}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Floor Plan Removed Message */}
                {removeFloorPlan && !newFloorPlan && (
                  <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">Floor plan will be removed when you save changes.</p>
                    <button
                      type="button"
                      onClick={() => setRemoveFloorPlan(false)}
                      className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                    >
                      Undo removal
                    </button>
                  </div>
                )}

                {/* New Floor Plan Preview */}
                {floorPlanPreview && newFloorPlan && (
                  <div className="mb-3">
                    <p className="text-xs text-green-600 mb-2">New floor plan (not saved yet):</p>
                    <div className="relative inline-block">
                      <img
                        src={floorPlanPreview}
                        alt="New Floor Plan"
                        className="h-32 object-contain rounded-lg border-2 border-green-300"
                      />
                      <button
                        type="button"
                        onClick={handleCancelNewFloorPlan}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload New Floor Plan */}
                {!removeFloorPlan && (
                  <div>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleFloorPlanChange}
                      className="w-full px-3 md:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload a floor plan image (JPG or PNG, max 6MB)</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 md:gap-3 pt-2 md:pt-4">
                <button
                  type="submit"
                  disabled={updatingListing}
                  className="flex-1 bg-blue-600 text-white py-2 md:py-3 rounded-lg hover:bg-blue-700 transition shadow-md font-medium text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingListing ? t('updatingListing') : t('saveChanges')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingListing(null);
                    setNewImages([]);
                    setImagePreviews([]);
                    setRemovedImages([]);
                    setNewFloorPlan(null);
                    setFloorPlanPreview(null);
                    setRemoveFloorPlan(false);
                  }}
                  disabled={updatingListing}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 md:py-3 rounded-lg hover:bg-gray-300 transition font-medium text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ Free Boost Confirmation Modal */}
      {boostingListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-8">
              <h3 className="text-2xl md:text-3xl font-bold mb-2 text-gray-800 flex items-center gap-2">
                🚀 {t('promoteYourListing')}
              </h3>
              <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">{t('getMaxVisibility')}</p>

              {/* Free Premium Promotion Plan */}
              <div className="border-2 border-purple-400 rounded-xl p-4 md:p-6 bg-gradient-to-r from-purple-50 to-pink-50 mb-4 md:mb-6">
                <div className="mb-3 md:mb-4">
                  <h4 className="text-base md:text-xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                    {t('featuredListingPlan')}
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">FREE</span>
                  </h4>
                  <p className="text-xs md:text-sm text-gray-600 mt-1">{t('boostPropertyFor15Days')}</p>
                </div>
                <ul className="text-xs md:text-sm text-gray-700 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold flex-shrink-0">✓</span>
                    <span>{t('featuredOnHomepage')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold flex-shrink-0">✓</span>
                    <span>{t('topOfSearchResults')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold flex-shrink-0">✓</span>
                    <span>{t('specialFeaturedBadge')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold flex-shrink-0">✓</span>
                    <span>{t('days15Premium')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-600 font-bold flex-shrink-0">✓</span>
                    <span>{t('increasedViews')}</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2 md:space-y-3">
                {/* Free Boost Button */}
                <button
                  onClick={handleFreeBoost}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 md:py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition font-bold text-base md:text-lg shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {t('boostListingButton')}
                </button>

                <button
                  onClick={handleBoostCancel}
                  className="w-full bg-gray-200 text-gray-700 py-2 md:py-3 rounded-lg hover:bg-gray-300 transition font-medium text-sm md:text-base"
                >
                  {t('cancel')}
                </button>
              </div>

              <div className="mt-4 md:mt-6 p-3 md:p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-800 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>
                    <strong>{t('limitedTimeOffer') || 'Limited Time Offer'}:</strong> {t('freeBoostPromotion') || 'Boost your listing for free during our promotional period!'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{t('changePassword')}</h2>
                  <p className="text-purple-100 text-sm mt-1">{t('enterNewPassword')}</p>
                </div>
                <button
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
                  }}
                  className="hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('currentPassword')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      placeholder={t('enterCurrentPassword')}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('newPassword')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      placeholder={t('enterNewPassword')}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      required
                      minLength={6}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('passwordMinLength')}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('confirmNewPassword')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <input
                      type="password"
                      placeholder={t('confirmNewPassword')}
                      value={passwordData.confirmNewPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3.5 rounded-xl hover:from-purple-700 hover:to-purple-800 transition font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {updatingPassword ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('updatingPassword')}
                    </span>
                  ) : t('changePassword')}
                </button>
              </form>

              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs text-purple-800 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>{t('passwordChangeInfo')}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Success/Error Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-bounce-in">
            {/* Header with gradient */}
            <div className={`p-6 text-white ${successType === 'success'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600'
              : successType === 'error'
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : 'bg-gradient-to-r from-yellow-500 to-orange-500'
              }`}>
              <div className="flex flex-col items-center text-center">
                {successType === 'success' ? (
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                ) : successType === 'error' ? (
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                )}
                <h2 className="text-2xl font-bold">
                  {successType === 'success' ? t('success') || 'Success!' : successType === 'error' ? t('error') || 'Error!' : t('warning') || 'Warning!'}
                </h2>
              </div>
            </div>

            <div className="p-6 text-center">
              <p className="text-gray-700 text-lg mb-6">{successMessage}</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className={`w-full py-3 rounded-xl font-semibold shadow-lg transition transform hover:-translate-y-0.5 ${successType === 'success'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                  : successType === 'error'
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                    : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white'
                  }`}
              >
                {t('okay') || 'Okay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">{t('confirmDelete') || 'Confirm Delete'}</h2>
              </div>
            </div>

            <div className="p-6 text-center">
              <p className="text-gray-700 text-lg mb-6">
                {t('deleteListingConfirm') || 'Are you sure you want to delete this listing? This action cannot be undone.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setListingToDelete(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  onClick={confirmDeleteListing}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:from-red-600 hover:to-red-700 transition transform hover:-translate-y-0.5"
                >
                  {t('deleteNow') || 'Delete Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Delete Account Confirmation Modal */}
      {showDeleteAccountConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-bounce-in">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 text-white">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">{t('deleteAccountPermanently') || 'Delete Account Permanently'}</h2>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-800 font-semibold flex items-start gap-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{t('deleteAccountWarning') || 'Warning: This action cannot be undone! All your data, listings, and account information will be permanently deleted.'}</span>
                </p>
              </div>

              <p className="text-gray-700 text-center mb-6">
                {t('confirmAccountDeletion') || 'Are you absolutely sure you want to delete your account?'}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteAccountConfirm(false)}
                  disabled={deletingAccount}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  disabled={deletingAccount}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-xl font-semibold shadow-lg hover:from-red-700 hover:to-red-800 transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {deletingAccount ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('deletingAccount') || 'Deleting...'}
                    </span>
                  ) : (t('deleteAccountPermanently') || 'Delete Account')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✨ Boost Success Modal */}
      {showBoostSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-bounce-in">
            <div className="relative overflow-hidden">
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center">
                <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {t('successTitle') || 'Success!'}
                </h2>
              </div>

              {/* Content */}
              <div className="p-8 text-center">
                <div className="mb-6">
                  <p className="text-2xl font-bold text-gray-800 mb-2">
                    {t('listingBoosted') || 'Listing Boosted!'}
                  </p>
                  <p className="text-gray-600">
                    {t('boostSuccessMessage') || 'Your listing has been successfully boosted for 15 days'}
                  </p>
                </div>

                {/* Features */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="flex items-center gap-2 text-blue-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="font-semibold">{t('premiumVisibility') || 'Premium Visibility'}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {t('boostActiveMessage') || 'Your listing will now appear at the top of search results'}
                  </p>
                </div>

                {/* Auto-refresh message */}
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm">
                    {t('refreshingPage') || 'Refreshing page...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Sold Confirmation Modal */}
      {showSoldConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-center mb-4">{t('markAsSoldTitle') || 'Mark as Sold?'}</h2>
              <p className="text-gray-700 text-center mb-6">
                {t('markAsSoldConfirm') || 'This will record the sale in your statistics and remove the listing from the platform. This action cannot be undone.'}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSoldConfirm(false);
                    setListingToMarkSold(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  onClick={confirmMarkAsSold}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:from-green-600 hover:to-emerald-700 transition transform hover:-translate-y-0.5"
                >
                  {t('confirmSold') || 'Yes, Mark as Sold'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎉 Congratulations Modal */}
      {showCongratulationsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-bounce-in">
            <div className="relative overflow-hidden">
              {/* Confetti Animation Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 opacity-10"></div>

              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-8 text-center relative">
                <div className="absolute top-0 left-0 right-0 flex justify-around">
                  <span className="text-4xl animate-bounce">🎉</span>
                  <span className="text-4xl animate-bounce" style={{ animationDelay: '0.1s' }}>🎊</span>
                  <span className="text-4xl animate-bounce" style={{ animationDelay: '0.2s' }}>🎉</span>
                </div>

                <div className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-lg mt-8">
                  <svg className="w-16 h-16 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>

                <h2 className="text-3xl font-bold text-white mb-2">
                  {t('congratulations') || 'Congratulations!'}
                </h2>
                <p className="text-white text-lg">
                  {t('propertySold') || 'Property Sold Successfully!'}
                </p>
              </div>

              {/* Content */}
              <div className="p-8 text-center">
                <div className="mb-6">
                  <p className="text-2xl font-bold text-gray-800 mb-3">
                    {t('saleRecorded') || '🏆 Sale Recorded!'}
                  </p>
                  <p className="text-gray-600 mb-4">
                    {t('congratsMessage') || 'Your sale has been recorded in your statistics. The listing has been removed from the platform.'}
                  </p>

                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border-2 border-yellow-200">
                    <p className="text-gray-700 font-semibold">
                      {t('thankYou') || 'Thank you for using our platform!'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {t('keepUpSuccess') || 'Keep up the great work! 🚀'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

