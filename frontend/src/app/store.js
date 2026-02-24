import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import eventReducer from "../features/events/eventSlice";
import artistReducer from "../features/artist/artistSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventReducer,
    artist: artistReducer,
  },
});
