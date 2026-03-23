import { Menu } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Topbar({ onToggleSidebar }) {
  const { admin } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-14 sm:h-16 px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 active:scale-[0.98] transition"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <img
              src="/logo.svg"
              alt="Trusted Links"
              className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-bold text-gray-900 truncate">
                Trusted Links
              </div>
              <div className="hidden sm:block text-xs text-gray-500 truncate">
                Admin Panel
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="hidden sm:block text-right min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate max-w-[160px] md:max-w-[220px]">
              {admin?.name || "Admin"}
            </div>
            <div className="text-xs text-gray-500 truncate max-w-[160px] md:max-w-[220px]">
              {admin?.email || "—"}
            </div>
          </div>

          <img
            src="/avatar.png"
            onError={(e) => {
              e.currentTarget.src =
                "https://api.dicebear.com/9.x/initials/svg?seed=TL";
            }}
            alt="avatar"
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-gray-200 shrink-0 bg-white"
          />
        </div>
      </div>
    </header>
  );
}
