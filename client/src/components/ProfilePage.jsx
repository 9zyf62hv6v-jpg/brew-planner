import { useState } from 'react';
import {
  User, Mail, Shield, KeyRound, Save, Check, AlertCircle, Eye, EyeOff,
} from 'lucide-react';
import api, { setToken } from '../api';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const ROLE_LABELS = {
  owner: { label: 'Владелец', color: 'bg-brew-orange/10 text-brew-orange' },
  brewer: { label: 'Пивовар', color: 'bg-blue-50 text-blue-600' },
  viewer: { label: 'Наблюдатель', color: 'bg-gray-100 text-gray-600' },
};

export default function ProfilePage({ user, onUserUpdated, isMobile = false }) {
  const [name, setName] = useState(user?.name || '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameMessage, setNameMessage] = useState(null);

  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState(null);

  const roleInfo = ROLE_LABELS[user?.role] || ROLE_LABELS.viewer;

  async function handleNameSubmit(e) {
    e.preventDefault();
    setNameMessage(null);

    if (!name.trim()) {
      setNameMessage({ type: 'error', text: 'Имя не может быть пустым' });
      return;
    }
    if (name.trim() === user?.name) {
      setNameMessage({ type: 'info', text: 'Имя не изменилось' });
      return;
    }

    setNameSaving(true);
    try {
      const res = await api.put('/auth/me', { name: name.trim() });
      setNameMessage({ type: 'success', text: 'Имя обновлено' });
      if (onUserUpdated) onUserUpdated(res.data);
    } catch (err) {
      console.error(err);
      setNameMessage({ type: 'error', text: err.response?.data?.error || 'Не удалось сохранить' });
    } finally {
      setNameSaving(false);
      setTimeout(() => setNameMessage(null), 3000);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwMessage(null);

    if (!passwords.current_password || !passwords.new_password) {
      setPwMessage({ type: 'error', text: 'Заполни все поля' });
      return;
    }
    if (passwords.new_password.length < 6) {
      setPwMessage({ type: 'error', text: 'Новый пароль минимум 6 символов' });
      return;
    }
    if (passwords.new_password !== passwords.confirm_password) {
      setPwMessage({ type: 'error', text: 'Пароли не совпадают' });
      return;
    }

    setPwSaving(true);
    try {
      await api.put('/auth/password', {
        current_password: passwords.current_password,
        new_password: passwords.new_password,
      });
      setPwMessage({ type: 'success', text: 'Пароль обновлён' });
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      console.error(err);
      setPwMessage({ type: 'error', text: err.response?.data?.error || 'Не удалось сменить пароль' });
    } finally {
      setPwSaving(false);
      setTimeout(() => setPwMessage(null), 4000);
    }
  }

  return (
    <div className="p-3 sm:p-6 max-w-3xl">
      <h1 className="text-base sm:text-lg font-semibold text-brew-navy mb-4">
        Мой профиль
      </h1>

      {/* Карточка с информацией */}
      <div className="bg-white border border-brew-border rounded-lg p-4 sm:p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brew-navy text-white text-xl font-semibold flex items-center justify-center flex-shrink-0">
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0">
            <div className="text-base font-semibold text-brew-navy truncate">
              {user?.name}
            </div>
            <div className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3" />
              {user?.email}
            </div>
            <div className="mt-1.5">
              <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${roleInfo.color}`}>
                <Shield className="w-2.5 h-2.5 inline mr-0.5" />
                {roleInfo.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Форма имени */}
      <form
        onSubmit={handleNameSubmit}
        className="bg-white border border-brew-border rounded-lg p-4 sm:p-5 mb-4"
      >
        <h2 className="text-xs font-semibold text-brew-orange uppercase mb-3 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          Имя
        </h2>

        <label className="block mb-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-3 rounded border border-brew-border text-sm"
            placeholder="Как тебя зовут?"
            maxLength={100}
          />
        </label>

        {nameMessage && (
          <Message type={nameMessage.type} text={nameMessage.text} />
        )}

        <button
          type="submit"
          disabled={nameSaving || name.trim() === user?.name}
          className="h-10 px-4 rounded-md bg-brew-orange text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {nameSaving ? 'Сохраняем...' : 'Сохранить имя'}
        </button>
      </form>

      {/* Форма пароля */}
      <form
        onSubmit={handlePasswordSubmit}
        className="bg-white border border-brew-border rounded-lg p-4 sm:p-5 mb-4"
      >
        <h2 className="text-xs font-semibold text-brew-orange uppercase mb-3 flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5" />
          Смена пароля
        </h2>

        <div className="space-y-3 mb-3">
          <PasswordField
            label="Текущий пароль"
            value={passwords.current_password}
            onChange={(v) => setPasswords((p) => ({ ...p, current_password: v }))}
            show={showCurrent}
            onToggleShow={() => setShowCurrent((s) => !s)}
          />
          <PasswordField
            label="Новый пароль (минимум 6 символов)"
            value={passwords.new_password}
            onChange={(v) => setPasswords((p) => ({ ...p, new_password: v }))}
            show={showNew}
            onToggleShow={() => setShowNew((s) => !s)}
          />
          <PasswordField
            label="Подтверждение нового пароля"
            value={passwords.confirm_password}
            onChange={(v) => setPasswords((p) => ({ ...p, confirm_password: v }))}
            show={showNew}
            onToggleShow={() => setShowNew((s) => !s)}
          />
        </div>

        {pwMessage && (
          <Message type={pwMessage.type} text={pwMessage.text} />
        )}

        <button
          type="submit"
          disabled={pwSaving || !passwords.current_password || !passwords.new_password}
          className="h-10 px-4 rounded-md bg-brew-orange text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <KeyRound className="w-4 h-4" />
          {pwSaving ? 'Меняем...' : 'Сменить пароль'}
        </button>

        <p className="text-[11px] text-gray-400 mt-3">
          После смены пароля все активные сессии (кроме текущей) продолжат работать
          до истечения JWT-токена. Если хочешь — можно выйти со всех устройств вручную.
        </p>
      </form>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggleShow }) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-500 mb-1">{label}</span>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 pl-3 pr-10 rounded border border-brew-border text-sm"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-gray-400"
          title={show ? 'Скрыть' : 'Показать'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </label>
  );
}

function Message({ type, text }) {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-600',
    info: 'bg-blue-50 border-blue-200 text-blue-600',
  };
  const Icon = type === 'success' ? Check : AlertCircle;
  return (
    <div className={`mb-3 text-xs border rounded px-3 py-2 flex items-center gap-2 ${styles[type] || styles.info}`}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      {text}
    </div>
  );
}