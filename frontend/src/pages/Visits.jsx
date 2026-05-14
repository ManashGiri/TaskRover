import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../scripts/api";
import { ACCESS_TOKEN } from "../scripts/constants";
import StartVisitForm from "../components/StartVisitForm";
import ActiveVisitForm from "../components/ActiveVisitForm";

function ExpandableText({ text, maxLength = 150, textClass, buttonClass }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  if (text.length <= maxLength) {
    return <p className={textClass}>{text}</p>;
  }
  return (
    <div>
      <p className={textClass}>
        {isExpanded ? text : `${text.substring(0, maxLength).trim()}...`}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={buttonClass}
      >
        {isExpanded ? "Show Less" : "Read More"}
      </button>
    </div>
  );
}

export default function Visits() {
  const [currentUserId] = useState(() => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    return token ? String(jwtDecode(token).user_id) : null;
  });

  const [visits, setVisits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [note, setNote] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [validationError, setValidationError] = useState("");

  const loadVisitsData = async () => {
    try {
      const userRes = await api.get("/api/users/");
      const userData = userRes.data.results
        ? userRes.data.results
        : userRes.data;
      const me = userData.find((u) => String(u.id) === currentUserId);
      if (me) setCurrentUserRole(me.role);

      const taskRes = await api.get("/api/tasks/");
      const taskData = taskRes.data.results
        ? taskRes.data.results
        : taskRes.data;
      setTasks(
        taskData.filter(
          (t) => t.status !== "COMPLETED" && t.status !== "VERIFIED",
        ),
      );

      const visitRes = await api.get("/api/visits/");
      const visitData = visitRes.data.results
        ? visitRes.data.results
        : visitRes.data;
      setVisits(visitData.reverse());
    } catch (err) {
      console.error("Failed to load visit data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVisitsData();
  }, []);

  const activeVisit =
    visits.find((v) => {
      if (v.status !== "IN_PROGRESS") return false;
      const agentId =
        typeof v.agent === "object" && v.agent !== null
          ? String(v.agent.id)
          : String(v.agent);
      return agentId === currentUserId;
    }) ||
    visits.find(
      (v) => String(v.id) === localStorage.getItem("active_visit_id"),
    );

  const handleStartVisit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!selectedTaskId) {
      setValidationError(
        "Please select a task destination before clocking in.",
      );
      return;
    }

    const targetTask = tasks.find(
      (t) => String(t.id) === String(selectedTaskId),
    );
    const taskName = targetTask ? targetTask.title : selectedTaskId;

    try {
      const res = await api.post("/api/visits/", {
        task: selectedTaskId,
        status: "IN_PROGRESS",
        started_at: new Date().toISOString(),
      });

      await api.post("/api/logs/", {
        action: `Agent arrived on-site for: ${taskName}`,
      });

      localStorage.setItem("active_visit_id", res.data.id);
      setVisits((prevVisits) => [
        { ...res.data, agent: currentUserId, status: "IN_PROGRESS" },
        ...prevVisits,
      ]);
      setSelectedTaskId("");
    } catch (err) {
      console.error("Failed to start visit:", err);
    }
  };

  const handleCompleteVisit = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!note) {
      setValidationError(
        "Field report cannot be empty. Please enter completion notes.",
      );
      return;
    }

    const taskName = activeVisit.task_title || `Task #${activeVisit.task}`;

    try {
      const res = await api.patch(`/api/visits/update/${activeVisit.id}/`, {
        visit_notes: note,
        status: "COMPLETED",
        completed_at: new Date().toISOString(),
      });

      await api.post("/api/logs/", {
        action: `Agent completed field report for: ${taskName}`,
      });

      localStorage.removeItem("active_visit_id");

      setVisits((prevVisits) =>
        prevVisits.map((v) =>
          v.id === activeVisit.id
            ? { ...res.data, agent: currentUserId, status: "COMPLETED" }
            : v,
        ),
      );
      setNote("");
    } catch (err) {
      console.error("Failed to complete visit:", err);
    }
  };

  const renderVisitTime = (start, end, fallback) => {
    if (!start || !end) {
      return {
        main: "Duration Unknown",
        sub: new Date(fallback || new Date()).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
    }
    const startDate = new Date(start);
    const endDate = new Date(end);
    const isSameDay = startDate.toDateString() === endDate.toDateString();

    if (isSameDay) {
      return {
        main: `${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        sub: startDate.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
    } else {
      const diffTime = Math.abs(endDate - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        main: `${startDate.toLocaleDateString([], { month: "short", day: "numeric" })}, ${startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — ${endDate.toLocaleDateString([], { month: "short", day: "numeric" })}, ${endDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        sub: `Multi-Day Operation (${diffDays} Days)`,
      };
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Field Reports
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {currentUserRole === "FIELD_AGENT"
            ? "Manage your active site visits and log reports."
            : "Live feed of all agent deployments and site visits."}
        </p>
      </div>

      {currentUserRole === "FIELD_AGENT" && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
          {validationError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-center space-x-3 animate-pulse">
              <div className="bg-red-500 rounded-full p-1">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-red-400 text-xs font-semibold">
                {validationError}
              </p>
            </div>
          )}

          {activeVisit ? (
            <ActiveVisitForm
              activeVisit={activeVisit}
              note={note}
              setNote={setNote}
              onCompleteVisit={handleCompleteVisit}
            />
          ) : (
            <StartVisitForm
              tasks={tasks}
              selectedTaskId={selectedTaskId}
              setSelectedTaskId={setSelectedTaskId}
              onStartVisit={handleStartVisit}
            />
          )}
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">
          Completed Field Activity
        </h2>
        {visits.filter((v) => v.status === "COMPLETED").length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-500">
              No completed visits in the system yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visits
              .filter((v) => v.status === "COMPLETED")
              .map((v) => {
                const timeDisplay = renderVisitTime(
                  v.started_at,
                  v.completed_at,
                  v.created_at,
                );
                return (
                  <div
                    key={v.id}
                    className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4"
                  >
                    <div className="flex-1 w-full">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-500/10 text-emerald-400">
                          {v.task_title || `Task #${v.task}`}
                        </span>
                        <span className="text-sm font-medium text-slate-300">
                          Agent: {v.agent_name || v.agent}
                        </span>
                      </div>

                      <div className="mb-3">
                        <ExpandableText
                          text={v.visit_notes}
                          maxLength={200}
                          textClass="text-white text-base leading-relaxed whitespace-pre-wrap"
                          buttonClass="text-indigo-400 hover:text-indigo-300 text-sm font-medium mt-1 transition-colors"
                        />
                      </div>

                      {v.ai_summary && (
                        <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-lg mb-2 inline-block w-full sm:max-w-2xl">
                          <p className="text-indigo-300 text-xs font-semibold tracking-wide mb-2 uppercase">
                            🤖 AI Analysis
                          </p>
                          <ExpandableText
                            text={v.ai_summary}
                            maxLength={180}
                            textClass="text-slate-300 text-sm leading-snug whitespace-pre-wrap"
                            buttonClass="text-indigo-400 hover:text-indigo-300 text-xs font-bold mt-2 transition-colors"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 sm:text-right w-full sm:w-auto mt-2 sm:mt-0">
                      <p className="text-slate-400 text-xs font-medium bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 inline-block sm:block">
                        {timeDisplay.main}
                      </p>
                      <p
                        className={`text-[10px] mt-1.5 uppercase tracking-wider font-semibold ${timeDisplay.sub.includes("Multi-Day") ? "text-amber-500" : "text-slate-500"}`}
                      >
                        {timeDisplay.sub}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
