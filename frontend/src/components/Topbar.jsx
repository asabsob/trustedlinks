import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar({ onToggleSidebar }) {
  const { admin } = useAuth();
  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            className="md:hidden p-2 rounded-lg border border-gray-200"
            onClick={onToggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src="/logo.svg" alt="logo" className="h-6 md:hidden" />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-semibold">{admin?.name || 'Admin'}</div>
            <div className="text-xs text-gray-500">{admin?.email || '—'}</div>
          </div>
          <img
            src="/avatar.png"
            onError={(e)=>{e.currentTarget.src='https://api.dicebear.com/9.x/initials/svg?seed=TL'}}
            alt="avatar"
            className="h-9 w-9 rounded-full border border-gray-200"
          />
        </div>
      </div>
    </header>
  );
}
