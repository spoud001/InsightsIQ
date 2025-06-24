import React from "react";

interface InsightCardProps {
  chart: string; // base64 PNG
  summary: string;
  modelInfo?: any;
  onDelete?: () => void;
  onExport?: () => void;
}

const InsightCard: React.FC<Omit<InsightCardProps, 'summary'> & { summary?: string }> = ({ chart, summary, modelInfo, onDelete, onExport }) => (
  <div className="bg-white rounded shadow p-4 flex flex-col">
    <img src={`data:image/png;base64,${chart}`} alt="chart" className="rounded mb-2" />
    {/* Remove summary display for advanced ML insights */}
    {modelInfo && (
      <div className="text-xs bg-gray-100 p-2 rounded mb-2">
        <pre>{JSON.stringify(modelInfo, null, 2)}</pre>
      </div>
    )}
    <div className="flex gap-2 mt-auto">
      {onExport && (
        <button onClick={onExport} className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">Export</button>
      )}
      {onDelete && (
        <button onClick={onDelete} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
      )}
    </div>
  </div>
);

export default InsightCard;
