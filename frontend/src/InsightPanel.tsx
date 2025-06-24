import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function InsightPanel({ datasetId, columns }: { datasetId: number, columns: string[] }) {
  const [x, setX] = useState('');
  const [y, setY] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [chart, setChart] = useState<string|null>(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setChart(null);
    setSummary('');
    try {
      const res = await axios.post(`${API_URL}/datasets/${datasetId}/insights`, { x, y, chart_type: chartType }, { headers: { Authorization: `Bearer ${token}` } });
      setChart('data:image/png;base64,' + res.data.chart);
      setSummary(res.data.summary);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create insight');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold mb-2">Generate Insight</h3>
      <form onSubmit={handleCreate} className="flex gap-2 mb-4 flex-wrap">
        <select value={x} onChange={e => setX(e.target.value)} className="border rounded px-2 py-1" required>
          <option value="">X axis</option>
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        <select value={y} onChange={e => setY(e.target.value)} className="border rounded px-2 py-1" required>
          <option value="">Y axis</option>
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
        <select value={chartType} onChange={e => setChartType(e.target.value)} className="border rounded px-2 py-1">
          <option value="bar">Bar</option>
          <option value="line">Line</option>
        </select>
        <button type="submit" className="bg-blue-500 text-white px-4 py-1 rounded" disabled={loading}>{loading ? 'Generating...' : 'Generate'}</button>
      </form>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {chart && <img src={chart} alt="chart" className="mb-2 border rounded shadow" style={{maxWidth:400}} />}
      {summary && <div className="mb-2 text-green-700 font-semibold">{summary}</div>}
    </div>
  );
}
