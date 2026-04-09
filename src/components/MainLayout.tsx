import { Link, Outlet } from 'react-router-dom';
import { 
  PlusCircle, Layers, LayoutDashboard, Users, 
  LogOut, Moon, Sun, Settings, 
  Filter
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { AccessRole } from '../types/api';

export function MainLayout() {
  const { logout, toggleTheme, theme, user } = useAuthStore();

  if (!user) return null;

  const isMaster = user.access === AccessRole.MASTER;
  const isAdminOrMaster = user.access === AccessRole.MASTER || user.access === AccessRole.ADMIN;

  return (
    <div className="flex h-screen w-full bg-brand-bg transition-colors duration-300 overflow-hidden text-brand-text font-sans">
      
      {/* SIDEBAR */}
      <aside className="relative h-full group flex flex-col bg-brand-surface border-r border-white/5 transition-all duration-300 w-20 hover:w-64 z-50 shadow-2xl shrink-0">
        
        {/* LOGO */}
        <div className="p-6 mb-6 flex items-center gap-4 overflow-hidden">
          <div className="min-w-[32px] h-8 bg-brand-primary rounded-lg shadow-lg shadow-brand-primary/20 flex items-center justify-center text-white font-black italic shrink-0">
            R
          </div>
          <span className="font-black text-xl tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            ReqFlow
          </span>
        </div>

        {/* NAVEGAÇÃO */}
        <nav className="flex-1 px-4 flex flex-col gap-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <NavItem to="/" icon={<LayoutDashboard size={22} />} label="Dashboard" />
          <NavItem to="/create-request" icon={<PlusCircle size={22} />} label="Nova Solicitação" />

          {isAdminOrMaster && (
            <>
              <div className="h-px bg-white/5 my-2 mx-2 shrink-0" />
              <NavItem to="/management" icon={<Filter size={22} />} label="Gestão de Pedidos" />
              <NavItem to="/config" icon={<Settings size={22} />} label="Configurar Fluxos" />
            </>
          )}

          {isMaster && (
            <>
              <div className="h-px bg-white/5 my-2 mx-2 shrink-0" />
              <NavItem to="/areas" icon={<Layers size={22} />} label="Gestão de Áreas" />
              <NavItem to="/users" icon={<Users size={22} />} label="Portaria / Usuários" />
            </>
          )}
        </nav>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/5 flex flex-col gap-2 shrink-0">
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-brand-muted/10 transition-colors text-brand-muted hover:text-brand-text w-full overflow-hidden"
          >
            <div className="min-w-[22px] shrink-0">
              {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
            </div>
            <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            </span>
          </button>

          <button 
            onClick={logout}
            className="flex items-center gap-4 p-3 rounded-xl hover:bg-brand-error/10 transition-colors text-brand-error w-full overflow-hidden"
          >
            <div className="min-w-[22px] shrink-0">
              <LogOut size={22} />
            </div>
            <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Sair
            </span>
          </button>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden relative bg-brand-bg/50">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ icon, label, to }: { icon: React.ReactNode, label: string, to: string }) {
  return (
    <Link 
      to={to} 
      className="flex items-center gap-4 p-3 rounded-xl hover:bg-brand-primary/10 transition-colors text-brand-muted hover:text-brand-primary group/item overflow-hidden"
    >
      <div className="min-w-[22px] shrink-0 transition-transform group-hover/item:scale-110">
        {icon}
      </div>
      <span className="text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        {label}
      </span>
    </Link>
  );
}