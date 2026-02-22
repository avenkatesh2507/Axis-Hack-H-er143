// EmployeesList.jsx
import { useEffect, useState, useRef } from "react";
import { fetchEmployees } from './employees';
import EmployeeCard from './EmployeeCard';

export default function EmployeesList() {
  const [employees, setEmployees] = useState([]);
  const [page, setPage] = useState(0); // batch index
  const [loading, setLoading] = useState(false);
  const loader = useRef(null);

  const BATCH_SIZE = 20;

  // fetch employees in batches
  const loadMore = async () => {
    setLoading(true);
    try {
      const data = await fetchEmployees();
      const batch = data.slice(page * BATCH_SIZE, (page + 1) * BATCH_SIZE);
      setEmployees(prev => [...prev, ...batch]);
      setPage(prev => prev + 1);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    } finally {
      setLoading(false);
    }
  };

  // infinite scroll observer
  useEffect(() => {
    const options = { root: null, rootMargin: "20px", threshold: 1.0 };
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loading) {
        loadMore();
      }
    }, options);

    if (loader.current) observer.observe(loader.current);

    return () => observer.disconnect();
  }, [loader.current, loading]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {employees.map(emp => (
        <EmployeeCard key={emp.employee_id} employee={emp} />
      ))}
      {loading && <p className="col-span-full text-center">Loading...</p>}
      <div ref={loader}></div>
    </div>
  );
}