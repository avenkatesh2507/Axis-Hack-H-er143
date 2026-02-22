import employees from "./employees";

export default function InfiniteEmployees() {
  return (
    <div className="h-screen overflow-hidden bg-gray-900 text-white">
      
      <div className="animate-scroll grid-wrapper">

        {/* DUPLICATE EMPLOYEES */}
        {[...employees, ...employees].map((emp, index) => (
          <div
            key={index}
            className="bg-gray-800 rounded-2xl p-6 shadow-xl hover:scale-105 transition-transform duration-300"
          >
            <img
              src={emp.avatar}
              alt={emp.name}
              className="w-24 h-24 rounded-full mb-4"
            />
            <h3 className="text-xl font-bold">{emp.name}</h3>
            <p className="text-gray-400">{emp.role}</p>
          </div>
        ))}

      </div>

    </div>
  );
}