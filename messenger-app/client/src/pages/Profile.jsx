import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const fileInputRef = useRef(null);

  const [profilePicture, setProfilePicture] = useState(null);
  const [message, setMessage] = useState("");

  // ==========================================
  // GET USERNAME
  // ==========================================

  const username =
    user?.username ||
    user?.name ||
    "User";

  const email =
    user?.email ||
    "";

  // ==========================================
  // LOAD PROFILE PICTURE
  // ==========================================

  useEffect(() => {
    const savedPicture = localStorage.getItem(
      "chatx_profile_picture"
    );

    if (savedPicture) {
      setProfilePicture(savedPicture);
    }
  }, []);

  // ==========================================
  // SELECT IMAGE
  // ==========================================

  const handleProfilePictureChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Check file type

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "Please select a JPG, PNG, or WEBP image."
      );

      event.target.value = "";

      return;
    }

    // Maximum 5 MB

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      alert(
        "Profile picture must be less than 5 MB."
      );

      event.target.value = "";

      return;
    }

    // Create preview

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = reader.result;

      setProfilePicture(imageData);

      // Save locally

      localStorage.setItem(
        "chatx_profile_picture",
        imageData
      );

      setMessage(
        "Profile picture updated successfully."
      );
    };

    reader.readAsDataURL(file);

    // Reset input

    event.target.value = "";
  };

  // ==========================================
  // REMOVE PROFILE PICTURE
  // ==========================================

  const handleRemovePicture = () => {
    localStorage.removeItem(
      "chatx_profile_picture"
    );

    setProfilePicture(null);

    setMessage(
      "Profile picture removed."
    );
  };

  // ==========================================
  // OPEN FILE SELECTOR
  // ==========================================

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  // ==========================================
  // GO BACK
  // ==========================================

  const goBack = () => {
    navigate("/dashboard");
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="profile-page">

      <div className="profile-card">

        {/* ==================================
            BACK BUTTON
        =================================== */}

        <button
          type="button"
          className="profile-back-button"
          onClick={goBack}
        >
          ← Back to ChatX
        </button>


        {/* ==================================
            PROFILE PICTURE
        =================================== */}

        <div className="profile-picture-section">

          <div className="profile-picture-wrapper">

            {profilePicture ? (

              <img
                src={profilePicture}
                alt="Profile"
                className="profile-picture"
              />

            ) : (

              <div className="profile-picture-placeholder">
                {username
                  .charAt(0)
                  .toUpperCase()}
              </div>

            )}

            {/* Camera button */}

            <button
              type="button"
              className="profile-picture-button"
              onClick={openFileSelector}
              title="Change profile picture"
              aria-label="Change profile picture"
            >
              📷
            </button>

          </div>


          {/* Hidden file input */}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={
              handleProfilePictureChange
            }
          />

        </div>


        {/* ==================================
            USER INFORMATION
        =================================== */}

        <h1>{username}</h1>

        {email && (
          <p className="profile-email">
            {email}
          </p>
        )}


        {/* ==================================
            PROFILE PICTURE ACTIONS
        =================================== */}

        <div className="profile-picture-actions">

          <button
            type="button"
            onClick={openFileSelector}
            className="profile-upload-button"
          >
            📷 Change picture
          </button>

          {profilePicture && (
            <button
              type="button"
              onClick={
                handleRemovePicture
              }
              className="profile-remove-button"
            >
              Remove
            </button>
          )}

        </div>


        {/* ==================================
            INFORMATION
        =================================== */}

        <div className="profile-picture-info">

          <h3>Profile picture</h3>

          <p>
            Use a JPG, PNG, or WEBP image.
          </p>

          <p>
            Maximum file size: 5 MB.
          </p>

        </div>


        {/* ==================================
            SUCCESS MESSAGE
        =================================== */}

        {message && (
          <div className="profile-success">
            {message}
          </div>
        )}

      </div>

    </div>
  );
}