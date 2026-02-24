import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useSelector } from "react-redux";
import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateEvent from "./pages/CreateEvent";
import PublicMap from "./pages/PublicMap";
import Profile from "./pages/Profile";
import MyBookings from "./pages/MyBookings";

function DefaultRedirect() {
  const { isAuthenticated, role } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/public-map" replace />;
  return <Navigate to={role === "artist" ? "/my-events" : "/my-bookings"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DefaultRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/public-map" element={<PublicMap />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route element={<ProtectedRoute requireFan />}>
            <Route path="/my-bookings" element={<MyBookings />} />
          </Route>

          <Route element={<ProtectedRoute requireArtist />}>
            <Route path="/my-events" element={<Dashboard />} />
            <Route path="/dashboard" element={<Navigate to="/my-events" replace />} />
          </Route>

          <Route element={<ProtectedRoute requireArtist />}>
            <Route path="/events/create" element={<CreateEvent />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
