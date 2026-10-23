import { useEffect, useState } from 'react';
import { UserPlus, Trash2, Copy, Check } from 'lucide-react';
import api from '../api';

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const ROLE_LABEL = {
  owner: 'Владелец',
  brewer: 'Пивовар',
  viewer: 'Наблюдатель',
};

export default function TeamPage({ currentUser }) {
  const [team, setTeam] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const isOwner = currentUser?.role === 'owner';

  async function load() {
    try {
      setError(null);
      const teamRes = await api.get('/team');
      setTeam(teamRes.data);

      if (isOwner) {
        const invRes = await api.get('/team/invitations');
        setInvitations(invRes.data.filter((i) => !i.used));
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Не удалось загрузить команду');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreateInvite(role) {
    setCreating(true);
    try {
      await api.post('/team/invite', { role });
      await load();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Не удалось создать приглашение');
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteInvite(id) {
    if (!confirm('Отменить приглашение?')) return;
    try {
      await api.delete(`/team/invitations/${id}`);
      await load();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Не удалось удалить приглашение');
    }
  }

  async function handleRemoveMember(id, name) {
    if (!confirm(`Удалить сотрудника «${name}»? Его доступ будет отозван.`)) return;
    try {
      await api.delete(`/team/${id}`);
      await load();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Не удалось удалить сотрудника');
    }
  }

  function copyCode(code) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="bg-white border border-brew-border rounded-lg p-10 text-center text-gray-400">
          Загрузка команды...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-brew-navy">Команда</h1>
        <p className="text-xs text-gray-500 mt-1">
          {isOwner
            ? 'Управляйте сотрудниками и приглашениями'
            : 'Состав вашей пивоварни'}
        </p>
      </div>

      {error && (
        <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      {/* Список команды */}
      <div className="bg-white border border-brew-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-brew-border bg-gray-50">
          <span className="text-xs font-semibold text-brew-navy">
            Сотрудники ({team.length})
          </span>
        </div>
        <div>
          {team.map((member) => {
            const isSelf = member.id === currentUser.id;
            return (
              <div
                key={member.id}
                className="px-4 py-3 flex items-center gap-3 border-b border-brew-border last:border-b-0"
              >
                <div className="w-9 h-9 rounded-full bg-brew-navy text-white text-xs flex items-center justify-center font-medium flex-shrink-0">
                  {getInitials(member.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-brew-navy font-medium truncate">
                    {member.name}
                    {isSelf && (
                      <span className="text-xs text-gray-400 ml-2">(вы)</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {member.email}
                  </div>
                </div>
                <span
                  className={`text-[11px] px-2 py-1 rounded-full font-medium ${
                    member.role === 'owner'
                      ? 'bg-brew-orange/10 text-brew-orange'
                      : member.role === 'brewer'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {ROLE_LABEL[member.role] || member.role}
                </span>
                {isOwner && !isSelf && member.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(member.id, member.name)}
                    title="Удалить сотрудника"
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Приглашения — только владельцу */}
      {isOwner && (
        <div className="bg-white border border-brew-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-brew-border bg-gray-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-brew-navy">
              Активные приглашения ({invitations.length})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCreateInvite('brewer')}
                disabled={creating}
                className="px-3 h-8 rounded bg-brew-orange text-white text-xs font-medium hover:bg-orange-600 disabled:opacity-60 flex items-center gap-1"
              >
                <UserPlus className="w-3 h-3" />
                Пригласить пивовара
              </button>
              <button
                onClick={() => handleCreateInvite('viewer')}
                disabled={creating}
                className="px-3 h-8 rounded border border-brew-border bg-white text-brew-navy text-xs font-medium hover:bg-gray-50 disabled:opacity-60 flex items-center gap-1"
              >
                <UserPlus className="w-3 h-3" />
                Пригласить наблюдателя
              </button>
            </div>
          </div>

          {invitations.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-gray-400">
              Нет активных приглашений
            </div>
          ) : (
            <div>
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="px-4 py-3 flex items-center gap-3 border-b border-brew-border last:border-b-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-brew-navy tracking-widest font-medium">
                        {inv.code}
                      </span>
                      <button
                        onClick={() => copyCode(inv.code)}
                        title="Скопировать код"
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-brew-navy"
                      >
                        {copiedCode === inv.code ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1">
                      Роль: {ROLE_LABEL[inv.role] || inv.role} • Истекает:{' '}
                      {new Date(inv.expires_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteInvite(inv.id)}
                    title="Отменить приглашение"
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="px-4 py-3 bg-gray-50 border-t border-brew-border text-[11px] text-gray-500">
            Отправь сотруднику код. Он введёт его при регистрации, чтобы присоединиться к твоей команде. Срок действия кода — 7 дней.
          </div>
        </div>
      )}
    </div>
  );
}   