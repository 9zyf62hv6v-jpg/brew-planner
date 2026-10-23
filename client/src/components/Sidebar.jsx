import {
  Home,
  Building2,
  Users,
  ListTodo,
  Beer,
  Activity,
  Wrench,
  Calendar,
  Package,
  HelpCircle,
  Settings,
  LogOut,
} from 'lucide-react';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function Sidebar({ user, onLogout, page, onNavigate, onOpenModal }) {
  const iconClass = 'w-5 h-5 text-gray-500';
  const initials = getInitials(user?.name);
  const isOwner = user?.role === 'owner';

  return (
    <aside className="w-14 bg-white border-r border-brew-border flex flex-col items-center py-3 flex-shrink-0">
      <div className="w-9 h-9 bg-brew-orange rounded-md flex items-center justify-center mb-4">
        <span className="text-white text-xs font-bold">BC</span>
      </div>

      <nav className="flex flex-col items-center gap-1 flex-1 overflow-y-auto w-full pb-1">
        <SidebarButton
          title="Главная"
          active={page === 'dashboard'}
          onClick={() => onNavigate('dashboard')}
        >
          <Home className={iconClass} />
        </SidebarButton>
        
        <SidebarButton
          title="Планировщик"
          active={page === 'gantt'}
          onClick={() => onNavigate('gantt')}
        >
          <Building2 className={iconClass} />
        </SidebarButton>

        <SidebarButton
          title="Команда"
          active={page === 'team'}
          onClick={() => onNavigate('team')}
          dataTour="sidebar-team"
        >
          <Users className={iconClass} />
        </SidebarButton>

        <SidebarButton
          title="Рецепты"
          active={page === 'recipes'}
          onClick={() => onNavigate('recipes')}
          dataTour="sidebar-recipes"
        >
          <Beer className={iconClass} />
        </SidebarButton>

        <SidebarButton
          title="Журнал показаний"
          active={page === 'journal'}
          onClick={() => onNavigate('journal')}
          dataTour="sidebar-journal"
        >
          <Activity className={iconClass} />
        </SidebarButton>

        <SidebarButton
          title="Инструменты"
          active={page === 'tools'}
          onClick={() => onNavigate('tools')}
          dataTour="sidebar-tools"
        >
          <Wrench className={iconClass} />
        </SidebarButton>

        <SidebarButton
          title="Календарь"
          active={page === 'calendar'}
          onClick={() => onNavigate('calendar')}
          dataTour="sidebar-calendar"
        >
          <Calendar className={iconClass} />
        </SidebarButton>

        <SidebarButton
          title="Задачи"
          active={page === 'tasks'}
          onClick={() => onNavigate('tasks')}
          dataTour="sidebar-tasks"
        >
          <ListTodo className={iconClass} />
        </SidebarButton>

        <SidebarButton
          title="Продукция"
          active={page === 'products'}
          onClick={() => onNavigate('products')}
          dataTour="sidebar-products"
        >
          <Package className={iconClass} />
        </SidebarButton>
      </nav>

      <div className="flex flex-col items-center gap-1 pt-1 border-t border-brew-border w-full">
        <SidebarButton title="Помощь" onClick={() => onOpenModal('help')} dataTour="sidebar-help">
          <HelpCircle className={iconClass} />
        </SidebarButton>
        <SidebarButton title="Настройки" onClick={() => onOpenModal('settings')}>
          <Settings className={iconClass} />
        </SidebarButton>

        <button
          onClick={() => onNavigate('profile')}
          title={`${user?.name || ''} (${isOwner ? 'владелец' : user?.role === 'brewer' ? 'пивовар' : 'наблюдатель'}) · Профиль`}
          className={`w-8 h-8 rounded-full text-white text-xs flex items-center justify-center mt-2 font-medium transition-all ${
            page === 'profile'
              ? 'bg-brew-orange ring-2 ring-brew-orange/30'
              : 'bg-brew-navy hover:bg-brew-orange'
          }`}
        >
          {initials}
        </button>

        <button
          onClick={onLogout}
          title="Выйти"
          className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors mt-1"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}

function SidebarButton({ children, title, active, onClick, dataTour }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      data-tour={dataTour}
      className={`w-9 h-9 flex items-center justify-center rounded-md transition-colors ${
        active ? 'bg-brew-orange/10 text-brew-orange' : 'hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}