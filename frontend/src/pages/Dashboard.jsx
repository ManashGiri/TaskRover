import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../scripts/api";
import { ACCESS_TOKEN } from "../scripts/constants";
import TaskModal from "../components/TaskModal";
import EditTaskModal from "../components/EditTaskModal";
import ConfirmModal from "../components/ConfirmModal";
import CreateTeamModal from "../components/CreateTeamModal";
import CreateOrgModal from "../components/CreateOrgModal";
import UserManagerModal from "../components/UserManagerModal";

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [logs, setLogs] = useState([]);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [isCreateOrgModalOpen, setIsCreateOrgModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "",
    id: null,
    name: "",
  });
  const [dismissedBroadcasts, setDismissedBroadcasts] = useState(new Set());

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (!token) return;
      const userId = String(jwtDecode(token).user_id);

      const userRes = await api.get("/api/users/");
      const allUsers = userRes.data.results || userRes.data;
      setUsers(allUsers);
      const currentUser = allUsers.find((u) => String(u.id) === userId);
      if (currentUser) setMe(currentUser);

      const taskRes = await api.get("/api/tasks/");
      setTasks(taskRes.data.results || taskRes.data);

      try {
        const regRes = await api.get("/api/regions/");
        setRegions(regRes.data.results || regRes.data);
        const teamRes = await api.get("/api/teams/");
        setTeams(teamRes.data.results || teamRes.data);
      } catch (err) {
        console.warn("Organization data fetch issue", err);
      }

      if (
        currentUser &&
        ["ADMIN", "REGIONAL_MANAGER", "AUDITOR"].includes(currentUser.role)
      ) {
        const logRes = await api.get("/api/logs/");
        const logData = logRes.data.results || logRes.data;
        const businessLogs = logData.filter(
          (log) =>
            !/log(ged)?[\s_]*(in|out)/i.test(log.action) &&
            String(log.user) !== String(userId) &&
            log.username !== currentUser.username,
        );
        setLogs(businessLogs.reverse().slice(0, 5));
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (!me)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );

  const myTasks = tasks.filter((t) => {
    if (dismissedBroadcasts.has(t.id)) return false;
    if (me.role === "ADMIN" || me.role === "AUDITOR") return true;

    const isDirectlyAssigned = String(t.assigned_to) === String(me.id);
    const isBroadcastToEveryone =
      t.assigned_to === null && t.status === "PENDING";
    const didICreateIt = String(t.created_by) === String(me.id);

    return isDirectlyAssigned || isBroadcastToEveryone || didICreateIt;
  });

  const handleUpdateStatus = async (
    taskId,
    newStatus,
    isAcceptingBroadcast = false,
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    let actionVerb = newStatus === "IN_PROGRESS" ? "accepted" : "finished";
    if (newStatus === "VERIFIED") actionVerb = "verified";
    if (newStatus === "FLAGGED") actionVerb = "flagged";

    const payload = { status: newStatus };
    if (isAcceptingBroadcast) payload.assigned_to = me.id;

    try {
      await api.patch(`/api/tasks/update/${taskId}/`, payload);
      await api.post("/api/logs/", {
        action: `${me.role.replace("_", " ")} ${actionVerb} task: ${task ? task.title : taskId}`,
      });
      loadDashboardData();
      showToast(`Task ${actionVerb} successfully.`, "success");
    } catch (error) {
      console.error("Error updating task:", error);
      showToast("Error updating task status.", "error");
    }
  };

  const handleDeclineBroadcast = (taskId) =>
    setDismissedBroadcasts((prev) => new Set(prev).add(taskId));

  const handlePromptDelete = (task, isAbort) => {
    setConfirmDialog({
      isOpen: true,
      type: isAbort ? "ABORT" : "DELETE",
      id: task.id,
      name: task.title,
    });
  };

  const executeCreateTeam = async (customName) => {
    try {
      const teamRes = await api.post("/api/teams/", { name: customName });
      const newTeamId = teamRes.data.id;
      await api.patch(`/api/users/update/${me.id}/`, { team: newTeamId });
      await api.post("/api/logs/", {
        action: `Team Lead ${me.username} formed a new team: ${customName}`,
      });
      await loadDashboardData();
      showToast(`Team "${customName}" created!`, "success");
      setIsCreateTeamModalOpen(false);
      setIsManagerModalOpen(true);
    } catch (error) {
      console.error("Failed to create team:", error);
      showToast("Failed to create team. Check permissions.", "error");
    }
  };

  const executeConfirm = async () => {
    const { type, id, name } = confirmDialog;
    try {
      if (type === "KICK") {
        await api.patch(`/api/users/update/${id}/`, { team: null });
        await api.post("/api/logs/", {
          action: `Team Lead removed ${name} from their team.`,
        });
        showToast("Member kicked out.", "success");
      } else {
        const logMessage =
          type === "ABORT"
            ? `${me.role.replace("_", " ")} aborted task: ${name}`
            : `Task deleted: ${name}`;
        await api.delete(`/api/tasks/delete/${id}/`);
        await api.post("/api/logs/", { action: logMessage });
        showToast(`Task ${type.toLowerCase()}ed successfully.`, "success");
      }
      setConfirmDialog({ isOpen: false, type: "", id: null, name: "" });
      loadDashboardData();
    } catch (error) {
      console.error("Action failed:", error);
      showToast("Action failed to execute.", "error");
    }
  };

  const isCommandCenter = ["ADMIN", "AUDITOR", "REGIONAL_MANAGER"].includes(
    me.role,
  );
  const canDeployTask = ["ADMIN", "REGIONAL_MANAGER", "TEAM_LEAD"].includes(
    me.role,
  );
  const myTeamMembers = users
    .filter((u) => String(u.team) === String(me.team) && me.team !== null)
    .sort((a, b) => (a.role === "TEAM_LEAD" ? -1 : 1));

  return (
    <div className="space-y-8 pb-10">
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl shadow-2xl z-[100] text-white font-medium transform transition-all duration-300 ease-out flex items-center space-x-2 ${toast.type === "error" ? "bg-rose-600 shadow-rose-600/30" : "bg-emerald-600 shadow-emerald-600/30"}`}
        >
          <span>{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-800 pb-4 gap-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {isCommandCenter ? "Command Center" : "My Assignments"}
        </h1>
        <div className="flex flex-wrap gap-3">
          {me.role === "ADMIN" && (
            <button
              onClick={() => setIsCreateOrgModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              + Teams & Regions
            </button>
          )}

          {me.role !== "FIELD_AGENT" &&
            me.role !== "AUDITOR" &&
            (me.role === "TEAM_LEAD" && !me.team ? (
              <button
                onClick={() => setIsCreateTeamModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-emerald-600/20"
              >
                + Form Squad
              </button>
            ) : (
              <button
                onClick={() => setIsManagerModalOpen(true)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {me.role === "ADMIN"
                  ? "Assign Roles"
                  : me.role === "REGIONAL_MANAGER"
                    ? "Manage Region"
                    : "Recruit Members"}
              </button>
            ))}

          {canDeployTask && (
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-600/20 transition-colors"
            >
              + Deploy Task
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-amber-500 text-2xl font-bold">
            {tasks.filter((t) => t.status === "PENDING").length} Pending
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-emerald-500 text-2xl font-bold">
            {tasks.filter((t) => t.status === "VERIFIED").length} Verified
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <p className="text-white text-2xl font-bold">{tasks.length} Total</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">
          Active Deployments
        </h2>

        {myTasks.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-500">
              No active deployments at the moment. You're all caught up!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {myTasks.map((task) => {
              const isAssignee = String(task.assigned_to) === String(me.id);
              const isOpenBroadcast =
                task.assigned_to === null && task.status === "PENDING";
              const isCreator = String(task.created_by) === String(me.id);

              return (
                <div
                  key={task.id}
                  className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden"
                >
                  {isOpenBroadcast && (
                    <div className="absolute top-0 right-0 bg-indigo-600 text-[10px] font-bold text-white px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                      Open Broadcast
                    </div>
                  )}
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span
                        className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                          task.status === "COMPLETED" ||
                          task.status === "VERIFIED"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : task.status === "IN_PROGRESS"
                              ? "bg-blue-500/10 text-blue-400"
                              : task.status === "FLAGGED"
                                ? "bg-rose-500/10 text-rose-400"
                                : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                      <h3 className="text-lg font-medium text-white">
                        {task.title}
                      </h3>
                      {task.is_edited && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-wide">
                          Edited
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm mb-3">
                      {task.description}
                    </p>

                    {task.ai_summary && (
                      <div className="bg-indigo-900/20 border border-indigo-500/30 p-3 rounded-lg mb-3">
                        <p className="text-indigo-300 text-xs font-medium mb-1">
                          🤖 AI Verification Summary
                        </p>
                        <p className="text-slate-300 text-xs italic">
                          {task.ai_summary}
                        </p>
                      </div>
                    )}

                    <p className="text-slate-500 text-xs">
                      Task #{task.id} • Assigned to:{" "}
                      <span className="text-indigo-400">
                        {task.assigned_to_name ||
                          (isOpenBroadcast ? "Everyone" : "Unassigned")}
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-slate-800 pt-4">
                    {!isCreator &&
                      task.status === "PENDING" &&
                      (isAssignee || isOpenBroadcast) && (
                        <>
                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                task.id,
                                "IN_PROGRESS",
                                isOpenBroadcast,
                              )
                            }
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium w-full"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineBroadcast(task.id)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium w-full"
                          >
                            Decline
                          </button>
                        </>
                      )}

                    {!isCreator &&
                      (task.status === "IN_PROGRESS" ||
                        task.status === "FLAGGED") &&
                      isAssignee && (
                        <>
                          <button
                            onClick={() =>
                              handleUpdateStatus(task.id, "COMPLETED")
                            }
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium w-full"
                          >
                            Mark Done
                          </button>
                          <button
                            onClick={() => handlePromptDelete(task, true)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg text-sm font-medium w-full"
                          >
                            Abort
                          </button>
                        </>
                      )}

                    {(isCreator || me.role === "ADMIN") &&
                      task.status !== "COMPLETED" &&
                      task.status !== "VERIFIED" && (
                        <>
                          {task.status === "IN_PROGRESS" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(task.id, "COMPLETED")
                              }
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium w-full"
                            >
                              Force Complete
                            </button>
                          )}
                          <button
                            onClick={() => setTaskToEdit(task)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium w-full"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handlePromptDelete(task, false)}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg text-sm font-medium w-full"
                          >
                            Delete
                          </button>
                        </>
                      )}

                    {me.role === "AUDITOR" && task.status === "COMPLETED" && (
                      <>
                        <button
                          onClick={() =>
                            handleUpdateStatus(task.id, "VERIFIED")
                          }
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium w-full transition-colors"
                        >
                          Verify & Close
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(task.id, "FLAGGED")}
                          className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 px-4 py-2 rounded-lg text-sm font-medium w-full transition-colors"
                        >
                          Flag Issue
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-12">
        {isCommandCenter ? (
          <>
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-xl font-semibold text-white">
                Recent Activity
              </h2>
              {["ADMIN", "AUDITOR"].includes(me.role) && (
                <a
                  href="/logs"
                  className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  View All Activity &rarr;
                </a>
              )}
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              {logs.length === 0 ? (
                <div className="p-6 text-slate-500 text-sm text-center">
                  No recent activity found.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="px-6 py-4 border-b border-slate-800 flex justify-between items-center text-sm"
                  >
                    <span className="text-slate-300">
                      <strong className="text-white">{log.user_name}:</strong>{" "}
                      {log.action}
                    </span>
                    <span className="text-slate-500 text-xs italic">
                      {new Date(
                        log.created_at || log.timestamp || new Date(),
                      ).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-white mb-4">
              My Team Roster
            </h2>

            {myTeamMembers.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center w-full">
                <p className="text-slate-500">
                  {me.role === "TEAM_LEAD"
                    ? "Your squad is currently empty. Start recruiting members!"
                    : "You haven't been assigned to a squad yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {myTeamMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`p-4 rounded-2xl border flex justify-between items-center ${member.role === "TEAM_LEAD" ? "bg-indigo-900/20 border-indigo-500/30" : "bg-slate-900 border-slate-800"}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${member.role === "TEAM_LEAD" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300"}`}
                      >
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {member.username} {member.id === me.id && "(You)"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {member.role === "TEAM_LEAD"
                            ? "Team Lead 👑"
                            : "Field Agent"}
                        </p>
                      </div>
                    </div>
                    {me.role === "TEAM_LEAD" && member.id !== me.id && (
                      <button
                        onClick={() =>
                          setConfirmDialog({
                            isOpen: true,
                            type: "KICK",
                            id: member.id,
                            name: member.username,
                          })
                        }
                        className="text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Kick Out
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onTaskCreated={loadDashboardData}
      />
      <EditTaskModal
        isOpen={!!taskToEdit}
        task={taskToEdit}
        onClose={() => setTaskToEdit(null)}
        onTaskUpdated={loadDashboardData}
      />

      {/* Newly Imported Modals */}
      <CreateOrgModal
        isOpen={isCreateOrgModalOpen}
        onClose={() => setIsCreateOrgModalOpen(false)}
        onUpdate={loadDashboardData}
        showToast={showToast}
      />
      <CreateTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
        onCreate={executeCreateTeam}
      />
      <UserManagerModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        currentUserRole={me.role}
        myTeam={me.team}
        myTeamName={me.team_name}
        myRegion={me.region}
        users={users}
        regions={regions}
        teams={teams}
        onUpdate={loadDashboardData}
        showToast={showToast}
      />

      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={
          confirmDialog.type === "KICK"
            ? "Remove Team Member"
            : confirmDialog.type === "ABORT"
              ? "Abort Assignment"
              : "Delete Task"
        }
        message={
          confirmDialog.type === "KICK"
            ? `Are you sure you want to remove ${confirmDialog.name} from your team?`
            : confirmDialog.type === "ABORT"
              ? `Are you sure you want to abort "${confirmDialog.name}"?`
              : `Are you sure you want to permanently delete "${confirmDialog.name}"?`
        }
        confirmText={
          confirmDialog.type === "KICK"
            ? "Yes, Remove"
            : confirmDialog.type === "ABORT"
              ? "Yes, Abort"
              : "Yes, Delete"
        }
        isDanger={confirmDialog.type !== "ABORT"}
        onConfirm={executeConfirm}
        onCancel={() =>
          setConfirmDialog({ isOpen: false, type: "", id: null, name: "" })
        }
      />
    </div>
  );
}
