import React from 'react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">
          Монитор Сервисов
        </Link>
        {/* Placeholder for potential user info/logout */}
        <nav>
          {/* Add main navigation links if needed */}
        </nav>
      </div>
    </header>
  );
};
