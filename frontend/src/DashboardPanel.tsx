import React, { useState, useEffect } from "react";
import InsightCard from "./InsightCard";
import MLInsightPanel from './MLInsightPanel';
import ChartRegistryPanel from "./ChartRegistryPanel";
import axios from "axios";

const API_URL = "http://localhost:8000/data";

const AdvancedAnalyticsPanel: React.FC<{ datasetId: number; columns: string[]; onAdd: (insight: any) => void }> = ({ datasetId, columns, onAdd }) => {
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = localStorage.getItem('token');

  const handleChartSelect = async (chart: any, params: Record<string, any>) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(
        `${API_URL}/datasets/${datasetId}/ml_insight`,
        {
          type: chart.type,
          x,
          y,
          params
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onAdd(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Error generating insight");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow max-w-lg mx-auto">
      <div className="mb-4">
        <label className="block font-bold mb-1">X Column</label>
        <select className="p-2 border rounded w-full" value={x} onChange={e => setX(e.target.value)} required>
          <option value="">Select...</option>
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <div className="mb-4">
        <label className="block font-bold mb-1">Y Column</label>
        <select className="p-2 border rounded w-full" value={y} onChange={e => setY(e.target.value)} required>
          <option value="">Select...</option>
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      <ChartRegistryPanel onSelect={handleChartSelect} columns={columns} />
      {loading && <div className="mt-4 text-blue-600">Generating insight...</div>}
      {error && <div className="mt-4 text-red-600">{error}</div>}
    </div>
  );
};

interface DashboardPanelProps {
  selectedDatasetId: number | null;
  columns: string[];
}

const DashboardPanel: React.FC<DashboardPanelProps> = ({ selectedDatasetId, columns }) => {
  const [insight, setInsight] = useState<any | null>(null); // Only one saved insight at a time
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pendingInsight, setPendingInsight] = useState<any | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleAddInsight = (insight: any) => {
    setPendingInsight(insight);
    setShowAdvanced(false);
  };

  const handleSave = () => {
    if (pendingInsight) {
      setInsight(pendingInsight);
      setPendingInsight(null);
      setShowPreview(false);
    }
  };

  const handleDeletePending = () => {
    setPendingInsight(null);
  };

  const handleDelete = () => {
    setInsight(null);
    setShowPreview(false);
  };

  const handleExport = () => {
    if (!insight) return;
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${insight.chart}`;
    link.download = `insight.png`;
    link.click();
  };

  // Animated modal classes
  const modalBg = "fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 transition-opacity duration-300";
  const modalCard = "bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100";

  return (
    <div className="w-full">
      {/* Always show MLInsightPanel for normal insights if dataset is selected */}
      {selectedDatasetId && columns.length > 0 && !pendingInsight && !showAdvanced && (
        <div className="mb-8 animate-fade-in-up">
          <MLInsightPanel datasetId={selectedDatasetId} columns={columns} />
        </div>
      )}
      {/* ADVANCED ANALYTICS MODAL */}
      {showAdvanced && selectedDatasetId && (
        <div className={modalBg}>
          <div className={modalCard + " animate-modal-in"}>
            <AdvancedAnalyticsPanel datasetId={selectedDatasetId} columns={columns} onAdd={handleAddInsight} />
            <button className="mt-4 px-4 py-2 bg-gray-300 rounded-lg shadow hover:bg-gray-400 transition" onClick={() => setShowAdvanced(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* PENDING INSIGHT MODAL */}
      {pendingInsight && (
        <div className={modalBg}>
          <div className={modalCard + " animate-modal-in"}>
            <InsightCard
              chart={pendingInsight.chart}
              summary={pendingInsight.summary}
              modelInfo={pendingInsight.model_info}
            />
            <div className="flex gap-2 mt-4">
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition" onClick={handleSave}>Save</button>
              <button className="px-4 py-2 bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition" onClick={handleDeletePending}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {/* INSIGHT PREVIEW MODAL */}
      {insight && showPreview && (
        <div className={modalBg}>
          <div className={modalCard + " animate-modal-in"}>
            <InsightCard
              chart={insight.chart}
              summary={insight.summary}
              modelInfo={insight.model_info}
              onDelete={handleDelete}
              onExport={handleExport}
            />
          </div>
        </div>
      )}
      {/* ANIMATION KEYFRAMES */}
      <style>{`
        .animate-fade-in-down { animation: fadeInDown 0.6s cubic-bezier(.4,0,.2,1) both; }
        .animate-fade-in-up { animation: fadeInUp 0.7s cubic-bezier(.4,0,.2,1) both; }
        .animate-modal-in { animation: modalIn 0.4s cubic-bezier(.4,0,.2,1) both; }
        @keyframes fadeInDown { from { opacity:0; transform:translateY(-30px);} to { opacity:1; transform:translateY(0);} }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(30px);} to { opacity:1; transform:translateY(0);} }
        @keyframes modalIn { from { opacity:0; transform:scale(0.95);} to { opacity:1; transform:scale(1);} }
      `}</style>
    </div>
  );
};

export default DashboardPanel;
