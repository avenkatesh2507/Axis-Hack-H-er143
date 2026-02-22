import { useState, useEffect } from 'react';
import tasks from './tasks';
import { fetchEmployees } from './employees';

export default function TaskBoard() {
  const [taskList, setTaskList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    dueDate: '',
    assignedTo: null,
    difficulty: 'Medium',
  });

  // Load tasks from localStorage on mount (only use defaults if localStorage is missing or corrupted, never overwrite localStorage after first mount)
  useEffect(() => {
    let saved = localStorage.getItem('tasks');
    let parsed = [];
    let valid = false;
    if (saved && saved !== 'undefined') {
      try {
        parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          valid = true;
        }
      } catch {}
    }
    if (valid) {
      setTaskList(parsed);
    } else {
      setTaskList(tasks);
      // Only set localStorage if it is missing or corrupted, not on every mount
      if (!saved || saved === 'undefined') {
        localStorage.setItem('tasks', JSON.stringify(tasks));
      }
    }
    fetchEmployees().then(setEmployees).catch(() => setEmployees([]));
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(taskList));
  }, [taskList]);

  // Calculate workload for each employee
  const getEmployeeWorkload = (employeeId) => {
    const assignedTasks = taskList.filter(
      task => task.assignedTo && employees.find(e => e.name === task.assignedTo)?.id === employeeId
    );
    const totalDifficulty = assignedTasks.reduce((sum, task) => {
      const diffMap = { Low: 1, Medium: 2, High: 3 };
      return sum + (diffMap[task.difficulty] || 1);
    }, 0);
    return { count: assignedTasks.length, difficulty: totalDifficulty };
  };

  // Infer task type from task name keywords
  const inferTaskType = (taskName) => {
    const name = taskName.toLowerCase();
    if (name.includes('design') || name.includes('ui') || name.includes('ux')) return 'Designer';
    if (name.includes('develop') || name.includes('code') || name.includes('api') || name.includes('feature')) return 'Developer';
    if (name.includes('manage') || name.includes('plan') || name.includes('schedule')) return 'Manager';
    if (name.includes('test') || name.includes('qa') || name.includes('bug') || name.includes('quality')) return 'QA';
    if (name.includes('deploy') || name.includes('infra') || name.includes('devops') || name.includes('server')) return 'DevOps';
    return null;
  };

  // Calculate skill match score
  const getSkillMatchScore = (employee, taskName) => {
    const taskKeywords = taskName.toLowerCase().split(' ');
    const employeeSkillsLower = employee.skills.map(s => s.toLowerCase());
    
    let matches = 0;
    taskKeywords.forEach(keyword => {
      if (employeeSkillsLower.some(skill => skill.includes(keyword) || keyword.includes(skill))) {
        matches++;
      }
    });
    return matches;
  };

  // Get employee recommendations
  const getRecommendedEmployees = (taskName, taskDifficulty) => {
    const inferredType = inferTaskType(taskName);
    
    const scored = employees.map(emp => {
      let score = 0;
      let reasons = [];

      // Role match (50 points)
      if (emp.role === inferredType) {
        score += 50;
        reasons.push('Perfect role match');
      } else {
        score += 5; // Small bonus for having any role
      }

      // Skill match (40 points max)
      const skillMatch = getSkillMatchScore(emp, taskName);
      score += Math.min(skillMatch * 12, 40);
      if (skillMatch > 0) {
        reasons.push(`${skillMatch} skill${skillMatch > 1 ? 's' : ''}`);
      }

      // Workload capacity (30 points, more granular)
      const workload = getEmployeeWorkload(emp.id);
      const diffMap = { Low: 1, Medium: 2, High: 3 };
      const taskWeight = diffMap[taskDifficulty] || 1;
      const totalWeight = workload.difficulty + taskWeight;
      
      if (totalWeight <= 3) {
        score += 30;
        reasons.push('Very low workload');
      } else if (totalWeight <= 5) {
        score += 25;
        reasons.push('Low workload');
      } else if (totalWeight <= 8) {
        score += 18;
        reasons.push('Moderate workload');
      } else if (totalWeight <= 12) {
        score += 8;
        reasons.push('High workload');
      } else {
        score += 2;
        reasons.push('Very busy');
      }

      // Tiebreaker: fewer current tasks is better (1 point per available slot)
      const availableCapacity = Math.max(0, 5 - workload.count);
      score += availableCapacity;

      return { employee: emp, score, reasons, workload: workload.count };
    });

    // Sort by score descending and return top 5
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  };

  const handleModalOpen = () => {
    setIsModalOpen(true);
    // Generate recommendations whenever modal opens
    if (formData.name) {
      const recs = getRecommendedEmployees(formData.name, formData.difficulty);
      setRecommendations(recs);
    }
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData({ ...formData, name: newName });
    if (newName.trim()) {
      const recs = getRecommendedEmployees(newName, formData.difficulty);
      setRecommendations(recs);
    } else {
      setRecommendations([]);
    }
  };

  const handleDifficultyChange = (e) => {
    const newDifficulty = e.target.value;
    setFormData({ ...formData, difficulty: newDifficulty });
    if (formData.name.trim()) {
      const recs = getRecommendedEmployees(formData.name, newDifficulty);
      setRecommendations(recs);
    }
  };

  const handleSelectRecommendation = (employeeId) => {
    const employee = employees.find(e => e.id === employeeId);
    setFormData({ ...formData, assignedTo: employee.name });
  };

  const handleAddTask = () => {
    if (!formData.name.trim() || !formData.dueDate) {
      alert('Please fill in task name and due date');
      return;
    }
    const newTask = {
      id: Math.max(...taskList.map(t => t.id), 0) + 1,
      name: formData.name,
      dueDate: formData.dueDate,
      assignedTo: formData.assignedTo,
      difficulty: formData.difficulty,
      completed: false,
    };
    setTaskList([...taskList, newTask]);
    setFormData({ name: '', dueDate: '', assignedTo: null, difficulty: 'Medium' });
    setRecommendations([]);
    setIsModalOpen(false);
  };

  const handleTaskChange = (id, key, value) => {
    setTaskList(prev =>
      prev.map(task => (task.id === id ? { ...task, [key]: value } : task))
    );
  };

  const handleDeleteTask = (id) => {
    setTaskList(prev => prev.filter(task => task.id !== id));
  };

  const difficultyColors = {
    Low: 'bg-gray-900 text-gray-200 border border-gray-700',
    Medium: 'bg-red-950 text-red-100 border border-red-900',
    High: 'bg-red-900 text-red-50 border border-red-800',
  };

  const employeeNames = [null, ...employees.map(e => e.name)];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-light tracking-tight text-white">Task Manager</h1>
        <button
          onClick={handleModalOpen}
          className="px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded border border-red-800 hover:border-red-700 font-medium transition"
        >
          + Add Task
        </button>
      </div>

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-950 p-6 rounded-lg border border-gray-600 w-full max-w-2xl max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-4 text-white">Create New Task</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">Task Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-600 focus:border-gray-400 focus:outline-none placeholder-gray-500"
                  placeholder="e.g., Design homepage, Fix API bug"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-600 focus:border-gray-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">Difficulty</label>
                <select
                  value={formData.difficulty}
                  onChange={handleDifficultyChange}
                  className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-600 focus:border-gray-400 focus:outline-none"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>

              {/* Smart Recommendations */}
              {recommendations.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-3 uppercase tracking-wide">
                    ✨ Recommended Employees
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {recommendations.map(rec => (
                      <button
                        key={rec.employee.id}
                        onClick={() => handleSelectRecommendation(rec.employee.id)}
                        className={`text-left p-3 rounded border transition flex items-center gap-3 ${
                          formData.assignedTo === rec.employee.name
                            ? 'border-red-900 bg-gray-900'
                            : 'border-gray-600 bg-gray-950 hover:bg-gray-900 hover:border-red-900'
                        }`}
                      >
                        <img
                          src={rec.employee.avatar}
                          alt={rec.employee.name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-white">
                                {rec.employee.name} · {rec.employee.role}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {rec.reasons.join(' • ')}
                              </div>
                              {rec.workload > 0 && (
                                <div className="text-xs text-gray-400 mt-1">
                                  Current workload: {rec.workload} task{rec.workload > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                            <div className="text-right ml-2">
                              <div className="text-lg font-bold text-white">{rec.score}</div>
                              <div className="text-xs text-gray-400">score</div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wide">Or Assign Manually</label>
                <select
                  value={formData.assignedTo || ''}
                  onChange={e => setFormData({ ...formData, assignedTo: e.target.value || null })}
                  className="w-full bg-gray-900 text-white px-3 py-2 rounded border border-gray-600 focus:border-gray-400 focus:outline-none"
                >
                  {employeeNames.map(name => (
                    <option key={name || 'unassigned'} value={name || ''}>
                      {name || 'Unassigned'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setFormData({ name: '', dueDate: '', assignedTo: null, difficulty: 'Medium' });
                  setRecommendations([]);
                }}
                className="flex-1 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded border border-gray-600 hover:border-gray-400 font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                className="flex-1 px-4 py-2 bg-red-900 hover:bg-red-800 text-white rounded border border-red-800 hover:border-red-700 font-medium transition"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-gray-950 rounded-lg overflow-hidden border border-gray-700">
          <thead>
            <tr className="bg-gray-900 text-white border-b border-gray-700">
              <th className="px-4 py-3 text-left font-semibold">Task Name</th>
              <th className="px-4 py-3 text-left font-semibold">Due Date</th>
              <th className="px-4 py-3 text-left font-semibold">Assigned To</th>
              <th className="px-4 py-3 text-left font-semibold">Difficulty</th>
              <th className="px-4 py-3 text-center font-semibold">Done</th>
              <th className="px-4 py-3 text-center font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {taskList.map(task => (
              <tr
                key={task.id}
                className={`border-t border-gray-700 hover:bg-gray-900 transition ${
                  task.completed ? 'opacity-60' : ''
                }`}
              >
                <td className="px-4 py-3 text-gray-200">
                  <span className={task.completed ? 'line-through text-gray-500' : ''}>
                    {task.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300">
                  <input
                    type="date"
                    value={task.dueDate}
                    onChange={e => handleTaskChange(task.id, 'dueDate', e.target.value)}
                    className="bg-gray-900 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-gray-400 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={task.assignedTo || ''}
                    onChange={e => handleTaskChange(task.id, 'assignedTo', e.target.value || null)}
                    className="bg-gray-900 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-gray-400 focus:outline-none"
                  >
                    {employeeNames.map(name => (
                      <option key={name || 'unassigned'} value={name || ''}>
                        {name || 'Unassigned'}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={task.difficulty}
                    onChange={e => handleTaskChange(task.id, 'difficulty', e.target.value)}
                    className={`px-2 py-1 rounded text-sm font-medium ${
                      difficultyColors[task.difficulty]
                    }`}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={e => handleTaskChange(task.id, 'completed', e.target.checked)}
                    className="w-5 h-5 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="px-3 py-1 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white rounded text-sm border border-gray-600 hover:border-gray-400 transition"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

