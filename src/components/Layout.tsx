import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Car, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown,
  DollarSign,
  Award,
  ClipboardCheck,
  Monitor,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '../App';
import { useData } from '../DataContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { units } = useData();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', roles: ['DONO', 'LAVADOR'] },
    { icon: Calendar, label: 'Agenda', path: '/agenda', roles: ['DONO', 'LAVADOR'] },
    { icon: Users, label: 'Clientes', path: '/clients', roles: ['DONO', 'LAVADOR'] },
    { icon: ClipboardCheck, label: 'Check-in', path: '/check-in', roles: ['DONO', 'LAVADOR'] },
    { icon: Settings, label: 'Serviços', path: '/services', roles: ['DONO'] },
    { icon: Users, label: 'Funcionários', path: '/staff', roles: ['DONO'] },
    { icon: Award, label: 'Fidelidade', path: '/loyalty', roles: ['DONO', 'LAVADOR'] },
    { icon: DollarSign, label: 'Financeiro', path: '/finance', roles: ['DONO'] },
    { icon: MessageSquare, label: 'Mensagens', path: '/bulk-messages', roles: ['DONO'] },
    { icon: TrendingUp, label: 'Produção', path: '/payroll', roles: ['DONO'] },
    { icon: TrendingUp, label: 'Minha Produção', path: '/my-production', roles: ['LAVADOR'] },
    { icon: Settings, label: 'Ajustes', path: '/settings', roles: ['DONO'] },
  ].filter(item => item.roles.includes(user?.role || ''));

  const handleNavigate = (path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 overflow-hidden text-zinc-300">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-zinc-950 border-r border-zinc-800/50 transition-all duration-300 flex flex-col lg:static lg:translate-x-0",
        isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 w-64 lg:w-20"
      )}>
        <div className="p-6 flex items-center justify-center border-b border-zinc-800/50 h-48 shrink-0 pt-10 relative">
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 text-zinc-500 hover:text-white"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className={cn(
              "rounded-lg flex items-center justify-center shrink-0 overflow-hidden transition-all duration-300",
              isSidebarOpen ? "w-36 h-36" : "w-12 h-12"
            )}>
              <img 
                src="https://i.postimg.cc/fy9c2r4k/Brutus-recortada.png" 
                alt="BRUTUS" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className={cn(
              "font-black text-xl tracking-tighter text-white transition-opacity duration-300 hidden"
            )}>
              BRUTUS
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative",
                location.pathname === item.path 
                  ? "bg-zinc-900/50 backdrop-blur-sm text-zinc-100 border border-zinc-800/50 shadow-sm" 
                  : "text-zinc-500 hover:bg-zinc-900/50 backdrop-blur-sm hover:text-zinc-300 border border-transparent"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span className={cn(
                "font-medium text-sm transition-opacity duration-300",
                !isSidebarOpen && "lg:opacity-0 lg:w-0 overflow-hidden"
              )}>
                {item.label}
              </span>
              
              {/* Tooltip for collapsed sidebar */}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 text-zinc-300 text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 hidden lg:block">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800/50">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 p-3 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 backdrop-blur-sm rounded-xl transition-colors group relative border border-transparent"
          >
            <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span className={cn(
              "font-medium text-sm transition-opacity duration-300",
              !isSidebarOpen && "lg:opacity-0 lg:w-0 overflow-hidden"
            )}>
              Sair
            </span>
            {!isSidebarOpen && (
              <div className="absolute left-full ml-4 px-2 py-1 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 text-zinc-300 text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 hidden lg:block">
                Sair
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        <header className="h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-zinc-900/50 backdrop-blur-sm rounded-lg transition-colors text-zinc-500 hover:text-zinc-300"
            >
              <Menu className="w-5 h-5" strokeWidth={1.5} />
            </button>
            
            {user?.role === 'DONO' && (
              <div className="text-[10px] md:text-xs font-medium text-zinc-500 bg-zinc-900/50 backdrop-blur-sm px-2 md:px-3 py-1.5 rounded-lg border border-zinc-800/50">
                <span className="hidden md:inline">Modo Administrador</span>
                <span className="md:hidden">ADM</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div className="text-right hidden xs:block">
              <p className="text-sm font-medium text-zinc-100 truncate max-w-[100px] md:max-w-none">{user?.name}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">{user?.role}</p>
            </div>
            <div className="w-8 h-8 md:w-9 md:h-9 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-full flex items-center justify-center font-medium text-zinc-300 text-sm">
              {user?.name?.[0]}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
