import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../scripts/api";
import { ACCESS_TOKEN } from "../scripts/constants";

export default function TaskModal({ isOpen, onClose, onTaskCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [assigneeType, setAssigneeType] = useState("FIELD_AGENT");
  const [users, setUsers] = useState([]);
  const [me, setMe] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchUsers = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      const myId = String(jwtDecode(token).user_id);

      const res = await api.get("/api/users/");
      const allUsers = res.data.results || res.data;

      const currentUser = allUsers.find((u) => String(u.id) === myId);
      setMe(currentUser);
      setUsers(allUsers);
    };
    fetchUsers();
  }, [isOpen]);

  if (!isOpen || !me) return null;
  const getFilteredUsers = () => {
    if (assigneeType === "EVERYONE") return [];

    let filtered = users;

    filtered = filtered.filter((u) => u.role === assigneeType);

    if (me.role === "REGIONAL_MANAGER") {
      filtered = filtered.filter((u) => u.region === me.region);
    } else if (me.role === "TEAM_LEAD") {
      filtered = filtered.filter((u) => u.team === me.team); 
    }

    return filtered;
  };

  const availableUsers = getFilteredUsers();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      title,
      description,
      status: "PENDING",
      assigned_to: assigneeType === "EVERYONE" ? null : assignedTo,
    };

    try {
      await api.post("/api/tasks/", payload);
      const assigneeName = assigneeType === "EVERYONE" ? "Everyone" : "Agent";
      await api.post("/api/logs/", {
        action: `${me.role.replace("_", " ")} created task "${title}" for ${assigneeName}`,
      });

      setTitle("");
      setDescription("");
      setAssignedTo("");
      setAssigneeType("FIELD_AGENT");
      onTaskCreated();
      onClose();
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in-up">
        <h2 className="text-xl font-bold text-white mb-6">Create New Task</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Task Title
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-1">
              Description
            </label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <label className="block text-slate-400 text-xs uppercase tracking-wider font-semibold mb-3">
              Assign To Level
            </label>
            <div className="flex flex-wrap gap-3">
              {[
                "FIELD_AGENT",
                "TEAM_LEAD",
                "REGIONAL_MANAGER",
                "AUDITOR",
                "EVERYONE",
              ].map((role) => {
                if (
                  me.role === "TEAM_LEAD" &&
                  !["FIELD_AGENT", "EVERYONE"].includes(role)
                )
                  return null;
                if (
                  me.role === "REGIONAL_MANAGER" &&
                  ["REGIONAL_MANAGER", "AUDITOR"].includes(role)
                )
                  return null;

                return (
                  <label
                    key={role}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="assigneeType"
                      value={role}
                      checked={assigneeType === role}
                      onChange={(e) => {
                        setAssigneeType(e.target.value);
                        setAssignedTo("");
                      }}
                      className="text-indigo-500 focus:ring-indigo-500 bg-slate-800 border-slate-700"
                    />
                    <span className="text-sm text-slate-300">
                      {role.replace("_", " ")}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {assigneeType !== "EVERYONE" && (
            <div>
              <label className="block text-slate-400 text-sm mb-1">
                Select Specific User
              </label>
              <select
                required
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="" disabled>
                  Select a {assigneeType.replace("_", " ").toLowerCase()}...
                </option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-medium"
            >
              Deploy Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
