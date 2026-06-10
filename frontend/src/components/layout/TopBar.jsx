import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, User } from 'lucide-react';
import { useState } from 'react';

export default function TopBar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
          <p className="text-sm font-medium text-secondary-900">{user?.name || 'Usuario'}</p>
          <p className="text-xs text-secondary-500 hidden md:block">{user?.email}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            {user?.name?.charAt(0)?.toUpperCase() || <User className="w-4 h-4" />}
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 py-1 z-20">
                <div className="px-4 py-2 border-b border-secondary-100 sm:hidden">
                  <p className="text-sm font-medium text-secondary-900">{user?.name}</p>
                  <p className="text-xs text-secondary-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
