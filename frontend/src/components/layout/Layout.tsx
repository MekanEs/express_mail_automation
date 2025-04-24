import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header.tsx';
import { Sidebar } from './Sidebar.tsx';
// import { Footer } from './Footer'; // Раскомментировать при необходимости

export const Layout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto bg-gray-100">
          {/* Content for the current route will be rendered here */}
          <Outlet />
        </main>
      </div>
      {/* Optional: Add a Footer component here */}
    </div>
  );
}; 