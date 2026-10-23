import Modal from './Modal';

export default function SettingsModal({ user, settings, onSettingsChange, onClose }) {
  const { theme, zoom, viewMode, density } = settings;

  function update(field, value) {
    onSettingsChange({ ...settings, [field]: value });
  }

  return (
    <Modal title="Настройки" onClose={onClose} width="md">
      <div className="space-y-5">
        {/* Профиль */}
        <div>
          <div className="text-xs font-semibold text-brew-navy mb-2">Профиль</div>
          <div className="bg-gray-50 rounded border border-brew-border p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Имя:</span>
              <span className="text-brew-navy font-medium">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email:</span>
              <span className="text-brew-navy">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Роль:</span>
              <span className="text-brew-navy">
                {user?.role === 'owner' ? 'Владелец' : user?.role === 'brewer' ? 'Пивовар' : 'Наблюдатель'}
              </span>
            </div>
          </div>
        </div>

        {/* Внешний вид */}
        <div>
          <div className="text-xs font-semibold text-brew-navy mb-2">Внешний вид</div>

          <div className="space-y-3">
            <SettingRow label="Тема">
              <div className="flex bg-gray-100 rounded p-0.5">
                <SmallButton active={theme === 'light'} onClick={() => update('theme', 'light')}>
                  Светлая
                </SmallButton>
                <SmallButton active={theme === 'dark'} onClick={() => update('theme', 'dark')}>
                  Тёмная
                </SmallButton>
              </div>
            </SettingRow>

            <SettingRow label="Вид диаграммы">
              <div className="flex bg-gray-100 rounded p-0.5">
                <SmallButton active={viewMode === 'weeks'} onClick={() => update('viewMode', 'weeks')}>
                  Недели
                </SmallButton>
                <SmallButton active={viewMode === 'days'} onClick={() => update('viewMode', 'days')}>
                  Дни
                </SmallButton>
              </div>
            </SettingRow>

            <SettingRow label="Плотность">
              <div className="flex bg-gray-100 rounded p-0.5">
                <SmallButton active={density === 'full'} onClick={() => update('density', 'full')}>
                  Полный
                </SmallButton>
                <SmallButton active={density === 'compact'} onClick={() => update('density', 'compact')}>
                  Компакт
                </SmallButton>
              </div>
            </SettingRow>

            <SettingRow label="Масштаб">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.25"
                  value={zoom}
                  onChange={(e) => update('zoom', Number(e.target.value))}
                  className="w-40 accent-brew-orange"
                />
                <span className="text-xs text-gray-500 w-12">{Math.round(zoom * 100)}%</span>
              </div>
            </SettingRow>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function SettingRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-600">{label}</span>
      {children}
    </div>
  );
}

function SmallButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 h-7 rounded text-xs font-medium transition-colors ${
        active ? 'bg-white text-brew-navy shadow-sm' : 'text-gray-500 hover:text-brew-navy'
      }`}
    >
      {children}
    </button>
  );
}