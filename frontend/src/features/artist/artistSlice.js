import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchMyArtistProfile = createAsyncThunk(
  "artist/fetchMyArtistProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/artists/profile");
      return { profile: response.data, hasProfile: true };
    } catch (error) {
      if (error.response?.status === 404) {
        return { profile: null, hasProfile: false };
      }
      return rejectWithValue(error.response?.data?.message || "Failed to fetch artist profile");
    }
  }
);

export const createMyArtistProfile = createAsyncThunk(
  "artist/createMyArtistProfile",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post("/artists/profile", payload);
      return response.data.artist;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create artist profile");
    }
  }
);

export const updateMyArtistProfile = createAsyncThunk(
  "artist/updateMyArtistProfile",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.put("/artists/profile", payload);
      return response.data.artist;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update artist profile");
    }
  }
);

const artistSlice = createSlice({
  name: "artist",
  initialState: {
    profile: null,
    hasProfile: null,
    loading: false,
    creating: false,
    error: null,
    successMessage: null,
  },
  reducers: {
    clearArtistStatus: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyArtistProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyArtistProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.profile;
        state.hasProfile = action.payload.hasProfile;
      })
      .addCase(fetchMyArtistProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createMyArtistProfile.pending, (state) => {
        state.creating = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createMyArtistProfile.fulfilled, (state, action) => {
        state.creating = false;
        state.profile = action.payload;
        state.hasProfile = true;
        state.successMessage = "Artist profile created successfully";
      })
      .addCase(createMyArtistProfile.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      .addCase(updateMyArtistProfile.pending, (state) => {
        state.creating = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateMyArtistProfile.fulfilled, (state, action) => {
        state.creating = false;
        state.profile = action.payload;
        state.hasProfile = true;
        state.successMessage = "Artist profile updated successfully";
      })
      .addCase(updateMyArtistProfile.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      });
  },
});

export const { clearArtistStatus } = artistSlice.actions;
export default artistSlice.reducer;
