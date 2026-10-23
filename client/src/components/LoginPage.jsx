import { useState } from 'react';
import api, { setToken } from '../api';

export default function LoginPage({ onLogin, onBack }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    invite_code: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : {
              email: form.email,
              password: form.password,
              name: form.name,
              invite_code: form.invite_code.trim() || undefined,
            };

      const res = await api.post(endpoint, payload);
      setToken(res.data.token);
      onLogin(res.data.user);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || 'Что-то пошло не так. Попробуй ещё раз.'
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brew-bg relative">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 text-xs text-gray-500 hover:text-brew-orange transition-colors flex items-center gap-1"
    >
          ← На главную
    </button>
      <div className="bg-white rounded-xl shadow-sm border border-brew-border w-full max-w-md overflow-hidden">
        <div className="p-6 pb-4 text-center border-b border-brew-border">
          <div className="w-14 h-14 bg-brew-orange rounded-lg flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-lg font-bold">BC</span>
          </div>
          <h1 className="text-xl font-bold text-brew-navy">Brew Clone</h1>
          <p className="text-xs text-gray-500 mt-1">Планировщик пивоварни</p>
        </div>

        <div className="p-1 flex bg-gray-100 mx-6 mt-4 rounded-md">
          <button
            type="button"
            onClick={() => mode !== 'login' && switchMode()}
            className={`flex-1 h-8 rounded text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'bg-white text-brew-navy shadow-sm'
                : 'text-gray-500 hover:text-brew-navy'
            }`}
          >
            Вход
          </button>
          <button
            type="button"
            onClick={() => mode !== 'register' && switchMode()}
            className={`flex-1 h-8 rounded text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'bg-white text-brew-navy shadow-sm'
                : 'text-gray-500 hover:text-brew-navy'
            }`}
          >
            Регистрация
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3">
          {mode === 'register' && (
            <>
              <label className="block">
                <span className="block text-xs text-gray-500 mb-1">Имя</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full h-10 px-3 rounded border border-brew-border text-sm outline-none focus:border-brew-orange"
                  placeholder="Иван Пивоваров"
                  required
                />
              </label>

              <label className="block">
                <span className="block text-xs text-gray-500 mb-1">
                  Код приглашения{' '}
                  <span className="text-gray-400">(если есть)</span>
                </span>
                <input
                  type="text"
                  value={form.invite_code}
                  onChange={(e) =>
                    handleChange('invite_code', e.target.value.toUpperCase())
                  }
                  className="w-full h-10 px-3 rounded border border-brew-border text-sm outline-none focus:border-brew-orange font-mono tracking-wider"
                  placeholder="ABC123XY"
                  maxLength={8}
                />
                <span className="block text-[11px] text-gray-400 mt-1">
                  Без кода — создашь свою пивоварню. С кодом — присоединишься к команде.
                </span>
              </label>
            </>
          )}

          <label className="block">
            <span className="block text-xs text-gray-500 mb-1">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full h-10 px-3 rounded border border-brew-border text-sm outline-none focus:border-brew-orange"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="block">
            <span className="block text-xs text-gray-500 mb-1">Пароль</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="w-full h-10 px-3 rounded border border-brew-border text-sm outline-none focus:border-brew-orange"
              placeholder="Минимум 6 символов"
              required
              minLength={6}
            />
          </label>

          {error && (
            <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded bg-brew-orange text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-60 transition-colors"
          >
            {loading
              ? 'Подожди...'
              : mode === 'login'
              ? 'Войти'
              : 'Создать аккаунт'}
          </button>
        </form>

        <div className="px-6 pb-6 text-center text-[11px] text-gray-400">
          {mode === 'login' ? (
            <>
              Нет аккаунта?{' '}
              <button
                onClick={switchMode}
                className="text-brew-orange hover:underline"
                type="button"
              >
                Зарегистрируйся
              </button>
            </>
          ) : (
            <>
              Уже есть аккаунт?{' '}
              <button
                onClick={switchMode}
                className="text-brew-orange hover:underline"
                type="button"
              >
                Войти
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}   