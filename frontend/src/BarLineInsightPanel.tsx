import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "";

interface BarLineInsightPanelProps {
  datasetId: number;
  columns: string[];
}

const BarLineInsightPanel: React.FC<BarLineInsightPanelProps> = ({ datasetId, columns }) => {
  const [x, setX] = useState('');
  const [y, setY] = useState('');
  const [type, setType] = useState<'bar' | 'line'>('bar');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [insight, setInsight] = useState<any | null>(null);
  const [dateColumn, setDateColumn] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [previewRows, setPreviewRows] = useState<any[][]>([]);
  const token = localStorage.getItem('token');

  // Fetch preview rows for year extraction
  useEffect(() => {
    if (!datasetId) return;
    setYears([]);
    setSelectedYear(null);
    setPreviewRows([]);
    const token = localStorage.getItem('token');
    axios.get(`http://localhost:8000/data/datasets/${datasetId}/preview?rows=100`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setPreviewRows(res.data.rows || []);
      });
  }, [datasetId]);

  // When user selects a date column, extract years
  useEffect(() => {
    if (!dateColumn || previewRows.length === 0) {
      setYears([]);
      setSelectedYear(null);
      return;
    }
    const colIdx = columns.indexOf(dateColumn);
    if (colIdx === -1) return;
    const colValues = previewRows.map(row => row[colIdx]);
    const yearsSet = new Set<number>();
    colValues.forEach(v => {
      if (!v) return;
      // If value is a 4-digit year, use it directly
      if (/^\d{4}$/.test(String(v))) {
        yearsSet.add(Number(v));
      } else {
        const d = new Date(v);
        if (!isNaN(d.getTime())) yearsSet.add(d.getFullYear());
      }
    });
    const yearsArr = Array.from(yearsSet).sort();
    setYears(yearsArr);
    setSelectedYear(yearsArr[0] || null);
  }, [dateColumn, previewRows, columns]);

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    const payload = {
      chart_type: type,
      x,
      y,
      ...(dateColumn && selectedYear ? { year: selectedYear, date_column: dateColumn } : {})
    };
    try {
      const res = await axios.post(
        `${API_URL}/datasets/${datasetId}/insights`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInsight(res.data);
    } catch (e: any) {
      let msg = 'Error generating insight';
      if (e.response?.data?.detail) {
        if (typeof e.response.data.detail === 'string') msg = e.response.data.detail;
        else if (Array.isArray(e.response.data.detail)) msg = e.response.data.detail.map((d: any) => d.msg).join('; ');
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!insight) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${insight.chart}`;
    link.download = `insight.png`;
    link.click();
  };

  return (
    <div className="p-4 bg-white rounded shadow max-w-lg mx-auto">
      <div className="mb-4 flex gap-2">
        <label className="font-bold">Type:</label>
        <select className="p-2 border rounded" value={type} onChange={e => setType(e.target.value as 'bar' | 'line')}>
          <option value="bar">Bar Chart</option>
          <option value="line">Line Chart</option>
        </select>
      </div>
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
      <div className="mb-4">
        <label className="block font-bold mb-1">Date Column (optional)</label>
        <select
          className="p-2 border rounded w-full"
          value={dateColumn || ''}
          onChange={e => setDateColumn(e.target.value || null)}
        >
          <option value="">-- None --</option>
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      </div>
      {dateColumn && years.length > 0 && (
        <div className="mb-4">
          <label className="block font-bold mb-1">Year Filter ({dateColumn}):</label>
          <input
            type="range"
            min={Math.min(...years)}
            max={Math.max(...years)}
            value={selectedYear || years[0]}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="w-full"
            step={1}
            list="year-ticks"
          />
          <datalist id="year-ticks">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </datalist>
          <div className="text-sm text-gray-700 mt-1">Year: <span className="font-bold">{selectedYear}</span></div>
        </div>
      )}
      <button
        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
        onClick={handleGenerate}
        disabled={!x || !y || loading}
      >
        {loading ? 'Generating...' : 'Generate Insight'}
      </button>
      {error && <div className="mt-4 text-red-600">{error}</div>}
      {insight && (
        <div className="mt-6 flex flex-col items-center">
          <img src={`data:image/png;base64,${insight.chart}`} alt="Insight Chart" className="rounded shadow max-w-full" />
          <div className="mt-2 text-gray-700 text-sm whitespace-pre-line">{insight.summary}</div>
          <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition" onClick={handleExport}>
            Export Chart
          </button>
        </div>
      )}
    </div>
  );
};

export default BarLineInsightPanel;
