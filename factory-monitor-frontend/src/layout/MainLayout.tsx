import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

export default function MainLayout() {
  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      <Header />
      <div className="flex  flex-grow">
        <Sidebar />
        <main className="p-4 overflow-y-auto flex-grow bg-gray-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
