import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthError, registerUser } from "../features/auth/authSlice";

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M17.94 17.94A10.8 10.8 0 0 1 12 19C5 19 1 12 1 12a21.8 21.8 0 0 1 5.08-5.94" />
      <path d="M9.9 4.24A11.1 11.1 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-3.17 4.36" />
      <path d="M14.12 14.12A3 3 0 0 1 9.88 9.88" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "fan" });
  const [showPassword, setShowPassword] = useState(false);
  const { loading, error, infoMessage } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(registerUser(form));
  };

  useEffect(() => {
    if (infoMessage) {
      const id = setTimeout(() => navigate("/login"), 1200);
      return () => clearTimeout(id);
    }
  }, [infoMessage, navigate]);

  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  return (
    <div className="mx-auto mt-10 w-full max-w-md surface-card p-7">
      <h1 className="mb-1 text-2xl font-semibold text-gray-800">Create account</h1>
      <p className="mb-6 text-sm text-gray-500">Set up your profile to start tracking events.</p>
      {error && <p className="alert-error mb-4">{error}</p>}
      {infoMessage && <p className="alert-success mb-4">{infoMessage}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          className="input-field"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="input-field"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <div className="relative">
          <input
            className="input-field pr-10"
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        <select
          className="input-field"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="fan">Fan</option>
          <option value="artist">Artist</option>
        </select>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
      <p className="mt-5 text-sm text-gray-600">
        Already registered? <Link className="font-medium text-indigo-700 hover:text-indigo-800" to="/login">Login</Link>
      </p>
    </div>
  );
}
