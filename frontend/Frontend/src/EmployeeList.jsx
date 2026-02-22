// src/EmployeeList.jsx
import { useState, useEffect, useRef } from 'react';
import EmployeeCard from './EmployeeCard';
import employees from './employees';
import HorizontalScroller from './HorizontalScroller';

export default function EmployeeList() {
  const [visibleEmployees, setVisibleEmployees] = useState([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const pageSize = 20;
  const pageRef = useRef(page);
  const containerRef = useRef(null);
  const sentinelRef = useRef(null);
  const fetchingRef = useRef(false);

  // Load initial employees
  useEffect(() => {
    setVisibleEmployees(employees.slice(0, page * pageSize));
  }, [page]);

  // Infinite scroll using IntersectionObserver on the horizontal container
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const rootEl = containerRef.current;
    if (!sentinel || !rootEl) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const currentPage = pageRef.current;
            if (currentPage * pageSize < employees.length && !fetchingRef.current) {
              fetchingRef.current = true;
              setPage(p => p + 1);
              setTimeout(() => (fetchingRef.current = false), 300);
            }
          }
        });
      },
      { root: rootEl, rootMargin: '200px', threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="p-6 h-screen flex flex-col">
      <HorizontalScroller ref={containerRef} className="gap-6 flex-1">
        <div
          className="inline-grid"
          style={{
            display: 'grid',
            gridAutoFlow: 'column',
            gridAutoColumns: '20rem',
            gridTemplateRows: 'repeat(5, auto)',
            gap: '1.5rem',
            alignItems: 'start',
          }}
        >
          {visibleEmployees.map(emp => (
            <div key={emp.id}>
              <EmployeeCard
                employee={emp}
                selected={selected === emp.id}
                onClick={() => setSelected(emp.id)}
                onNameClick={(emp) => setSelectedEmployee(emp)}
              />
            </div>
          ))}
          <div ref={sentinelRef} style={{ width: '1rem' }} />
        </div>
      </HorizontalScroller>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-950 p-8 rounded-lg border border-gray-600 w-96 max-h-96 overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
              <img
                src={selectedEmployee.avatar}
                alt={selectedEmployee.name}
                className="w-24 h-24 rounded-full object-cover border border-gray-500"
              />
              <div>
                <h2 className="text-2xl font-semibold text-white">{selectedEmployee.name}</h2>
                <p className="text-gray-300 font-medium text-lg">{selectedEmployee.role}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-300 mb-3 uppercase tracking-wide">Skills & Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedEmployee.skills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-gray-900 text-gray-100 text-xs px-3 py-1 rounded border border-gray-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">Employee ID</h3>
                <p className="text-gray-400 text-sm">#{selectedEmployee.id}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedEmployee(null)}
              className="w-full mt-6 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded border border-gray-600 hover:border-gray-400 font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}