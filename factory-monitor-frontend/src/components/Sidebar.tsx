import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="w-60 bg-gray-900 p-4 border-r border-gray-800">
      <nav className="space-y-4">
        <NavLink to="/" className={({ isActive }) =>
          `block px-4 py-2 rounded hover:bg-gray-800 ${isActive ? 'bg-gray-800 font-semibold' : ''}`
        }>
          Main Dashboard
        </NavLink>
        <NavLink to="/factory" className={({ isActive }) =>
          `block px-4 py-2 rounded hover:bg-gray-800 ${isActive ? 'bg-gray-800 font-semibold' : ''}`
        }>
          Factory Details
        </NavLink>
        <NavLink to="/machines" className={({ isActive }) =>
          `block px-4 py-2 rounded hover:bg-gray-800 ${isActive ? 'bg-gray-800 font-semibold' : ''}`
        }>
          Machines
        </NavLink>
        <NavLink to="/analysis" className={({ isActive }) =>
          `block px-4 py-2 rounded hover:bg-gray-800 ${isActive ? 'bg-gray-800 font-semibold' : ''}`
        }>
          Analysis
        </NavLink>
      </nav>
    </aside>
  );
}
