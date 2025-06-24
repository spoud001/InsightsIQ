import DatasetPanel from './DatasetPanel';
import DashboardPanel from './DashboardPanel';
import { useState } from 'react';

export default function Dashboard() {
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | null>(null);
  const [columns, setColumns] = useState<string[]>([]);

  return (
    <div className="flex flex-col min-h-screen w-full">
      {/* Dataset selection panel (optional, can be moved into DashboardPanel if desired) */}
      <DatasetPanel onSelectDataset={(id, cols) => { setSelectedDatasetId(id); setColumns(cols); }} />
      {/* Main dashboard panel with navbar, layout, and all content */}
      <DashboardPanel selectedDatasetId={selectedDatasetId} columns={columns} />
    </div>
  );
}
