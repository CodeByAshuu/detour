import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="flex-1 overflow-hidden bg-ink relative flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
