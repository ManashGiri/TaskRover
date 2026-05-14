import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../scripts/api";
import { ACCESS_TOKEN } from "../scripts/constants";

function Navbar() {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [username, setUsername] = useState("Agent");
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [userTeam, setUserTeam] = useState(null);
  const [userRegion, setUserRegion] = useState(null);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (token) {
          const decoded = jwtDecode(token);
          const userId = decoded.user_id;

          const res = await api.get("/api/users/");
          const userData = res.data.results ? res.data.results : res.data;

          const me = userData.find((u) => String(u.id) === String(userId));

          if (me) {
            setUsername(me.username);
            setNewUsername(me.username);
            setCurrentUserId(me.id);
            setCurrentUserRole(me.role);
            setUserTeam(me.team_name || null);
            setUserRegion(me.region_name || null);
          } else {
            console.log("Looking for ID:", userId);
            console.log("But Django sent back:", userData);
          }
        }
      } catch (error) {
        console.error("Failed to load user info:", error);
      }
    };
    fetchUser();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/api/logs/", { action: "User logged out." });
    } catch {
      console.log("Logout log failed (probably expired token)");
    }
    localStorage.clear();
    navigate("/login");
  };

  const handleUpdateUsername = async () => {
    try {
      const res = await api.patch(`/api/users/update/${currentUserId}/`, {
        username: newUsername,
      });
      setUsername(res.data.username);
      setIsEditingUsername(false);

      await api.post("/api/logs/", {
        action: `Changed username from ${username} to ${res.data.username}`,
      });
    } catch (error) {
      console.error("Update failed", error);
      alert("Username might already be taken!");
    }
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <div
              className="flex-shrink-0 flex items-center cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
                <span className="text-white font-bold text-xl">T</span>
              </div>
              <span className="text-white font-bold text-xl tracking-tight">
                TaskRover
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => navigate("/")}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                {currentUserRole === "ADMIN" ||
                currentUserRole === "REGIONAL_MANAGER"
                  ? "Dashboard"
                  : "Home"}
              </button>
              <button
                onClick={() => navigate("/visits")}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Visits
              </button>
            </div>
          </div>

          <div className="relative flex items-center" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 text-slate-300 hover:text-white transition-colors focus:outline-none"
            >
              <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                <span className="text-sm font-bold text-indigo-400">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>

              <span className="hidden md:block text-sm font-medium">
                {username}
              </span>
              <svg
                className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-3 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800">
                  <p className="text-sm font-bold text-white">{username}</p>
                  {currentUserRole && (
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">
                      {currentUserRole.replace("_", " ")}
                    </p>
                  )}
                  {(userRegion || userTeam) && (
                    <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-1">
                      {userRegion && (
                        <p className="text-xs text-slate-300 flex items-center">
                          <span className="mr-2 opacity-70">📍</span>{" "}
                          {userRegion}
                        </p>
                      )}
                      {userTeam && (
                        <p className="text-xs text-slate-300 flex items-center">
                          <span className="mr-2 opacity-70">👥</span> {userTeam}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="py-2">
                  <div className="px-4 py-1">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      Account Settings
                    </p>
                  </div>

                  {isEditingUsername ? (
                    <div className="px-4 py-2 space-y-2">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-950 border border-indigo-500 rounded-lg text-sm text-white focus:outline-none"
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleUpdateUsername}
                          className="flex-1 bg-indigo-600 text-white text-xs py-1.5 rounded-md hover:bg-indigo-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setIsEditingUsername(false)}
                          className="flex-1 bg-slate-800 text-slate-300 text-xs py-1.5 rounded-md hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsEditingUsername(true)}
                      className="block w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      Change Username
                    </button>
                  )}

                  <button
                    onClick={() => setIsDropdownOpen(false)}
                    className="block w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    Change Password
                  </button>

                  <div className="h-px bg-slate-800 my-1"></div>

                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
