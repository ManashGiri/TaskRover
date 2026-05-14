import { useState } from "react";
import api from "../scripts/api";

export default function CreateOrgModal({
  isOpen,
  onClose,
  onUpdate,
  showToast,
}) {
  const [teamName, setTeamName] = useState("");
  const [regionName, setRegionName] = useState("");

  if (!isOpen) return null;

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/teams/", { name: teamName });
      await api.post("/api/logs/", {
        action: `Admin created a new team: ${teamName}`,
      });
      setTeamName("");
      onUpdate();
      showToast("Team created successfully!", "success");
    } catch (error) {
      console.error("Failed to create team:", error);
      showToast(
        "Failed to create team. Ensure Admin has POST permissions.",
        "error",
      );
    }
  };

  const handleCreateRegion = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/regions/", { name: regionName });
      await api.post("/api/logs/", {
        action: `Admin created a new region: ${regionName}`,
      });
      setRegionName("");
      onUpdate();
      showToast("Region created successfully!", "success");
    } catch (error) {
      console.error("Failed to create region:", error);
      showToast(
        "Failed to create region. Ensure Admin has POST permissions.",
        "error",
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Organization Setup</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleCreateTeam}
          className="mb-6 bg-slate-950 p-4 rounded-xl border border-slate-800"
        >
          <label className="block text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">
            Create New Team
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g., Alpha Squad"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Create
            </button>
          </div>
        </form>

        <form
          onSubmit={handleCreateRegion}
          className="bg-slate-950 p-4 rounded-xl border border-slate-800"
        >
          <label className="block text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">
            Create New Region
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              required
              value={regionName}
              onChange={(e) => setRegionName(e.target.value)}
              placeholder="e.g., North District"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
