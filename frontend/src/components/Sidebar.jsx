import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Bell,
  Brain,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/businesses', label: 'Businesses', icon: Building2 },
  { to: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin/insights', label: 'AI Insights', icon: Brain },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const { pathname } = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 shadow-sm hidden md:flex md:flex-col">
      <div className="p-4 border-b border-gray-200 flex items-center gap-2">
        <img src="/logo.svg" alt="logo" className="h-6" />
        <h1 className="text-lg font-semibold text-green-600">Admin</h1>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl transition
               ${isActive || pathname.startsWith(to)
                 ? 'bg-green-50 text-green-700 border border-green-100'
                 : 'text-gray-700 hover:bg-gray-50'}`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}