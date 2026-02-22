import { useState } from 'react';
import TaskBoard from './TaskBoard';
import InfiniteEmployees from './InfiniteEmployees';

export default function App() {
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' or 'employees'
  const [showIntro, setShowIntro] = useState(true);

  // Hide intro after video ends or after 4 seconds
  const handleIntroEnd = () => setShowIntro(false);

  return (
    <>
      {showIntro ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <video
            src="/Axis.vid.mp4"
            autoPlay
            muted
            className="w-full h-full object-cover"
            onEnded={handleIntroEnd}
            onLoadedData={() => setTimeout(handleIntroEnd, 4000)}
          />
        </div>
      ) : (
        <div className="bg-black min-h-screen text-white">
          <header className="p-6 border-b border-gray-700 bg-gray-950">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-light tracking-tight text-white">Manager Dashboard</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-4 py-2 font-medium transition border-b-2 ${
                  activeTab === 'tasks'
                    ? 'text-white border-b-red-900'
                    : 'text-gray-400 border-b-transparent hover:text-gray-200'
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => setActiveTab('employees')}
                className={`px-4 py-2 font-medium transition border-b-2 ${
                  activeTab === 'employees'
                    ? 'text-white border-b-red-900'
                    : 'text-gray-400 border-b-transparent hover:text-gray-200'
                }`}
              >
                Employees
              </button>
            </div>
          </header>

          <main className="p-4">
            {activeTab === 'tasks' && <TaskBoard />}
            {activeTab === 'employees' && <InfiniteEmployees />}
          </main>
        </div>
      )}
    </>
  );
}