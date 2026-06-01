import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle, CheckCircle, Activity, RefreshCw } from "lucide-react";

const API_BASE = "http://localhost:5000/api"; // Adjust to your Flask server port

export default function Dashboard() {
  const [systemName, setSystemName] = useState("ticketing_system");
  const [latestDrift, setLatestDrift] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(flase);
    setError(null);
    try {
      // Fetch latest drift status and historical trends in parallel
      const [latestRes, trendRes] = await Promise.all([
        fetch(`${API_BASE}/systems/${systemName}/drift/latest`),
        fetch(`${API_BASE}/systems/${systemName}/drift/trend`),
      ]);

      if (!latestRes.ok || !trendRes.ok) {
        console.log("-----------error-------");
        console.log(latestRes);
        console.log(trendRes);
        throw new Error("Failed to fetch data from Flask API");
      }

      const latestData = await latestRes.json();
      const rawTrendData = await trendRes.json();

      setLatestDrift(latestData);
      setTrendData(processTrendData(rawTrendData));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [systemName]);

  // Transform raw SQL rows [ {runtime, Status, Count}, ... ] into Recharts-friendly schema
  const processTrendData = (data) => {
    const timeMap = {};
    console.log("=======data========");
    console.log(data);
    data["data"].forEach((row) => {
      if (!timeMap[row.runtime]) {
        timeMap[row.runtime] = {
          runtime: row.runtime,
          DRIFTED: 0,
          COMPLIANT: 0,
        };
      }
      timeMap[row.runtime][row.Status] = row.Count;
    });
    return Object.values(timeMap).sort(
      (a, b) => new Date(a.runtime) - new Date(b.runtime),
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-slate-100">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-lg font-medium">
          Analyzing architecture states...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-red-400 p-4">
        <div className="bg-red-950/50 border border-red-800 rounded-lg p-6 max-w-md text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">API Connection Error</h3>
          <p className="text-sm text-slate-300">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded text-sm transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 md:p-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs rounded font-mono font-bold tracking-wider">
              PROJECT MANATEE
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">
            Architecture Drift Detection
          </h1>
        </div>

        {/* System Selector */}
        <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            System:
          </label>
          <select
            value={systemName}
            onChange={(e) => setSystemName(e.target.value)}
            className="bg-transparent font-medium text-sm text-slate-100 focus:outline-none cursor-pointer"
          >
            <option value="ticketing_system" className="bg-slate-800">
              ticketing_system
            </option>
            <option value="payment_gateway" className="bg-slate-800">
              payment_gateway
            </option>
          </select>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 font-medium">
              Active Anomalies
            </p>
            <h3 className="text-3xl font-bold mt-1 text-amber-500">
              {latestDrift.length}
            </h3>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-lg text-amber-500 border border-amber-500/10">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 font-medium">
              System Compliance Status
            </p>
            <h3
              className={`text-3xl font-bold mt-1 ${latestDrift.length === 0 ? "text-emerald-500" : "text-amber-500"}`}
            >
              {latestDrift.length === 0 ? "COMPLIANT" : "DEGRADED"}
            </h3>
          </div>
          <div
            className={`p-3 rounded-lg border ${latestDrift.length === 0 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/10" : "bg-amber-500/10 text-amber-500 border-amber-500/10"}`}
          >
            {latestDrift.length === 0 ? (
              <CheckCircle className="h-6 w-6" />
            ) : (
              <Activity className="h-6 w-6" />
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 font-medium">
              Total Historical Runs
            </p>
            <h3 className="text-3xl font-bold mt-1 text-blue-500">
              {trendData.length}
            </h3>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500 border border-blue-500/10">
            <Activity className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Historical Timeline Chart */}
        <div className="lg:col-span-2 bg-slate-800/30 border border-slate-800/80 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-1">
            Architecture Drift Timeline
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            Component tracking aggregated across sequential validation runtimes
          </p>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="runtime"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(tick) => tick.split(" ")[1] || tick} // Shows HH:MM:SS to save visual room
                />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    color: "#f8fafc",
                  }}
                  labelStyle={{ color: "#94a3b8", fontSize: "12px" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "13px", paddingTop: "10px" }}
                />
                <Line
                  type="monotone"
                  dataKey="DRIFTED"
                  name="Drifted Components"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="COMPLIANT"
                  name="Compliant Components"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Current Drift Violations */}
        <div className="bg-slate-800/30 border border-slate-800/80 rounded-xl p-6 flex flex-col">
          <h2 className="text-lg font-bold mb-1">Active Drift Reports</h2>
          <p className="text-xs text-slate-400 mb-4">
            Immediate ADR violations requiring engineering resolution
          </p>

          <div className="overflow-y-auto max-h-80 flex-1 space-y-3 pr-1">
            {latestDrift.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full border border-dashed border-slate-800 rounded-xl p-8 text-center text-slate-500">
                <CheckCircle className="h-10 w-12 text-emerald-500/40 mb-2" />
                <p className="text-sm font-medium text-slate-400">
                  System behaves perfectly
                </p>
                <p className="text-xs mt-0.5">
                  All local docker-compose definitions line up explicitly with
                  defined ADRs.
                </p>
              </div>
            ) : (
              latestDrift.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/60 border border-amber-500/20 rounded-lg p-4 transition-all hover:border-amber-500/40"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono rounded font-semibold">
                      {item.Component}
                    </span>
                    <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/10 font-mono">
                      {item.Requirement_ID}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed font-sans">
                    {item.Issue_Description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
