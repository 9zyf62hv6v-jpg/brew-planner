import { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Gantt from './components/Gantt';
import BatchModal from './components/BatchModal';
import LoginPage from './components/LoginPage';
import TeamPage from './components/TeamPage';
import RecipesPage from './components/RecipesPage';   // 👈 НОВОЕ
import JournalPage from './components/JournalPage';
import TasksPage from './components/TasksPage';
import ToolsPage from './components/ToolsPage';
import CalendarPage from './components/CalendarPage';
import ProductsPage from './components/ProductsPage';
import ProfilePage from './components/ProfilePage'; 
import FilterModal from './components/FilterModal';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import OnboardingTour from './components/onboarding/OnboardingTour';
import api, { getToken, clearToken, setToken } from './api';
import LandingPage from './components/LandingPage';
import DashboardPage from './components/DashboardPage';

const SETTINGS_KEY = 'brewclone_settings';
const FILTER_KEY = 'brewclone_filter';

const DEFAULT_SETTINGS = {
  theme: 'light',
  zoom: 1,
  viewMode: 'weeks',
  density: 'compact',
  displayMode: 'batches',
};

const DEFAULT_FILTER = {
  statuses: [],
  recipeIds: [],
  tankIds: [],
};

function loadLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch (e) {
    return fallback;
  }
}



function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [page, setPage] = useState('dashboard');
  const [modalState, setModalState] = useState({ open: false, brew: null });
  const [activeModal, setActiveModal] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
    // 👇 НОВОЕ: 'landing' | 'login'
  const [authView, setAuthView] = useState('landing');
  const [settings, setSettings] = useState(() => loadLocal(SETTINGS_KEY, DEFAULT_SETTINGS));
  const [filter, setFilter] = useState(() => loadLocal(FILTER_KEY, DEFAULT_FILTER));

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(FILTER_KEY, JSON.stringify(filter));
  }, [filter]);

  useEffect(() => {
    async function checkAuth() {
      const token = getToken();
      if (!token) {
        setAuthChecking(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (err) {
        console.error('Ошибка проверки токена:', err);
        clearToken();
      } finally {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, []);

  const refresh = useCallback(() => setReloadKey((k) => k + 1), []);
  const handleAddClick = useCallback(() => setModalState({ open: true, brew: null }), []);
  const handleBrewClick = useCallback((brew) => { setModalState({ open: true, brew }); }, []);
  const handleClose = useCallback(() => setModalState({ open: false, brew: null }), []);

  const handleLogin = useCallback((userData) => {
    setUser(userData);
    setPage('dashboard');
    setPage('gantt');
    setReloadKey((k) => k + 1);
    setAuthView('landing');
  }, []);
  // 👇 НОВОЕ: демо-вход
const handleDemo = useCallback(async () => {
  try {
    const res = await api.post('/auth/demo');
    setToken(res.data.token);
    setUser(res.data.user);
    setPage('dashboard');
    setReloadKey((k) => k + 1);
    setAuthView('landing');
  } catch (err) {
    console.error('Ошибка демо-входа:', err);
    alert('Не удалось запустить демо. Попробуй ещё раз.');
  }
}, []);
  const handleUserUpdated = useCallback((updatedUser) => {
    setUser((prev) => ({ ...prev, ...updatedUser }));
  }, []);
  const handleLogout = useCallback(() => {
    clearToken();
    setUser(null);
    setPage('gantt');
    setModalState({ open: false, brew: null });
    setAuthView('landing');
  }, []);

  const handleZoomIn = useCallback(() => {
    setSettings((s) => ({ ...s, zoom: Math.min(2, Number((s.zoom + 0.25).toFixed(2))) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setSettings((s) => ({ ...s, zoom: Math.max(0.5, Number((s.zoom - 0.25).toFixed(2))) }));
  }, []);

  const handleThemeToggle = useCallback(() => {
    setSettings((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  const handleViewModeChange = useCallback((viewMode) => {
    setSettings((s) => ({ ...s, viewMode }));
  }, []);

  const handleDensityChange = useCallback((density) => {
    setSettings((s) => ({ ...s, density }));
  }, []);

  const handleDisplayModeChange = useCallback((displayMode) => {
    setSettings((s) => ({ ...s, displayMode }));
  }, []);

  const handleOpenModal = useCallback((name) => setActiveModal(name), []);
  const handleCloseModal = useCallback(() => setActiveModal(null), []);

  const canEdit = user?.role === 'owner' || user?.role === 'brewer';
  const hasFilter = filter.statuses.length > 0 || filter.recipeIds.length > 0 || filter.tankIds.length > 0;

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brew-bg">
        <span className="text-sm text-gray-400">Загрузка...</span>
      </div>
    );
  }

    if (!user) {
    // Не залогинен — показываем лендинг или логин
    if (authView === 'login') {
      return (
        <LoginPage
          onLogin={handleLogin}
          onBack={() => setAuthView('landing')}
        />
      );
    }
    return (
      <LandingPage
        onLogin={() => setAuthView('login')}
        onRegister={() => setAuthView('login')}
        onDemo={handleDemo}
      />
    );
  }

  const headerProps = {
    onAddClick: handleAddClick,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    zoom: settings.zoom,
    viewMode: settings.viewMode,
    onViewModeChange: handleViewModeChange,
    density: settings.density,
    onDensityChange: handleDensityChange,
    displayMode: settings.displayMode,
    onDisplayModeChange: handleDisplayModeChange,
    theme: settings.theme,
    onThemeToggle: handleThemeToggle,
    hasFilter,
    onNavigate: setPage,
  };

  return (
    <>
      <Layout
        user={user}
        onLogout={handleLogout}
        page={page}
        onNavigate={setPage}
        onOpenModal={handleOpenModal}
        headerProps={headerProps}
        isMobile={isMobile}
      >
        {page === 'dashboard' && (
         <DashboardPage
           user={user}
           onNavigate={setPage}
           isMobile={isMobile}
         />
        )} 
        {page === 'gantt' && (
          <div data-tour="gantt" className="h-full">
            <Gantt
              reloadKey={reloadKey}
              onBrewClick={canEdit ? handleBrewClick : () => {}}
              onChanged={refresh}
              canEdit={canEdit}
              zoom={settings.zoom}
              viewMode={settings.viewMode}
              density={settings.density}
              displayMode={settings.displayMode}
              filter={filter}
              isMobile={isMobile}
            />
          </div>
        )}
        {page === 'team' && <TeamPage currentUser={user} />}
        {page === 'recipes' && <RecipesPage user={user} isMobile={isMobile} />}
        {page === 'journal' && <JournalPage user={user} isMobile={isMobile} />}
        {page === 'tasks' && <TasksPage user={user} isMobile={isMobile} />}
        {page === 'tools' && <ToolsPage isMobile={isMobile} />}
        {page === 'calendar' && (
          <CalendarPage
            user={user}
            isMobile={isMobile}
            onBrewClick={canEdit ? handleBrewClick : () => {}}
         />
       )}
        {page === 'products' && <ProductsPage user={user} isMobile={isMobile} />}
        {page === 'profile' && (
          <ProfilePage
            user={user}
            onUserUpdated={handleUserUpdated}
            isMobile={isMobile}
         />
       )}
      </Layout>

      {modalState.open && canEdit && (
        <BatchModal
          mode={modalState.brew ? 'edit' : 'add'}
          initial={modalState.brew}
          onClose={handleClose}
          onSaved={refresh}
          user={user}
          isMobile={isMobile}
        />
      )}

      {activeModal === 'filter' && (
        <FilterModal
          initial={filter}
          onApply={setFilter}
          onClose={handleCloseModal}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          user={user}
          settings={settings}
          onSettingsChange={setSettings}
          onClose={handleCloseModal}
        />
      )}

      {activeModal === 'help' && <HelpModal onClose={handleCloseModal} />}


      <OnboardingTour user={user} onHelp={() => handleOpenModal('help')} />
    </>
  );
}

export default App;