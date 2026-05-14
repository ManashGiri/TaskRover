import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../scripts/api";
import { ACCESS_TOKEN } from "../scripts/constants"; 

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) {
          navigate("/login");
          return;
        }

        const userId = String(jwtDecode(token).user_id);
        const userRes = await api.get("/api/users/");
        const allUsers = userRes.data.results || userRes.data;
        const me = allUsers.find((u) => String(u.id) === userId);

        // SECURITY CHECK: Kick out unauthorized users
        if (!me || !["ADMIN", "AUDITOR"].includes(me.role)) {
          navigate("/");
          return;
        }

        const logRes = await api.get("/api/logs/");
        const logData = logRes.data.results || logRes.data;

        // Filter out basic login/logout noise for a cleaner audit trail
        const businessLogs = logData.filter(
          (log) => !/log(ged)?[\s_]*(in|out)/i.test(log.action),
        );

        setLogs(businessLogs.reverse());
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [navigate]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );

  return (
    <div className="space-y-6 pb-10 max-w-5xl mx-auto pt-8 px-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          System Audit Trail
        </h1>
        <button
          onClick={() => navigate("/")}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          &larr; Back to Dashboard
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {logs.length === 0 ? (
          <div className="p-8 text-slate-500 text-center">No logs found.</div>
        ) : (
          <div className="divide-y divide-slate-800">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center hover:bg-slate-800/50 transition-colors"
              >
                <div className="mb-2 sm:mb-0">
                  <span className="inline-block px-2 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded uppercase tracking-wider mr-3">
                    {log.user_name}
                  </span>
                  <span className="text-slate-300 text-sm">{log.action}</span>
                </div>
                <span className="text-slate-500 text-xs font-mono whitespace-nowrap">
                  {new Date(
                    log.created_at || log.timestamp || new Date(),
                  ).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
