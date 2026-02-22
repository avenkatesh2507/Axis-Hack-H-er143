// src/employees.js

// Fetch employees from backend
export async function fetchEmployees(skip = 0, limit = 100) {
  try {
    const res = await fetch(`/employees?skip=${skip}&limit=${limit}`);
    if (!res.ok) {
      const text = await res.text();
      console.error('Failed to fetch employees:', res.status, text);
      throw new Error('Failed to fetch employees: ' + res.status);
    }
    return await res.json();
  } catch (err) {
    console.error('fetchEmployees error:', err);
    return [];
  }
}