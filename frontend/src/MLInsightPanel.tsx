import React, { useState, useEffect } from "react";
import axios from "axios";
import ChartRegistryPanel from "./ChartRegistryPanel";

const API_URL = import.meta.env.VITE_API_URL || "";

interface Props {
  datasetId: number;
  columns: string[];
}

const MLInsightPanel: React.FC<Props> = ({ datasetId, columns }) => {
  const [x, setX] = useState("");
  const [y, setY] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [dateColumn, setDateColumn] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [previewRows, setPreviewRows] = useState<any[][]>([]);

  // Fetch preview rows for year extraction
  useEffect(() => {
    if (!datasetId) return;
    setYears([]);
    setSelectedYear(null);
    setPreviewRows([]);
    const token = localStorage.getItem('token');
    axios.get(`${API_URL}/datasets/${datasetId}/preview?rows=100`, { headers: { Authorization: `Bearer ${token}` } })
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
    console.log('Date column values:', colValues);
    const yearsSet = new Set<number>();
    colValues.forEach(v => {
      if (!v) return;
      // If value is a 4-digit year, use it directly
      if (/^\d{4}$/.test(String(v))) {
        yearsSet.add(Number(v));
        console.log('Year value (direct):', v);
      } else {
        const d = new Date(v);
        console.log('Parsing value:', v, '->', d, 'year:', d.getFullYear());
        if (!isNaN(d.getTime())) yearsSet.add(d.getFullYear());
      }
    });
    const yearsArr = Array.from(yearsSet).sort();
    setYears(yearsArr);
    setSelectedYear(yearsArr[0] || null);
  }, [dateColumn, previewRows, columns]);

  const handleChartSelect = async (chart: any, params: Record<string, any>) => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const token = localStorage.getItem('token');
      let res;
      if (chart.type === 'bar' || chart.type === 'line') {
        res = await axios.post(`${API_URL}/datasets/${datasetId}/insights`, {
          chart_type: chart.type,
          x,
          y,
          params,
          ...(dateColumn && selectedYear ? { year: selectedYear, date_column: dateColumn } : {})
        }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      } else {
        res = await axios.post(`${API_URL}/datasets/${datasetId}/ml_insight`, {
          type: chart.type,
          x,
          y,
          params,
          ...(dateColumn && selectedYear ? { year: selectedYear, date_column: dateColumn } : {})
        }, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
      }
      setResult(res.data);
    } catch (e: any) {
      setError(e.response?.data?.detail || "Error generating insight");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded shadow">
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
      <ChartRegistryPanel onSelect={handleChartSelect} columns={columns} />
      {loading && <div className="mt-4 text-blue-600">Generating insight...</div>}
      {error && <div className="mt-4 text-red-600">{error}</div>}
      {result && (
        <div className="mt-4 flex flex-col items-center">
          <img src={`data:image/png;base64,${result.chart}`} alt="chart" className="rounded shadow mb-2" />
          <button
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            onClick={() => {
              const link = document.createElement('a');
              link.href = `data:image/png;base64,${result.chart}`;
              link.download = 'advanced_insight.png';
              link.click();
            }}
          >
            Export Chart
          </button>
        </div>
      )}
    </div>
  );
};

export default MLInsightPanel;
