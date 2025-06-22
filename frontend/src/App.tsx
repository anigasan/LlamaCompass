import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { Issues } from '@/pages/Issues';
import { Solutions } from '@/pages/Solutions';
import { AgentPerformancePage } from '@/pages/AgentPerformance';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="min-h-screen bg-white flex">
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        }`}>
          <div className="p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/issues" element={<Issues />} />
              <Route path="/solutions" element={<Solutions />} />
              <Route path="/agent-performance" element={<AgentPerformancePage />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;