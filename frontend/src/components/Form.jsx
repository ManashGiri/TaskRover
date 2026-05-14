import { useState } from "react";
import api from "../scripts/api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../scripts/constants";

function Form({ route, method }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const title = method === "login" ? "Welcome Back" : "Create Account";
  const buttonText = method === "login" ? "Sign In" : "Register";
  const redirectText =
    method === "login"
      ? "Need an account? Register"
      : "Already have an account? Log in";
  const redirectPath = method === "login" ? "/register" : "/login";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload =
        method === "register"
          ? { username, password, email }
          : { username, password };

      const res = await api.post(route, payload);

      if (method === "login") {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);

        await api.post("/api/logs/", { action: `User ${username} logged in.` });

        navigate("/");
      } else {
        navigate("/login");
      }
    } catch (err) {
      if (err.response?.data) {
        if (err.response.data.detail) {
          setError(err.response.data.detail);
        } else {
          const errorMessages = Object.entries(err.response.data)
            .map(([field, msgs]) => `${field}: ${msgs}`)
            .join(" | ");
          setError(
            errorMessages || "Invalid credentials or user already exists.",
          );
        }
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {title}
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            TaskRover Field Operations Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-900/50 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {method === "register" && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@taskrover.com"
                required
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {loading ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              buttonText
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate(redirectPath)}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {redirectText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Form;
