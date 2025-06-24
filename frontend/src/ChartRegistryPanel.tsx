import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";

interface ChartParam {
  name: string;
  type: string;
  default: any;
  description: string;
}

interface ChartType {
  type: string;
  label: string;
  params: ChartParam[];
  description: string;
}

interface Props {
  onSelect: (chart: ChartType, params: Record<string, any>) => void;
}

const ChartRegistryPanel: React.FC<Props & { columns: string[] }> = ({ onSelect, columns }) => {
  const [charts, setCharts] = useState<ChartType[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [paramValues, setParamValues] = useState<Record<string, any>>({});

  useEffect(() => {
    axios.get(`${API_URL}/charts/available`)
      .then(res => Array.isArray(res.data) ? setCharts(res.data) : setCharts([]))
      .catch(() => setCharts([]));
  }, []);

  const handleChartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelected(e.target.value);
    const chart = charts.find(c => c.type === e.target.value);
    if (chart) {
      const defaults: Record<string, any> = {};
      chart.params.forEach(p => { defaults[p.name] = p.default; });
      setParamValues(defaults);
    }
  };

  const handleParamChange = (name: string, value: any) => {
    setParamValues(v => ({ ...v, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chart = charts.find(c => c.type === selected);
    if (chart) onSelect(chart, paramValues);
  };

  const chart = charts.find(c => c.type === selected);

  const renderParamInput = (param: ChartParam) => {
    // If param is 'target', 'by', or similar, show a select with columns
    if (["target", "by", "group", "group_by", "groupby"].includes(param.name.toLowerCase())) {
      return (
        <select
          className="p-1 border rounded w-full"
          value={paramValues[param.name] ?? ""}
          onChange={e => handleParamChange(param.name, e.target.value)}
        >
          <option value="">Select column...</option>
          {columns.map(col => <option key={col} value={col}>{col}</option>)}
        </select>
      );
    }
    // Default: text/number input
    return (
      <input
        className="p-1 border rounded w-full"
        type={param.type === "int" || param.type === "float" ? "number" : "text"}
        value={paramValues[param.name] ?? ""}
        onChange={e => handleParamChange(param.name, e.target.value)}
        placeholder={param.name}
      />
    );
  };

  return (
    <form className="p-4 bg-white rounded shadow" onSubmit={handleSubmit}>
      <label className="block mb-2 font-bold">Chart/ML Type</label>
      <select className="mb-4 p-2 border rounded w-full" value={selected} onChange={handleChartChange} required>
        <option value="">Select...</option>
        {charts.map(c => (
          <option key={c.type} value={c.type}>{c.label}</option>
        ))}
      </select>
      {chart && (
        <>
          <div className="mb-2 text-gray-600">{chart.description}</div>
          {chart.params.map(param => (
            <div key={param.name} className="mb-2">
              <label className="block text-sm font-medium">{param.description}</label>
              {renderParamInput(param)}
            </div>
          ))}
          <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition" type="submit">
            Use This Chart/ML
          </button>
        </>
      )}
    </form>
  );
};

export default ChartRegistryPanel;
