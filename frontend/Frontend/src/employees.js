// src/employees.js

// Skill sets by role
const skillsByRole = {
  Designer: ['UI/UX', 'Figma', 'Prototyping', 'Web Design', 'Mobile Design', 'Accessibility', 'Animation', 'Branding'],
  Developer: ['JavaScript', 'React', 'Node.js', 'Python', 'Django', 'SQL', 'TypeScript', 'GraphQL', 'Testing', 'Go', 'Rust'],
  Manager: ['Leadership', 'Planning', 'Communication', 'Project Management', 'Agile', 'Scrum', 'Budget', 'Strategy', 'Team Building', 'Mentoring'],
  QA: ['Testing', 'Bug Detection', 'Automation', 'Manual Testing', 'Performance Testing', 'Security', 'API Testing', 'Debugging'],
  DevOps: ['CI/CD', 'AWS', 'Docker', 'Kubernetes', 'Terraform', 'Monitoring', 'Deployment', 'Scaling', 'Security', 'Logging'],
};

const employees = Array.from({ length: 90 }, (_, i) => {
  const roles = ['Designer', 'Developer', 'Manager', 'QA', 'DevOps'];
  const role = roles[i % roles.length];
  const roleSkills = skillsByRole[role];
  // Each employee gets 2-3 random skills from their role
  const assignedSkills = roleSkills.sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 2));
  
  return {
    id: i + 1,
    name: `Employee ${i + 1}`,
    role: role,
    skills: assignedSkills,
    avatar: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
  };
});

export default employees;
export { employees };