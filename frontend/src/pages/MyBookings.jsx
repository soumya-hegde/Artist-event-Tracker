import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import EventCard from "../components/EventCard";
import { fetchBookedEvents } from "../features/events/eventSlice";

export default function MyBookings() {
  const [page, setPage] = useState(1);
  const dispatch = useDispatch();
  const { bookedEvents, bookedEventsLoading, bookedEventsError, bookedEventsPagination } = useSelector(
    (state) => state.events
  );

  useEffect(() => {
    dispatch(fetchBookedEvents({ page, limit: 20 }));
  }, [dispatch, page]);

  return (
    <div className="mx-auto mt-4 max-w-5xl space-y-5">
      <section className="surface-card p-8">
        <p className="text-sm font-medium uppercase tracking-wide text-indigo-700">My Bookings</p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-800">Booked Events</h1>
        <p className="mt-1 text-gray-500">
          Showing {bookedEvents.length} of {bookedEventsPagination.total || 0} booked events
        </p>
      </section>

      {bookedEventsLoading && <p className="text-sm text-gray-500">Loading booked events...</p>}
      {bookedEventsError && <p className="alert-error">{bookedEventsError}</p>}

      {!bookedEventsLoading && !bookedEventsError && bookedEvents.length === 0 && (
        <div className="surface-card p-6">
          <p className="text-sm text-gray-500">No bookings found.</p>
        </div>
      )}

      {!bookedEventsLoading && !bookedEventsError && bookedEvents.length > 0 && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {bookedEvents.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <p className="text-sm text-gray-600">
              Page {bookedEventsPagination.page} of {Math.max(bookedEventsPagination.totalPages || 1, 1)}
            </p>
            <div className="flex gap-2">
              <button
                className="btn-secondary"
                disabled={bookedEventsPagination.page <= 1 || bookedEventsLoading}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              <button
                className="btn-secondary"
                disabled={
                  bookedEventsLoading ||
                  bookedEventsPagination.page >= Math.max(bookedEventsPagination.totalPages || 1, 1)
                }
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, Math.max(bookedEventsPagination.totalPages || 1, 1)))
                }
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
