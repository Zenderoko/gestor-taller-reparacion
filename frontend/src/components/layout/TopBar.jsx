import { UserButton, useUser } from '@clerk/clerk-react';
import { Menu } from 'lucide-react';

export default function TopBar({ onMenuClick }) {
  const { user } = useUser();

  return (
    <header className="h-16 bg-white border-b border-secondary-200 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-1.5 text-secondary-500 hover:text-secondary-700 rounded-lg hover:bg-secondary-100 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-sm font-medium text-secondary-500 hidden sm:block">
          {new Date().toLocaleDateString('es-AR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </h2>
        <h2 className="text-sm font-medium text-secondary-500 sm:hidden">
          {new Date().toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'short',
          })}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-secondary-900">{user?.fullName || 'Usuario'}</p>
          <p className="text-xs text-secondary-500 hidden md:block">{user?.primaryEmailAddress?.emailAddress}</p>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
