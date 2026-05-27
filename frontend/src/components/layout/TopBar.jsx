import { UserButton, useUser } from '@clerk/clerk-react';

export default function TopBar() {
  const { user } = useUser();

  return (
    <header className="h-16 bg-white border-b border-secondary-200 flex items-center justify-between px-6">
      <div>
        <h2 className="text-sm font-medium text-secondary-500">
          {new Date().toLocaleDateString('es-AR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-secondary-900">{user?.fullName || 'Usuario'}</p>
          <p className="text-xs text-secondary-500">{user?.primaryEmailAddress?.emailAddress}</p>
        </div>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
