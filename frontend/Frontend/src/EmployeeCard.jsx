export default function EmployeeCard({ employee, onClick, onNameClick, selected }) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-gray-950 border border-gray-700 hover:border-gray-500
        rounded-lg p-6 flex flex-col items-center
        transition-all duration-300
        ${selected ? 'ring-2 ring-red-900 border-red-900 bg-gray-900' : ''}
        w-full
      `}
    >
      <img
        src={employee.avatar}
        alt={employee.name}
        className="w-24 h-24 rounded-full mb-4 border border-gray-600"
      />
      <h3
        onClick={e => {
          e.stopPropagation();
          onNameClick?.(employee);
        }}
        className="font-semibold text-lg mb-1 cursor-pointer hover:text-gray-200 transition text-white"
      >
        {employee.name}
      </h3>
      <p className="text-gray-400 text-sm">{employee.role}</p>
    </div>
  );
}