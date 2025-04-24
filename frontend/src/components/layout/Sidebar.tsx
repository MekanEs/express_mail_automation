import React from 'react';
import { NavLink } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const linkClass = ({ isActive }: { isActive: boolean }): string => 
    `block py-2 px-4 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-600' : ''}`;

  return (
    <aside className="w-64 bg-gray-800 text-white p-4 space-y-2">
      <NavLink to="/" className={linkClass} end>
        Dashboard
      </NavLink>
      <NavLink to="/reports" className={linkClass}>
        Reports
      </NavLink>
      <NavLink to="/process/new" className={linkClass}>
        Start New Process
      </NavLink>
      {/* Add other links as needed */}
    </aside>
  );
}; 