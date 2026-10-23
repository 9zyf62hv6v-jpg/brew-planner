import {
  Minus, Plus, BarChart3, ListTodo, Wrench, Calendar, Package,
  Filter, Undo2, Redo2, Settings, HelpCircle, Sun, Moon,
} from 'lucide-react';

export default function Header({
  onAddClick,
  user,
  onZoomIn,
  onZoomOut,
  zoom,
  viewMode,
  onViewModeChange,
  density,
  onDensityChange,
  displayMode,
  onDisplayModeChange,
  theme,
  onThemeToggle,
  onOpenModal,
  hasFilter,
  isMobile = false,
  onNavigate,
}) {
  const canEdit = user?.role === 'owner' || user?.role === 'brewer';

  return (
    <header className="bg-white border-b border-brew-border">
      {/* Версия — только на десктопе */}
      {!isMobile && (
        <div className="flex justify-end px-3 pt-1">
          <span className="text-[10px] text-gray-400">v2026.10.10-903-saas</span>
        </div>
      )}

      {/* Верхняя строка — основное управление */}
      <div className={`${isMobile ? 'px-2 pt-2 pb-2' : 'px-3 pb-2'} flex items-center gap-2 flex-wrap`}>
        {/* Дни/Недели */}
        <div className="flex items-center bg-gray-100 rounded-md p-0.5">
          <SegmentedButton
            active={viewMode === 'days'}
            onClick={() => onViewModeChange('days')}
          >
            Дни
          </SegmentedButton>
          <SegmentedButton
            active={viewMode === 'weeks'}
            onClick={() => onViewModeChange('weeks')}
          >
            Недели
          </SegmentedButton>
        </div>

        {/* Зум — на мобиле компактнее */}
        <div className="flex items-center">
          <IconButton onClick={onZoomOut} title="Уменьшить" compact={isMobile}>
            <Minus className="w-4 h-4" />
          </IconButton>
          <IconButton onClick={onZoomIn} title="Увеличить" compact={isMobile}>
            <Plus className="w-4 h-4" />
          </IconButton>
        </div>

        {/* Журнал — только на десктопе */}
        {!isMobile && (
          <BigButton onClick={() => onOpenModal('journal')}>
            <BarChart3 className="w-4 h-4" />
            Журнал показаний
          </BigButton>
        )}

        {/* Добавить — на мобиле только + */}
        {canEdit && (
          <button
            onClick={onAddClick}
            data-tour="header-add"
            className={`rounded-md border border-brew-border bg-white text-sm text-brew-navy hover:bg-gray-50 flex items-center gap-2 transition-colors ${
              isMobile ? 'h-9 w-9 justify-center' : 'px-4 h-9'
            }`}
            title={isMobile ? 'Добавить варку' : undefined}
          >
            <Plus className="w-4 h-4" />
            {!isMobile && 'Добавить'}
          </button>
        )}

        {/* Варки/Розливы */}
        <div
          className="flex items-center bg-brew-orange rounded-md p-0.5"
          data-tour="header-display-mode"
        >
          <SegmentedButtonOrange
            active={displayMode === 'batches'}
            onClick={() => onDisplayModeChange('batches')}
          >
            Варки
          </SegmentedButtonOrange>
          <SegmentedButtonOrange
            active={displayMode === 'bottling'}
            onClick={() => onDisplayModeChange('bottling')}
          >
            Розливы
          </SegmentedButtonOrange>
        </div>

        {/* Правый блок — иконки */}
        <div className="ml-auto flex items-center gap-1">
          {!isMobile && (
            <>
              <IconButton title="Отменить (скоро)" disabled>
                <Undo2 className="w-4 h-4" />
              </IconButton>
              <IconButton title="Повторить (скоро)" disabled>
                <Redo2 className="w-4 h-4" />
              </IconButton>
            </>
          )}
          <IconButton
            onClick={() => onOpenModal('filter')}
            title="Фильтр"
            highlight={hasFilter}
            dataTour="header-filter"
          >
            <Filter className="w-4 h-4" />
          </IconButton>
          {!isMobile && (
            <IconButton onClick={() => onOpenModal('settings')} title="Настройки">
              <Settings className="w-4 h-4" />
            </IconButton>
          )}
          {!isMobile && (
            <IconButton
              onClick={() => onOpenModal('help')}
              title="Помощь"
              dataTour="header-help"
            >
              <HelpCircle className="w-4 h-4" />
            </IconButton>
          )}
          <IconButton onClick={onThemeToggle} title="Переключить тему">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </IconButton>
        </div>
      </div>

      {/* Вторая строка — только на десктопе */}
      {!isMobile && (
        <div className="px-3 pb-2 flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-100 rounded-md p-0.5">
            <SegmentedButton
              active={density === 'full'}
              onClick={() => onDensityChange('full')}
            >
              Полный
            </SegmentedButton>
            <SegmentedButton
              active={density === 'compact'}
              onClick={() => onDensityChange('compact')}
            >
              Компакт
            </SegmentedButton>
          </div>

          <BigButton onClick={() => onNavigate('tasks')}>
            <ListTodo className="w-4 h-4" />
            Задачи
          </BigButton>
          <BigButton onClick={() => onNavigate('tools')}>
            <Wrench className="w-4 h-4" />
            Инструменты
          </BigButton>
          <BigButton onClick={() => onNavigate('calendar')}>
            <Calendar className="w-4 h-4" />
            Календарь
          </BigButton>
          <BigButton onClick={() => onNavigate('products')}>
            <Package className="w-4 h-4" />
            Продукция
          </BigButton>

          <div className="ml-auto flex items-center gap-1">
            <IconButton onClick={() => onNavigate('calendar')} title="Календарь">
              <Calendar className="w-4 h-4" />
            </IconButton>
          </div>
        </div>
      )}
    </header>
  );
}

function SegmentedButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 h-8 rounded text-sm font-medium transition-colors ${
        active
          ? 'bg-white text-brew-navy shadow-sm'
          : 'text-gray-500 hover:text-brew-navy'
      }`}
    >
      {children}
    </button>
  );
}

function SegmentedButtonOrange({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 h-8 rounded text-sm font-medium transition-colors ${
        active
          ? 'bg-white text-brew-orange shadow-sm'
          : 'text-white hover:bg-orange-600'
      }`}
    >
      {children}
    </button>
  );
}

function IconButton({ children, onClick, title, disabled, highlight, dataTour, compact }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      data-tour={dataTour}
      className={`${compact ? 'w-8 h-8' : 'w-9 h-9'} flex items-center justify-center rounded-md border transition-colors ${
        disabled
          ? 'border-brew-border bg-white text-gray-300 cursor-not-allowed'
          : highlight
          ? 'border-brew-orange bg-orange-50 text-brew-orange hover:bg-orange-100'
          : 'border-brew-border bg-white text-gray-500 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  );
}

function BigButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 h-9 rounded-md border border-brew-border bg-white text-sm text-brew-navy hover:bg-gray-50 flex items-center gap-2 transition-colors"
    >
      {children}
    </button>
  );
}