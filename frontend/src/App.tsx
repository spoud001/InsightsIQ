import AuthForm from './AuthForm';
import ProtectedRoute from './ProtectedRoute';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';
import DatasetPanel from './DatasetPanel';
import BarLineInsightPanel from './BarLineInsightPanel';
import DashboardPanel from './DashboardPanel';
import MLInsightPanel from './MLInsightPanel';

const navItems = [
  { label: 'Datasets', path: '/datasets' },
  { label: 'Insights', path: '/insights' },
  { label: 'Advanced Analytics', path: '/advanced' },
];

function Navbar() {
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/auth';
  };
  return (
    <nav className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur shadow-lg flex items-center justify-between px-4 py-3 md:px-10 transition-all duration-300">
      <div className="flex items-center gap-3">
        <span className="text-2xl md:text-3xl font-extrabold text-purple-700 tracking-tight select-none flex items-center gap-2">
          {/* Project logo image - replace src with your logo file */}
          <img
            src="/logo.png" // <-- Put your logo image in public/logo.png or update the path
            alt="InsightIQ Logo"
            className="w-10 h-10 md:w-12 md:h-12 object-contain"
          />
          InsightIQ
        </span>
      </div>
      <div className="flex gap-2 md:gap-6 items-center">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${location.pathname === item.path ? 'bg-purple-200 text-purple-800 shadow' : 'hover:bg-purple-100 text-gray-700'}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
      {/* Profile dropdown with logout */}
      <div className="ml-2 md:ml-4 relative">
        <button
          className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center font-bold text-lg text-white focus:outline-none"
          onClick={() => setDropdownOpen(v => !v)}
          title="User menu"
        >
          U
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg py-2 z-50 animate-fade-in-up">
            <button className="w-full text-left px-4 py-2 hover:bg-purple-50 text-gray-700" onClick={handleLogout}>Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
}

function DatasetsPage() {
  return (
    <div className="flex flex-col items-center w-full min-h-[80vh] p-4">
      {/* Remove max-w-3xl to allow DatasetPanel to use full width for wide layout */}
      <div className="w-full">
        <DatasetPanel />
      </div>
    </div>
  );
}

function InsightsPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selected, setSelected] = useState<number|null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    axios.get('http://localhost:8000/data/datasets', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setDatasets(res.data))
      .catch(() => setDatasets([]));
  }, [token]);

  // Fetch columns when dataset is selected
  useEffect(() => {
    if (!selected) return;
    axios.get(`http://localhost:8000/data/datasets/${selected}/preview?rows=1`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setColumns(res.data.columns || []))
      .catch(() => setColumns([]));
  }, [selected, token]);

  return (
    <div className="flex flex-col items-center w-full min-h-[80vh] p-4">
      <div className="w-full max-w-3xl mb-4">
        <label className="block mb-1 font-semibold text-purple-700">Select Dataset</label>
        <select
          className="w-full p-2 border rounded mb-4"
          value={selected || ''}
          onChange={e => setSelected(Number(e.target.value))}
        >
          <option value="">-- Choose a dataset --</option>
          {datasets.map(ds => (
            <option key={ds.id} value={ds.id}>{ds.name}</option>
          ))}
        </select>
      </div>
      {selected && columns.length > 0 && (
        <div className="w-full max-w-3xl">
          <BarLineInsightPanel datasetId={selected} columns={columns} />
        </div>
      )}
    </div>
  );
}

function AdvancedAnalyticsPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selected, setSelected] = useState<number|null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    axios.get('http://localhost:8000/data/datasets', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setDatasets(res.data))
      .catch(() => setDatasets([]));
  }, [token]);

  // Fetch columns when dataset is selected
  useEffect(() => {
    if (!selected) return;
    axios.get(`http://localhost:8000/data/datasets/${selected}/preview?rows=1`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setColumns(res.data.columns || []))
      .catch(() => setColumns([]));
  }, [selected, token]);

  return (
    <div className="flex flex-col items-center w-full min-h-[80vh] p-4">
      <div className="w-full max-w-3xl mb-4">
        <label className="block mb-1 font-semibold text-purple-700">Select Dataset</label>
        <select
          className="w-full p-2 border rounded mb-4"
          value={selected || ''}
          onChange={e => setSelected(Number(e.target.value))}
        >
          <option value="">-- Choose a dataset --</option>
          {datasets.map(ds => (
            <option key={ds.id} value={ds.id}>{ds.name}</option>
          ))}
        </select>
      </div>
      {selected && columns.length > 0 && (
        <div className="w-full max-w-3xl">
          <MLInsightPanel datasetId={selected} columns={columns} />
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-50 via-blue-50 to-blue-200 flex flex-col">
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/auth" element={<AuthForm />} />
          <Route path="/datasets" element={<ProtectedRoute><DatasetsPage /></ProtectedRoute>} />
          <Route path="/insights" element={<ProtectedRoute><InsightsPage /></ProtectedRoute>} />
          <Route path="/advanced" element={<ProtectedRoute><AdvancedAnalyticsPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/datasets" />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
