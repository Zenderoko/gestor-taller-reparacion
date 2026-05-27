import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Wrench,
  ClipboardList,
  MessageCircle,
  ChevronLeft,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clientes' },
  { to: '/equipment', icon: Wrench, label: 'Equipos' },
  { to: '/orders', icon: ClipboardList, label: 'Órdenes' },
  { to: '/whatsapp', icon: MessageCircle, label: 'WhatsApp' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex flex-col bg-white border-r border-secondary-200 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center gap-3 px-5 h-16 border-b border-secondary-100">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Wrench className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-secondary-900 text-lg">GestorTaller</span>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
              )
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-secondary-800 text-white text-xs rounded whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50">
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-secondary-100">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-secondary-500 hover:text-secondary-700 rounded-lg hover:bg-secondary-100 transition-colors"
        >
          <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}
