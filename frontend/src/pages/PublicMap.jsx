import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import EventCard from "../components/EventCard";
import { fetchEvents } from "../features/events/eventSlice";

const fallbackCenter = [12.9716, 77.5946];

function RecenterMap({ center }) {
  const map = useMap();
  const centerKey = Array.isArray(center) && center.length >= 2 ? `${center[0]}:${center[1]}` : "";

  useEffect(() => {
    if (!Array.isArray(center) || center.length < 2) return;
    map.setView(center, 14, { animate: true });
  }, [centerKey, map]);

  return null;
}

export default function PublicMap() {
  const [filters, setFilters] = useState({ location: "", distance: "10", venue: "" });
  const [page, setPage] = useState(1);
  const [activeQuery, setActiveQuery] = useState({});
  const [selectedEventId, setSelectedEventId] = useState(null);
  const mapSectionRef = useRef(null);
  const dispatch = useDispatch();
  const { allEvents, allEventsLoading, allEventsError, allEventsPagination } = useSelector((state) => state.events);

  useEffect(() => {
    dispatch(fetchEvents({ ...activeQuery, page, limit: 20 }));
  }, [dispatch, activeQuery, page]);

  const applyGeoFilter = (e) => {
    e.preventDefault();
    const query = {};
    if (filters.location.trim()) {
      query.location = filters.location.trim();
      query.distance = filters.distance || "10";
    }
    if (filters.venue.trim()) {
      query.venue = filters.venue.trim();
    }
    setPage(1);
    setActiveQuery(query);
  };

  const list = useMemo(() => allEvents || [], [allEvents]);

  const eventsWithCoords = list
    .map((event) => {
      const coords = event?.venueId?.location?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) return null;
      return {
        ...event,
        lat: coords[1],
        lng: coords[0],
      };
    })
    .filter(Boolean);

  useEffect(() => {
    if (eventsWithCoords.length === 0) {
      if (selectedEventId !== null) setSelectedEventId(null);
      return;
    }
    if (!selectedEventId || !eventsWithCoords.some((event) => event._id === selectedEventId)) {
      setSelectedEventId(eventsWithCoords[0]._id);
    }
  }, [eventsWithCoords, selectedEventId]);

  const selectedEvent = useMemo(() => {
    if (eventsWithCoords.length === 0) return null;
    return eventsWithCoords.find((event) => event._id === selectedEventId) || eventsWithCoords[0];
  }, [eventsWithCoords, selectedEventId]);

  const center = selectedEvent ? [selectedEvent.lat, selectedEvent.lng] : fallbackCenter;

  return (
    <div className="mx-auto mt-4 max-w-6xl space-y-6">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Events Map</h1>
        <p className="text-sm text-gray-500">
          Showing {list.length} of {allEventsPagination.total || 0} events
        </p>
      </div>

      <form onSubmit={applyGeoFilter} className="surface-card grid gap-3 p-4 md:grid-cols-6">
        <input
          className="input-field md:col-span-2"
          placeholder="Search by venue (name/address/city)"
          value={filters.venue}
          onChange={(e) => setFilters({ ...filters, venue: e.target.value })}
        />
        <input
          className="input-field md:col-span-2"
          placeholder="Enter location (e.g. Bangalore, MG Road)"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
        />
        <input
          className="input-field"
          placeholder="Distance (km)"
          value={filters.distance}
          onChange={(e) => setFilters({ ...filters, distance: e.target.value })}
        />
        <button className="btn-primary">Search Nearby</button>
      </form>

      <div ref={mapSectionRef} className="surface-card h-[430px] overflow-hidden p-2 shadow-md">
        <MapContainer center={center} zoom={10} className="h-full w-full rounded-xl">
          <RecenterMap center={center} />
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

      {allEventsLoading && <p className="text-sm text-gray-500">Loading events...</p>}
      {allEventsError && <p className="alert-error">{allEventsError}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {list.map((event) => (
          <EventCard
            key={event._id}
            event={event}
            onClick={() => {
              const coords = event?.venueId?.location?.coordinates;
              if (Array.isArray(coords) && coords.length >= 2) {
                setSelectedEventId(event._id);
                mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <p className="text-sm text-gray-600">
          Page {allEventsPagination.page} of {Math.max(allEventsPagination.totalPages || 1, 1)}
        </p>
        <div className="flex gap-2">
          <button
            className="btn-secondary"
            disabled={allEventsPagination.page <= 1 || allEventsLoading}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          >
            Previous
          </button>
          <button
            className="btn-secondary"
            disabled={
              allEventsLoading ||
              allEventsPagination.page >= Math.max(allEventsPagination.totalPages || 1, 1)
            }
            onClick={() =>
              setPage((prev) =>
                Math.min(prev + 1, Math.max(allEventsPagination.totalPages || 1, 1))
              )
            }
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
