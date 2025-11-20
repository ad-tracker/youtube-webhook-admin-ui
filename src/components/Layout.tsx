import { Link, useLocation } from 'react-router-dom';
import {
  Bell,
  File,
  LogOut,
  Radio,
  ShieldX,
  Video,
  Youtube,
} from 'lucide-react';
import { useAPI } from '../contexts/APIContext';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  {
    name: 'Webhook Events',
    path: '/webhook-events',
    icon: Bell,
  },
  {
    name: 'Channels',
    path: '/channels',
    icon: Youtube,
  },
  {
    name: 'Videos',
    path: '/videos',
    icon: Video,
  },
  {
    name: 'Blocked Videos',
    path: '/blocked-videos',
    icon: ShieldX,
  },
  {
    name: 'Video Updates',
    path: '/video-updates',
    icon: File,
  },
  {
    name: 'Subscriptions',
    path: '/subscriptions',
    icon: Radio,
  },
];

/**
 * Main layout component with navigation sidebar
 */
export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { clearConfig } = useAPI();

  const handleLogout = () => {
    if (confirm('Are you sure you want to disconnect from the API?')) {
      clearConfig();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white shadow-sm">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold text-primary">YT Webhook Admin</h1>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Disconnect
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
