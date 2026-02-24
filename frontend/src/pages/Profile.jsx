import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthError, fetchMyProfile, updateMyProfile } from "../features/auth/authSlice";
import {
  clearArtistStatus,
  createMyArtistProfile,
  fetchMyArtistProfile,
  updateMyArtistProfile,
} from "../features/artist/artistSlice";

export default function Profile() {
  const dispatch = useDispatch();
  const { user, role, profileLoading, profileUpdating, error, infoMessage } = useSelector((state) => state.auth);
  const { profile, hasProfile, loading, creating, error: artistError, successMessage } = useSelector(
    (state) => state.artist
  );
  const [validationError, setValidationError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    stageName: "",
    bio: "",
    city: "",
    instagram: "",
    youtube: "",
  });

  useEffect(() => {
    dispatch(fetchMyProfile());
    if (role === "artist") {
      dispatch(fetchMyArtistProfile());
    }
    return () => {
      dispatch(clearAuthError());
      dispatch(clearArtistStatus());
    };
  }, [dispatch, role]);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        stageName: profile.stageName || "",
        bio: profile.bio || "",
        city: profile.city || "",
        instagram: profile.socialLinks?.instagram || "",
        youtube: profile.socialLinks?.youtube || "",
      }));
    }
  }, [profile]);

  const isValidUrl = (value) => {
    if (!value) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  const validateForm = () => {
    if (!form.name.trim() || form.name.trim().length < 3) {
      return "Name must be at least 3 characters long";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Please enter a valid email address";
    }
    if (form.password && form.password.trim().length > 0 && form.password.trim().length < 6) {
      return "Password must be at least 6 characters long";
    }

    if (role === "artist") {
      if (!form.stageName.trim()) return "Stage name is required for artist profile";
      if (!form.city.trim()) return "City is required for artist profile";
      if (form.bio && form.bio.length > 500) return "Bio cannot exceed 500 characters";
      if (!isValidUrl(form.instagram)) return "Instagram must be a valid URL";
      if (!isValidUrl(form.youtube)) return "YouTube must be a valid URL";
    }

    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearAuthError());
    dispatch(clearArtistStatus());
    setValidationError("");

    const formError = validateForm();
    if (formError) {
      setValidationError(formError);
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
    };

    if (form.password.trim()) {
      payload.password = form.password.trim();
    }

    const userResult = await dispatch(updateMyProfile(payload));
    if (!updateMyProfile.fulfilled.match(userResult)) {
      return;
    }

    if (role === "artist") {
      const artistPayload = {
        stageName: form.stageName.trim(),
        bio: form.bio.trim(),
        city: form.city.trim(),
        socialLinks: {
          instagram: form.instagram.trim(),
          youtube: form.youtube.trim(),
        },
      };

      const artistResult = hasProfile
        ? await dispatch(updateMyArtistProfile(artistPayload))
        : await dispatch(createMyArtistProfile(artistPayload));

      if (!updateMyArtistProfile.fulfilled.match(artistResult) && !createMyArtistProfile.fulfilled.match(artistResult)) {
        return;
      }
    }

    setForm((prev) => ({ ...prev, password: "" }));
  };

  if (profileLoading || (role === "artist" && loading)) {
    return <p className="text-sm text-gray-500">Loading profile...</p>;
  }

  return (
    <div className="mx-auto mt-4 max-w-3xl surface-card p-7">
      <h1 className="mb-1 text-2xl font-semibold text-gray-800">My Profile</h1>
      <p className="mb-6 text-sm text-gray-500">
        {role === "artist" ? "Update your account and artist details in one place." : "Update your account details."}
      </p>
      {validationError && <p className="alert-error mb-4">{validationError}</p>}
      {error && <p className="alert-error mb-4">{error}</p>}
      {artistError && <p className="alert-error mb-4">{artistError}</p>}
      {infoMessage && <p className="alert-success mb-4">{infoMessage}</p>}
      {successMessage && <p className="alert-success mb-4">{successMessage}</p>}

      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
        <input
          className="input-field"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="input-field"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="input-field md:col-span-2"
          placeholder="New Password (optional)"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {role === "artist" && (
          <>
            <input
              className="input-field"
              placeholder="Stage Name"
              value={form.stageName}
              onChange={(e) => setForm({ ...form, stageName: e.target.value })}
              required
            />
            <input
              className="input-field"
              placeholder="City"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />
            <input
              className="input-field md:col-span-2"
              placeholder="Bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="Instagram URL"
              value={form.instagram}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
            />
            <input
              className="input-field"
              placeholder="YouTube URL"
              value={form.youtube}
              onChange={(e) => setForm({ ...form, youtube: e.target.value })}
            />
          </>
        )}
        <button className="btn-primary md:col-span-2" disabled={profileUpdating || creating}>
          {profileUpdating || creating ? "Saving..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
}
