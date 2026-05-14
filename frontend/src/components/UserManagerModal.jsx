import { useState, useEffect } from "react";
import api from "../scripts/api";

export default function UserManagerModal({
  isOpen,
  onClose,
  currentUserRole,
  myTeam,
  myTeamName,
  myRegion,
  users,
  regions,
  teams,
  onUpdate,
  showToast,
}) {
  const [localTeamName, setLocalTeamName] = useState("");

  useEffect(() => {
    if (isOpen) setLocalTeamName(myTeamName || "");
  }, [isOpen, myTeamName]);

  if (!isOpen) return null;

  const handleAction = async (userId, actionType, value) => {
    try {
      const payloadValue = value === "NONE" ? null : value;
      await api.patch(`/api/users/update/${userId}/`, {
        [actionType]: payloadValue,
      });

      const targetUser = users.find((u) => u.id === userId);

      if (currentUserRole === "TEAM_LEAD" && actionType === "team") {
        await api.post("/api/logs/", {
          action: `Team Lead recruited ${targetUser?.username} to their squad.`,
        });
      } else if (currentUserRole === "ADMIN") {
        await api.post("/api/logs/", {
          action: `Admin updated ${actionType} for ${targetUser?.username}.`,
        });
      }

      onUpdate();
      showToast(`Successfully updated user ${actionType}.`, "success");
    } catch (error) {
      console.error(`Failed to update ${actionType}`, error);
      showToast(
        `Update failed. Ensure backend allows null for ${actionType}!`,
        "error",
      );
    }
  };

  const handleUpdateTeamName = async () => {
    if (!myTeam)
      return showToast("You don't have a team assigned to rename.", "error");
    try {
      await api.patch(`/api/teams/update/${myTeam}/`, { name: localTeamName });
      await api.post("/api/logs/", {
        action: `Team Lead renamed their team to "${localTeamName}"`,
      });
      onUpdate();
      showToast("Team name updated successfully!", "success");
    } catch (error) {
      console.error("Failed to update team name", error);
      showToast(
        "Failed to update team name. Check your backend endpoint.",
        "error",
      );
    }
  };

  const getManageableUsers = () => {
    if (currentUserRole === "ADMIN") return users;
    if (currentUserRole === "REGIONAL_MANAGER")
      return users.filter(
        (u) => String(u.region) === String(myRegion) || !u.region,
      );
    if (currentUserRole === "TEAM_LEAD")
      return users.filter((u) => u.role === "FIELD_AGENT" && !u.team);
    return [];
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-4xl shadow-2xl h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {currentUserRole === "ADMIN"
              ? "Manage Roles, Regions & Teams"
              : currentUserRole === "REGIONAL_MANAGER"
                ? "Manage Region Roster"
                : "Recruit Team Members"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {currentUserRole === "TEAM_LEAD" && myTeam && (
          <div className="mb-6 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <label className="block text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">
              Squad Name
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={localTeamName}
                onChange={(e) => setLocalTeamName(e.target.value)}
                placeholder="Enter a team name..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              <button
                onClick={handleUpdateTeamName}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
              >
                Save Name
              </button>
            </div>
          </div>
        )}

        <div className="overflow-y-auto flex-1 space-y-3 pr-2">
          {getManageableUsers().length === 0 && (
            <div className="text-center text-slate-500 py-10">
              No users available for this action.
            </div>
          )}
          {getManageableUsers().map((u) => (
            <div
              key={u.id}
              className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
            >
              <div>
                <p className="text-white font-medium">{u.username}</p>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {u.role !== "FIELD_AGENT" && (
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded uppercase">
                      {u.role.replace("_", " ")}
                    </span>
                  )}
                  {u.region && (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                      Reg {u.region_name || u.region}
                    </span>
                  )}
                  {u.team && (
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                      Team {u.team_name || u.team}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                {currentUserRole === "ADMIN" && (
                  <>
                    <select
                      value={u.role || "FIELD_AGENT"}
                      onChange={(e) =>
                        handleAction(u.id, "role", e.target.value)
                      }
                      className="bg-slate-900 border border-slate-700 text-sm text-white p-2 rounded outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="FIELD_AGENT">Field Agent</option>
                      <option value="TEAM_LEAD">Team Lead</option>
                      <option value="REGIONAL_MANAGER">Regional Manager</option>
                      <option value="AUDITOR">Auditor</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    <select
                      value={u.team || "NONE"}
                      onChange={(e) =>
                        handleAction(u.id, "team", e.target.value)
                      }
                      className="bg-slate-900 border border-slate-700 text-sm text-white p-2 rounded outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="NONE">No Team</option>
                      {teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name || `Team ${t.id}`}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {(currentUserRole === "ADMIN" ||
                  currentUserRole === "REGIONAL_MANAGER") &&
                  u.role !== "ADMIN" && (
                    <select
                      value={u.region || "NONE"}
                      onChange={(e) =>
                        handleAction(u.id, "region", e.target.value)
                      }
                      className="bg-slate-900 border border-slate-700 text-sm text-white p-2 rounded outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="NONE">No Region</option>
                      {regions.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name || `Region ${r.id}`}
                        </option>
                      ))}
                    </select>
                  )}

                {currentUserRole === "TEAM_LEAD" && (
                  <button
                    onClick={() => handleAction(u.id, "team", myTeam)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Add to Team
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
