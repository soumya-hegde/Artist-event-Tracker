import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchEvents = createAsyncThunk("events/fetchEvents", async (query = {}, { rejectWithValue }) => {
  try {
    const response = await api.get("/events", { params: query });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch events");
  }
});

export const fetchMyEvents = createAsyncThunk("events/fetchMyEvents", async (query = {}, { rejectWithValue }) => {
  try {
    const response = await api.get("/events/my-events", { params: query });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch your events");
  }
});

export const fetchBookedEvents = createAsyncThunk(
  "events/fetchBookedEvents",
  async (query = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/events/booked", { params: query });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch booked events");
    }
  }
);

export const createEvent = createAsyncThunk("events/createEvent", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post("/events", payload);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to create event");
  }
});

export const deleteEvent = createAsyncThunk("events/deleteEvent", async (eventId, { rejectWithValue }) => {
  try {
    const response = await api.delete(`/events/${eventId}`);
    return { eventId, message: response.data?.message || "Event deleted successfully" };
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to delete event");
  }
});

const eventSlice = createSlice({
  name: "events",
  initialState: {
    allEvents: [],
    myEvents: [],
    bookedEvents: [],
    allEventsPagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
    myEventsPagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
    bookedEventsPagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
    allEventsLoading: false,
    myEventsLoading: false,
    bookedEventsLoading: false,
    createEventLoading: false,
    deleteEventLoading: false,
    allEventsError: null,
    myEventsError: null,
    bookedEventsError: null,
    createEventError: null,
    deleteEventError: null,
    createEventSuccess: null,
    deleteEventSuccess: null,
  },
  reducers: {
    clearEventError: (state) => {
      state.allEventsError = null;
      state.myEventsError = null;
      state.bookedEventsError = null;
      state.createEventError = null;
      state.deleteEventError = null;
    },
    clearCreateEventStatus: (state) => {
      state.createEventSuccess = null;
      state.createEventError = null;
      state.deleteEventSuccess = null;
      state.deleteEventError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.allEventsLoading = true;
        state.allEventsError = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.allEventsLoading = false;
        state.allEvents = action.payload?.events || [];
        state.allEventsPagination = action.payload?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.allEventsLoading = false;
        state.allEventsError = action.payload;
      })
      .addCase(fetchMyEvents.pending, (state) => {
        state.myEventsLoading = true;
        state.myEventsError = null;
      })
      .addCase(fetchMyEvents.fulfilled, (state, action) => {
        state.myEventsLoading = false;
        state.myEvents = action.payload?.events || [];
        state.myEventsPagination = action.payload?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };
      })
      .addCase(fetchMyEvents.rejected, (state, action) => {
        state.myEventsLoading = false;
        state.myEventsError = action.payload;
      })
      .addCase(fetchBookedEvents.pending, (state) => {
        state.bookedEventsLoading = true;
        state.bookedEventsError = null;
      })
      .addCase(fetchBookedEvents.fulfilled, (state, action) => {
        state.bookedEventsLoading = false;
        state.bookedEvents = action.payload?.events || [];
        state.bookedEventsPagination = action.payload?.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 };
      })
      .addCase(fetchBookedEvents.rejected, (state, action) => {
        state.bookedEventsLoading = false;
        state.bookedEventsError = action.payload;
      })
      .addCase(createEvent.pending, (state) => {
        state.createEventLoading = true;
        state.createEventError = null;
        state.createEventSuccess = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.createEventLoading = false;
        state.createEventSuccess = "Event created successfully";
        state.allEvents.unshift(action.payload);
        state.myEvents.unshift(action.payload);
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.createEventLoading = false;
        state.createEventError = action.payload;
      })
      .addCase(deleteEvent.pending, (state) => {
        state.deleteEventLoading = true;
        state.deleteEventError = null;
        state.deleteEventSuccess = null;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.deleteEventLoading = false;
        state.deleteEventSuccess = action.payload?.message || "Event deleted successfully";

        const { eventId } = action.payload;
        state.myEvents = state.myEvents.filter((event) => event._id !== eventId);
        state.allEvents = state.allEvents.filter((event) => event._id !== eventId);

        if (state.myEventsPagination.total > 0) {
          state.myEventsPagination.total -= 1;
          state.myEventsPagination.totalPages = Math.max(
            Math.ceil(state.myEventsPagination.total / state.myEventsPagination.limit),
            1
          );
        }

        if (state.allEventsPagination.total > 0) {
          state.allEventsPagination.total -= 1;
          state.allEventsPagination.totalPages = Math.max(
            Math.ceil(state.allEventsPagination.total / state.allEventsPagination.limit),
            1
          );
        }
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.deleteEventLoading = false;
        state.deleteEventError = action.payload;
      });
  },
});

export const { clearEventError, clearCreateEventStatus } = eventSlice.actions;
export default eventSlice.reducer;
