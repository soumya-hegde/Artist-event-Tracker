export default function EventCard({
  event,
  variant = "default",
  onClick,
  showDelete = false,
  onDelete,
  deleteLoading = false,
}) {
  const cardClass =
    variant === "my"
      ? "rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-sm"
      : "surface-card p-5";

  return (
    <article
      className={`${cardClass}${onClick ? " cursor-pointer transition hover:shadow-md" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
    >
      <h2 className="text-lg font-semibold text-gray-800">{event.title}</h2>
      <p className="mt-1 text-gray-600">{event.description || "No description provided."}</p>
      <p className="mt-3 text-sm text-gray-700">
        {event.venueId?.name} - {event.venueId?.city}, {event.venueId?.state}
      </p>
      <p className="text-sm text-gray-500">
        {new Date(event.eventDate).toLocaleDateString()} | {event.startTime} - {event.endTime}
      </p>
      {showDelete && (
        <div className="mt-3">
          <button
            type="button"
            className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-medium text-white hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) onDelete(event);
            }}
            disabled={deleteLoading}
          >
            {deleteLoading ? "Removing..." : "Remove Event"}
          </button>
        </div>
      )}
    </article>
  );
}
