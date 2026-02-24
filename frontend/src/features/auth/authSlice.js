import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

const SYSTEM_ERROR_MESSAGE = "Service temporarily unavailable. Please try again later.";

const decodeJwtPayload = (token) => {
  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return null;

    const base64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const getUserFromToken = (token) => {
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return null;
  }

  return {
    id: payload.id || payload._id || null,
    email: payload.email || null,
    role: payload.role || null,
  };
};

const getStoredAuth = () => {
  const token = localStorage.getItem("token");
  const tokenUser = getUserFromToken(token);

  if (!token || !tokenUser) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return {
      token: null,
      user: null,
      role: null,
    };
  }

  const user = localStorage.getItem("user");
  const parsedUser = user ? JSON.parse(user) : null;

  const mergedUser = {
    ...(parsedUser || {}),
    id: tokenUser.id,
    email: tokenUser.email || parsedUser?.email || null,
    role: tokenUser.role,
  };

  return {
    token,
    user: mergedUser,
    role: tokenUser.role,
  };
};

const getAuthErrorMessage = (error, fallbackMessage) => {
  if (!error.response) return SYSTEM_ERROR_MESSAGE;
  if (error.response.status >= 500) return SYSTEM_ERROR_MESSAGE;
  return error.response?.data?.message || fallbackMessage;
};

export const registerUser = createAsyncThunk("auth/registerUser", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post("/auth/register", payload);
    return response.data;
  } catch (error) {
    return rejectWithValue(getAuthErrorMessage(error, "Registration failed"));
  }
});

export const loginUser = createAsyncThunk("auth/loginUser", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post("/auth/login", payload);
    return response.data;
  } catch (error) {
    return rejectWithValue(getAuthErrorMessage(error, "Login failed"));
  }
});

export const fetchMyProfile = createAsyncThunk("auth/fetchMyProfile", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/auth/profile");
    return response.data;
  } catch (error) {
    return rejectWithValue(getAuthErrorMessage(error, "Failed to fetch profile"));
  }
});

export const updateMyProfile = createAsyncThunk("auth/updateMyProfile", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.put("/auth/profile", payload);
    return response.data;
  } catch (error) {
    return rejectWithValue(getAuthErrorMessage(error, "Failed to update profile"));
  }
});

const stored = getStoredAuth();

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: stored.user,
    token: stored.token,
    role: stored.role,
    isAuthenticated: Boolean(stored.token),
    loading: false,
    profileLoading: false,
    profileUpdating: false,
    error: null,
    infoMessage: null,
  },
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
      state.infoMessage = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.error = null;
      state.infoMessage = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.infoMessage = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.infoMessage = action.payload?.message || "Registered successfully. Please login.";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const token = action.payload.token;
        const tokenUser = getUserFromToken(token);

        if (!token || !tokenUser?.role) {
          state.loading = false;
          state.user = null;
          state.token = null;
          state.role = null;
          state.isAuthenticated = false;
          state.error = SYSTEM_ERROR_MESSAGE;
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          return;
        }

        const mergedUser = {
          ...(action.payload.user || {}),
          id: tokenUser.id,
          email: tokenUser.email || action.payload.user?.email || null,
          role: tokenUser.role,
        };

        state.loading = false;
        state.user = mergedUser;
        state.token = token;
        state.role = tokenUser.role;
        state.isAuthenticated = true;
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(mergedUser));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyProfile.pending, (state) => {
        state.profileLoading = true;
        state.error = null;
      })
      .addCase(fetchMyProfile.fulfilled, (state, action) => {
        state.profileLoading = false;
        const mergedUser = {
          ...(state.user || {}),
          ...(action.payload || {}),
          role: state.role || action.payload?.role || null,
        };
        state.user = mergedUser;
        localStorage.setItem("user", JSON.stringify(mergedUser));
      })
      .addCase(fetchMyProfile.rejected, (state, action) => {
        state.profileLoading = false;
        state.error = action.payload;
      })
      .addCase(updateMyProfile.pending, (state) => {
        state.profileUpdating = true;
        state.error = null;
        state.infoMessage = null;
      })
      .addCase(updateMyProfile.fulfilled, (state, action) => {
        state.profileUpdating = false;
        const updatedUser = action.payload?.user || {};
        const mergedUser = {
          ...(state.user || {}),
          ...updatedUser,
          role: state.role || updatedUser.role || null,
        };
        state.user = mergedUser;
        state.infoMessage = action.payload?.message || "Profile updated successfully";
        localStorage.setItem("user", JSON.stringify(mergedUser));
      })
      .addCase(updateMyProfile.rejected, (state, action) => {
        state.profileUpdating = false;
        state.error = action.payload;
      });
  },
});

export const { clearAuthError, logout } = authSlice.actions;
export default authSlice.reducer;
