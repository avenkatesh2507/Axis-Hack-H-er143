
import { useEffect, useState, useRef, useCallback } from 'react';
import { fetchEmployees } from './employees';
import EmployeeCard from './EmployeeCard';
import HorizontalScroller from './HorizontalScroller';

export default function InfiniteEmployees() {
  const [allEmployees, setAllEmployees] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [index, setIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);


  const observer = useRef();
  const BATCH_SIZE = 30;
  const GRID_COLS = 6;
  const loadMore = () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextBatch = allEmployees.slice(index, index + BATCH_SIZE);
    setEmployees(prev => [...prev, ...nextBatch]);
    setIndex(prev => prev + BATCH_SIZE);
    if (index + BATCH_SIZE >= allEmployees.length) setHasMore(false);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees().then(data => {
      setAllEmployees(data);
      setEmployees(data.slice(0, BATCH_SIZE));
      setIndex(BATCH_SIZE);
      setHasMore(data.length > BATCH_SIZE);
      if (!data || data.length === 0) {
        // Show a message if no employees are loaded
        setTimeout(() => {
          alert('No employees loaded. Check backend/API connection.');
        }, 500);
      }
    });
    // eslint-disable-next-line
  }, []);

  // Infinite scroll: load more when the user scrolls near the bottom/right
  const scrollerRef = useRef();
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      // Get the content div inside HorizontalScroller
      const content = el.querySelector('div > div');
      if (!content) return;
      const { width, height } = content.getBoundingClientRect();
      const { x, y } = content.style.transform
        ? content.style.transform.match(/-?\d+/g)?.reduce((acc, v, i) => {
            if (i === 0) acc.x = parseInt(v, 10);
            if (i === 1) acc.y = parseInt(v, 10);
            return acc;
          }, { x: 0, y: 0 }) || { x: 0, y: 0 }
        : { x: 0, y: 0 };
      // If scrolled near the right or bottom edge, load more
      if ((width + x) < 1200 || (height + y) < 800) {
        loadMore();
      }
    };
    el.addEventListener('mouseup', onScroll);
    el.addEventListener('touchend', onScroll);
    return () => {
      el.removeEventListener('mouseup', onScroll);
      el.removeEventListener('touchend', onScroll);
    };
  }, [employees, loading, hasMore]);

  return (
    <div className="p-2 w-full h-[80vh]">
      <HorizontalScroller ref={scrollerRef} className="w-full h-full bg-black rounded-lg border border-gray-800">
        <div
          className={`grid gap-6`} 
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, 260px)`,
            gridAutoRows: '320px',
            minWidth: `${GRID_COLS * 260}px`,
            minHeight: `${Math.ceil(employees.length / GRID_COLS) * 320}px`,
            padding: 24,
          }}
        >
          {employees.map((emp, idx) => (
            <div key={emp.employee_id || emp.id} className="">
              <EmployeeCard employee={emp} />
            </div>
          ))}
        </div>
        {employees.length === 0 && (
          <div className="col-span-full text-center text-gray-400 text-lg mt-10">
            No employees loaded.<br />
            {loading ? 'Loading...' : 'Check backend/API connection.'}
          </div>
        )}
        {loading && employees.length > 0 && (
          <p className="text-center col-span-full">Loading...</p>
        )}
        {!hasMore && <p className="text-center col-span-full">No more employees</p>}
      </HorizontalScroller>
    </div>
  );
}