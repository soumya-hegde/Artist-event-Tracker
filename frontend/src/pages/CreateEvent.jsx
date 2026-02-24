import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { clearCreateEventStatus, createEvent, fetchMyEvents } from "../features/events/eventSlice";
import { fetchMyArtistProfile } from "../features/artist/artistSlice";

const initialForm = {
  title: "",
  description: "",
  venueName: "",
  address: "",
  city: "",
  state: "",
  country: "",
  eventDate: "",
  startTime: "",
  endTime: "",
};

export default function CreateEvent() {
  const [form, setForm] = useState(initialForm);
  const dispatch = useDispatch();
  const { createEventLoading, createEventError, createEventSuccess } = useSelector((state) => state.events);
  const { hasProfile, loading: artistProfileLoading } = useSelector((state) => state.artist);

  useEffect(() => {
    dispatch(fetchMyArtistProfile());
  }, [dispatch]);

  const onSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearCreateEventStatus());
    const result = await dispatch(createEvent(form));
    if (createEvent.fulfilled.match(result)) {
      dispatch(fetchMyEvents());
      setForm(initialForm);
    }
  };

  return (
    <div className="mx-auto mt-4 max-w-3xl surface-card p-7">
      <h1 className="mb-1 text-2xl font-semibold text-gray-800">Create Event</h1>
      <p className="mb-6 text-sm text-gray-500">Share your upcoming performance with your audience.</p>
      {artistProfileLoading && <p className="text-sm text-gray-500 mb-4">Checking artist profile...</p>}
      {!artistProfileLoading && hasProfile === false && (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-700 mb-3">
            You need to complete your artist profile before creating events.
          </p>
          <Link to="/profile" className="btn-primary inline-block">
            Complete Artist Profile
          </Link>
        </div>
      )}
      {createEventError && <p className="alert-error mb-4">{createEventError}</p>}
      {createEventSuccess && <p className="alert-success mb-4">{createEventSuccess}</p>}
      <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2" hidden={hasProfile === false}>
        <input className="input-field" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input className="input-field" placeholder="Venue Name" value={form.venueName} onChange={(e) => setForm({ ...form, venueName: e.target.value })} required />
        <input className="input-field md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input-field" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
        <input className="input-field" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
        <input className="input-field" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
        <input className="input-field" placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
        <input className="input-field" type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} required />
        <input className="input-field" placeholder="Start Time (e.g. 6:00 PM)" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
        <input className="input-field" placeholder="End Time (e.g. 9:00 PM)" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
        <button className="btn-primary md:col-span-2" disabled={createEventLoading}>
          {createEventLoading ? "Creating..." : "Create Event"}
        </button>
      </form>
    </div>
  );
}
