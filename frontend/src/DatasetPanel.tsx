import { useState, useEffect } from 'react';
import axios from 'axios';

import ChatSidebar from './ChatSidebar';

const API_URL = 'http://localhost:8000/data';

interface DatasetPanelProps {
  onSelectDataset?: (id: number, columns: string[]) => void;
}

export default function DatasetPanel({ onSelectDataset }: DatasetPanelProps) {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selected, setSelected] = useState<number|null>(null);
  const [preview, setPreview] = useState<{columns: string[], rows: any[][]}|null>(null);
  const [showInsight, setShowInsight] = useState(false);
  const [rows, setRows] = useState(10);
  const [file, setFile] = useState<File|null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [datasetName, setDatasetName] = useState('');
  const [expanded, setExpanded] = useState<number|null>(null);
  const [summary, setSummary] = useState<any|null>(null);
  const [activeTab, setActiveTab] = useState<'preview'|'summary'>('preview');
  const [qaPrepared, setQaPrepared] = useState<{[id:number]: boolean}>({});
  const [showChat, setShowChat] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_URL}/datasets`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setDatasets(res.data))
      .catch(() => setDatasets([]));
  }, [token]);

  // Fetch summary when expanded and summary tab is selected
  useEffect(() => {
    if (expanded == null || activeTab !== 'summary') return;
    setSummary(null);
    axios.get(`${API_URL}/datasets/${expanded}/summary`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setSummary(res.data))
      .catch(() => setSummary(null));
  }, [expanded, token, activeTab]);

  const fetchPreview = (id: number, n: number) => {
    setPreview(null);
    axios.get(`${API_URL}/datasets/${id}/preview?rows=${n}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setPreview(res.data);
        if (onSelectDataset) {
          onSelectDataset(id, res.data.columns);
        }
      })
      .catch(() => setPreview(null));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    // Use user-provided name or fallback to file name
    formData.append('name', datasetName.trim() ? datasetName : file.name);
    try {
      await axios.post(`${API_URL}/upload`, formData, { headers: { Authorization: `Bearer ${token}` } });
      window.location.reload();
    } catch (err: any) {
      setError(err.response?.data?.detail || (err.message || 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  // Deep Q&A preparation handler
  const handlePrepareQA = async (id: number) => {
    try {
      await axios.post(`${API_URL}/datasets/${id}/deepqa_prepare`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setQaPrepared(prev => ({ ...prev, [id]: true }));
    } catch (err: any) {
      setQaPrepared(prev => ({ ...prev, [id]: false }));
      throw err;
    }
  };

  // --- Layout: dataset list + chat sidebar ---
  return (
    <div className="flex w-full max-w-[1600px] mx-auto mt-8 animate-fade-in">
      {/* Main dataset list and preview/summary */}
      <div className="min-w-[700px] max-w-[1100px] w-[60%] bg-white rounded-xl shadow p-6 mr-8">
        <h2 className="text-xl font-bold mb-4 text-purple-700">Your Datasets</h2>
        <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-2 mb-6 items-center">
          <label className="relative cursor-pointer bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded shadow hover:from-purple-600 hover:to-blue-600 transition flex items-center">
            <input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" required />
            <span className="font-semibold">Choose File</span>
          </label>
          <input
            type="text"
            placeholder="Dataset name (optional)"
            value={datasetName}
            onChange={e => setDatasetName(e.target.value)}
            className="flex-1 px-2 py-1 border rounded"
          />
          <button type="submit" className="bg-purple-500 text-white px-4 py-2 rounded shadow hover:bg-purple-600 transition" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload CSV'}</button>
        </form>
        {file && <div className="mb-2 text-sm text-gray-700">Selected: <span className="font-semibold">{file.name}</span></div>}
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <ul className="mb-4 grid grid-cols-1 gap-3">
          {datasets.map(ds => (
            <li key={ds.id} className={`flex flex-col p-3 rounded-2xl shadow border ${expanded===ds.id?'bg-purple-50 border-purple-300':'bg-gray-50 border-gray-200'} transition-all duration-200`}> 
              <div className="flex items-center justify-between">
                <button className={`text-lg font-semibold text-purple-700 hover:underline text-left ${expanded===ds.id?'':'opacity-80'}`} onClick={() => {
                  setExpanded(expanded===ds.id ? null : ds.id);
                  setActiveTab('preview');
                  if (expanded!==ds.id) fetchPreview(ds.id, rows);
                  setShowChat(expanded!==ds.id); // Show chat when dataset is selected
                }}>
                  {ds.name}
                </button>
                <button onClick={async () => {
                  if(window.confirm('Delete this dataset?')) {
                    try {
                      await axios.delete(`${API_URL}/datasets/${ds.id}`, { headers: { Authorization: `Bearer ${token}` } });
                      setDatasets(datasets.filter(d => d.id !== ds.id));
                      setPreview(null);
                      setExpanded(null);
                      setShowChat(false);
                    } catch (err: any) {
                      setError(err.response?.data?.detail || 'Delete failed');
                    }
                  }
                }} className="ml-2 px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition">Delete</button>
              </div>
              <span className="text-xs text-gray-400">Uploaded: {new Date(ds.uploaded_at + 'Z').toLocaleString()}</span>
              {expanded===ds.id && (
                <>
                  <div className="flex gap-2 mt-4 mb-2">
                    <button
                      className={`px-4 py-1 rounded-t-lg font-semibold transition-all duration-200 ${activeTab==='preview' ? 'bg-purple-600 text-white shadow' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                      onClick={() => { setActiveTab('preview'); fetchPreview(ds.id, rows); }}
                    >Preview</button>
                    <button
                      className={`px-4 py-1 rounded-t-lg font-semibold transition-all duration-200 ${activeTab==='summary' ? 'bg-purple-600 text-white shadow' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                      onClick={() => setActiveTab('summary')}
                    >Summary</button>
                  </div>
                  <div className="bg-white rounded-b-xl shadow-inner p-4 border-t">
                    {activeTab==='preview' && preview && (
                      <>
                        <div className="mb-4 flex items-center gap-2">
                          <label className="block mb-0 text-sm font-medium">Rows to preview:</label>
                          <input type="number" min={1} max={100} value={rows} onChange={e => { setRows(Number(e.target.value)); fetchPreview(ds.id, Number(e.target.value)); }} className="border px-2 py-1 rounded w-20" />
                        </div>
                        <div className="overflow-x-auto rounded-lg border">
                          <table className="min-w-full text-xs">
                            <thead>
                              <tr>
                                {preview.columns.map(col => <th key={col} className="border px-2 py-1 bg-purple-100 text-purple-700 font-bold">{col}</th>)}
                              </tr>
                            </thead>
                            <tbody>
                              {preview.rows.map((row, i) => (
                                <tr key={i} className="even:bg-purple-50">
                                  {row.map((cell, j) => <td key={j} className="border px-2 py-1">{cell}</td>)}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                    {activeTab==='summary' && (
                      <div className="overflow-x-auto">
                        {summary ? (
                          <table className="min-w-full text-xs rounded-lg border">
                            <thead>
                              <tr>
                                <th className="border px-2 py-1 bg-purple-100 text-purple-700 font-bold">Column</th>
                                <th className="border px-2 py-1 bg-purple-100 text-purple-700 font-bold">Stats</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(summary).map(([col, stats]: any) => (
                                <tr key={col} className="even:bg-purple-50">
                                  <td className="border px-2 py-1 font-semibold">{col}</td>
                                  <td className="border px-2 py-1 whitespace-pre-line">
                                    {Object.entries(stats).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : <div className="text-gray-500">Loading summary...</div>}
                      </div>
                    )}
                  </div>
                  {/* ChatSidebar removed from here */}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
      {/* Chat Sidebar - only show when a dataset is selected */}
      {showChat && expanded && (
        <div className="w-[480px] flex-shrink-0">
          <ChatSidebar
            datasetId={expanded}
            isPrepared={!!qaPrepared[expanded]}
            onPrepare={() => handlePrepareQA(expanded)}
          />
        </div>
      )}
    </div>
  );
}
