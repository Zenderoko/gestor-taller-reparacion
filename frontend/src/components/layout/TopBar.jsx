import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, User, Key } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function TopBar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Completa todos los campos');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    setPwLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success('Contraseña actualizada');
      setPwModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <>
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
                    onClick={() => { setMenuOpen(false); setPwModal(true); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50 transition-colors"
                  >
                    <Key className="w-4 h-4" /> Cambiar contraseña
                  </button>
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

      <Modal open={pwModal} onClose={() => { setPwModal(false); setCurrentPassword(''); setNewPassword(''); }} title="Cambiar contraseña">
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Contraseña actual"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••"
          />
          <Input
            label="Nueva contraseña"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la contraseña"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setPwModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>
              Cancelar
            </Button>
            <Button type="submit" loading={pwLoading}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
