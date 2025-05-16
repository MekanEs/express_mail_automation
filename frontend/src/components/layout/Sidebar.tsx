import React from 'react';
import { NavLink } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const linkClass = ({ isActive }: { isActive: boolean }): string =>
    `block py-2 px-4 rounded hover:bg-gray-700 ${isActive ? 'bg-gray-600' : ''}`;

  return (
    <aside className="w-64 bg-gray-800 text-white p-4 space-y-2">
      <NavLink to="/" className={linkClass} end>
        Панель управления
      </NavLink>
      <NavLink to="/reports" className={linkClass}>
        Отчеты
      </NavLink>
      <NavLink to="/process/new" className={linkClass}>
        Запустить новый процесс
      </NavLink>
      {/* Add other links as needed */}
    </aside>
  );
};
