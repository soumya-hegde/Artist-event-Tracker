import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";

const textLinkClass = ({ isActive }) =>
  isActive
    ? "rounded-lg bg-slate-700 px-3 py-2 text-sm font-medium text-white"
    : "rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 hover:text-white";

const authLinkClass = ({ isActive }) =>
  isActive
    ? "rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
    : "rounded-xl border border-slate-500 bg-transparent px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800";

export default function Navbar() {
  const { isAuthenticated, user, role } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-700 bg-slate-900">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight text-white">
          Artist Map Tracker
        </Link>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {role === "artist" && (
                <NavLink to="/my-events" className={textLinkClass}>
                  My Events
                </NavLink>
              )}
              {role === "fan" && (
                <NavLink to="/my-bookings" className={textLinkClass}>
                  My Bookings
                </NavLink>
              )}
              <NavLink to="/public-map" className={textLinkClass}>
                Events
              </NavLink>
              {role === "artist" && (
                <NavLink to="/events/create" className={textLinkClass}>
                  Create Event
                </NavLink>
              )}
              <NavLink
                to="/profile"
                className="hidden rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs text-slate-200 transition hover:bg-slate-700 sm:inline"
              >
                {user?.email}
              </NavLink>
              <button type="button" onClick={handleLogout} className="btn-primary">
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={authLinkClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={authLinkClass}>
                Register
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
