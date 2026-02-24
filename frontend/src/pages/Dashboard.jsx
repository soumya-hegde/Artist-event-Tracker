import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import EventCard from "../components/EventCard";
import { deleteEvent, fetchMyEvents } from "../features/events/eventSlice";
import { fetchMyArtistProfile } from "../features/artist/artistSlice";

const fallbackCenter = [12.9716, 77.5946];

function RecenterMap({ center }) {
  const map = useMap();
  const centerKey = Array.isArray(center) && center.length >= 2 ? `${center[0]}:${center[1]}` : "";

  useEffect(() => {
    if (!Array.isArray(center) || center.length < 2) return;
    map.setView(center, 15, { animate: true });
  }, [centerKey, map]);

  return null;
}

export default function Dashboard() {
  const [myEventsPage, setMyEventsPage] = useState(1);
  const [focusedEventId, setFocusedEventId] = useState(null);
  const [deletingEventId, setDeletingEventId] = useState(null);
  const mapSectionRef = useRef(null);
  const { user, role } = useSelector((state) => state.auth);
  const {
    myEvents,
    myEventsLoading,
    myEventsError,
    myEventsPagination,
    deleteEventError,
    deleteEventSuccess,
  } = useSelector((state) => state.events);
  const { hasProfile, loading: artistProfileLoading } = useSelector((state) => state.artist);
  const dispatch = useDispatch();

  useEffect(() => {
    if (role === "artist") {
      dispatch(fetchMyArtistProfile());
    }
  }, [dispatch, role]);

  useEffect(() => {
    if (role === "artist" && hasProfile) {
      dispatch(fetchMyEvents({ page: myEventsPage, limit: 20 }));
    }
  }, [dispatch, role, hasProfile, myEventsPage]);

  const eventsWithCoords = useMemo(
    () =>
      (myEvents || [])
        .map((event) => {
          const coords = event?.venueId?.location?.coordinates;
          if (!Array.isArray(coords) || coords.length < 2) return null;
          return {
            ...event,
            lat: coords[1],
            lng: coords[0],
          };
        })
        .filter(Boolean),
    [myEvents]
  );

  const center = eventsWithCoords.length ? [eventsWithCoords[0].lat, eventsWithCoords[0].lng] : fallbackCenter;

  useEffect(() => {
    if (eventsWithCoords.length === 0) {
      if (focusedEventId !== null) setFocusedEventId(null);
      return;
    }
    if (!focusedEventId || !eventsWithCoords.some((event) => event._id === focusedEventId)) {
      setFocusedEventId(eventsWithCoords[0]._id);
    }
  }, [eventsWithCoords, focusedEventId]);

  const selectedEvent = useMemo(() => {
    if (eventsWithCoords.length === 0) return null;
    return eventsWithCoords.find((event) => event._id === focusedEventId) || eventsWithCoords[0];
  }, [eventsWithCoords, focusedEventId]);

  const focusedCenter = selectedEvent ? [selectedEvent.lat, selectedEvent.lng] : fallbackCenter;

  const handleDeleteEvent = async (event) => {
    const confirmed = window.confirm(`Remove event "${event.title}"?`);
    if (!confirmed) return;

    setDeletingEventId(event._id);
    await dispatch(deleteEvent(event._id));
    setDeletingEventId(null);
  };

  return (
    <div className="mx-auto mt-4 max-w-4xl space-y-5">
      <section className="surface-card p-8">
        <p className="text-sm font-medium uppercase tracking-wide text-indigo-700">My Events</p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-800">Welcome, {user?.name || "Artist"}</h1>
        <p className="mt-1 text-gray-500">Role: {role}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/public-map" className="btn-primary">Browse Events</Link>
          {role === "artist" && <Link to="/events/create" className="btn-secondary">Create Event</Link>}
          {role === "artist" && !hasProfile && <Link to="/profile" className="btn-secondary">Complete Artist Profile</Link>}
        </div>
      </section>

      {role === "artist" && (
        <section className="surface-card p-8">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-semibold text-gray-800">My Events Map</h2>
            <span className="text-sm text-gray-500">
              Showing {myEvents.length} of {myEventsPagination.total || 0} events
            </span>
          </div>

          {artistProfileLoading && <p className="text-sm text-gray-500">Checking artist profile...</p>}
          {!artistProfileLoading && !hasProfile && (
            <p className="text-sm text-gray-500">
              Complete your artist profile to create and manage your events.
            </p>
          )}
          {hasProfile && myEventsLoading && <p className="text-sm text-gray-500">Loading your events...</p>}
          {myEventsError && <p className="alert-error">{myEventsError}</p>}
          {deleteEventError && <p className="alert-error">{deleteEventError}</p>}
          {deleteEventSuccess && <p className="alert-success">{deleteEventSuccess}</p>}

          {hasProfile && !myEventsLoading && !myEventsError && (
            <div className="space-y-4">
              {myEvents.length === 0 ? (
                <p className="text-sm text-gray-500">No events found. Create your first event.</p>
              ) : (
                <div ref={mapSectionRef} className="surface-card h-[460px] overflow-hidden p-2 shadow-md">
                  <MapContainer center={center} zoom={10} className="h-full w-full rounded-xl">
                    <RecenterMap center={focusedCenter} />
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {eventsWithCoords.map((event) => (
                      <Marker
                        key={event._id}
                        position={[event.lat, event.lng]}
                        eventHandlers={{
                          mouseover: (e) => e.target.openPopup(),
                          mouseout: (e) => e.target.closePopup(),
                        }}
                      >
                        <Popup>
                          <div className="space-y-1">
                            <p className="font-semibold">{event.title}</p>
                            <p>{event.venueId?.name}</p>
                            <p>{event.venueId?.city}</p>
                            <p>{new Date(event.eventDate).toLocaleDateString()}</p>
                            <p>{event.startTime} - {event.endTime}</p>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              )}

              <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <p className="text-xs text-gray-500">
                  Marker location is based on your event venue coordinates.
                </p>
              </div>

              {myEvents.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {myEvents.map((event) => (
                    <EventCard
                      key={event._id}
                      event={event}
                      variant="my"
                      showDelete
                      deleteLoading={deletingEventId === event._id}
                      onDelete={handleDeleteEvent}
                      onClick={() => {
                        const hasCoords =
                          Array.isArray(event?.venueId?.location?.coordinates) &&
                          event.venueId.location.coordinates.length >= 2;
                        if (hasCoords) {
                          setFocusedEventId(event._id);
                          mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      }}
                    />
                  ))}
                </div>
              )}

              {selectedEvent?.title && (
                <p className="text-xs text-gray-500">Selected event: {selectedEvent.title}</p>
              )}

              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <p className="text-sm text-gray-600">
                  Page {myEventsPagination.page} of {Math.max(myEventsPagination.totalPages || 1, 1)}
                </p>
                <div className="flex gap-2">
                  <button
                    className="btn-secondary"
                    disabled={myEventsPagination.page <= 1 || myEventsLoading}
                    onClick={() => setMyEventsPage((prev) => Math.max(prev - 1, 1))}
                  >
                    Previous
                  </button>
                  <button
                    className="btn-secondary"
                    disabled={
                      myEventsLoading ||
                      myEventsPagination.page >= Math.max(myEventsPagination.totalPages || 1, 1)
                    }
                    onClick={() =>
                      setMyEventsPage((prev) =>
                        Math.min(prev + 1, Math.max(myEventsPagination.totalPages || 1, 1))
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
