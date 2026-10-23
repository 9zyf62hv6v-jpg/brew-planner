import {
  Home  ,
  Activity,
  Beer,
  Settings,
  User,
  LogOut,
} from 'lucide-react';

export default function MobileNav({
  user,
  page,
  onNavigate,
  onOpenModal,
  onLogout,
}) {
  const iconClass = 'w-5 h-5';

  return (
    <nav className="h-16 bg-white border-t border-brew-border flex items-stretch justify-around flex-shrink-0 safe-bottom">
      <NavButton
        title="Главная"
        active={page === 'dashboard'}
        onClick={() => onNavigate('dashboard')}
      >
        <Home className={iconClass} />
      </NavButton>
      
      <NavButton
        title="Планировщик"
        active={page === 'gantt'}
        onClick={() => onNavigate('gantt')}
      >
        <Building2 className={iconClass} />
      </NavButton>

      <NavButton
        title="Рецепты"
        active={page === 'recipes'}
        onClick={() => onNavigate('recipes')}
      >
        <Beer className={iconClass} />
      </NavButton>

      <NavButton
        title="Журнал"
        active={page === 'journal'}
        onClick={() => onNavigate('journal')}
      >
        <Activity className={iconClass} />
      </NavButton>

      <NavButton title="Настройки" onClick={() => onOpenModal('settings')}>
        <Settings className={iconClass} />
      </NavButton>

      <NavButton
        title="Профиль"
        active={page === 'profile'}
        onClick={() => onNavigate('profile')}
      >
        <User className={iconClass} />
      </NavButton>

      <NavButton title="Выйти" onClick={onLogout} danger>
        <LogOut className={iconClass} />
      </NavButton>
    </nav>
  );
}

function NavButton({ children, title, active, onClick, danger }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
        danger
          ? 'text-gray-400 active:bg-red-50 active:text-red-500'
          : active
          ? 'text-brew-orange bg-brew-orange/5'
          : 'text-gray-500 active:bg-gray-100'
      }`}
    >
      {children}
      <span className="text-[10px] leading-none">{title}</span>
    </button>
  );
}