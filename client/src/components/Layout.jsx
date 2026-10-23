import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Header from './Header';

export default function Layout({
  children,
  user,
  onLogout,
  page,
  onNavigate,
  onOpenModal,
  headerProps,
  isMobile = false,
}) {
  return (
    <div className="h-screen flex flex-col md:flex-row bg-brew-bg overflow-hidden">
      {/* Сайдбар только на десктопе */}
      {!isMobile && (
        <Sidebar
          user={user}
          onLogout={onLogout}
          page={page}
          onNavigate={onNavigate}
          onOpenModal={onOpenModal}
        />
      )}

      {/* Основной контент */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {page === 'gantt' && (
          <Header
            user={user}
            onOpenModal={onOpenModal}
            {...headerProps}
            isMobile={isMobile}
          />
        )}
        <main className="flex-1 overflow-auto min-h-0">{children}</main>
      </div>

      {/* Нижняя навигация только на телефоне */}
      {isMobile && (
        <MobileNav
          user={user}
          page={page}
          onNavigate={onNavigate}
          onOpenModal={onOpenModal}
          onLogout={onLogout}
        />
      )}
    </div>
  );
}