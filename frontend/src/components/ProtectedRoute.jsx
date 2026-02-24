import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ requireArtist = false, requireFan = false }) {
  const { isAuthenticated, role } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireArtist && role !== "artist") {
    return <Navigate to="/public-map" replace />;
  }

  if (requireFan && role !== "fan") {
    return <Navigate to="/public-map" replace />;
  }

  return <Outlet />;
}
