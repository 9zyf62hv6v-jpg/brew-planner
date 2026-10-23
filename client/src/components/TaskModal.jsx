import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import api from '../api';

export default function TaskModal({ mode, initial, onClose, onSaved, isMobile, currentUser }) {
  const isEdit = mode === 'edit';
  const canDelete = currentUser?.role === 'owner' || currentUser?.role === 'brewer';

  const [team, setTeam] = useState([]);
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    priority: initial?.priority || 'normal',
    due_date: initial?.due_date ? String(initial.due_date).slice(0, 10) : '',
    batch_id: initial?.batch_id || '',
    assigned_to: initial?.assigned_to || '',
    status: initial?.status || 'todo',
  });

  useEffect(() => {
    async function load() {
      try {
        const [teamRes, batchesRes] = await Promise.all([
          api.get('/team'),
          api.get('/batches'),
        ]);
        setTeam(teamRes.data);
        setBatches(batchesRes.data);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError('Название задачи обязательно');
      return;
    }

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description || null,
      priority: form.priority,
      due_date: form.due_date || null,
      batch_id: form.batch_id ? Number(form.batch_id) : null,
      assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
      status: form.status,
    };

    try {
      if (isEdit) {
        await api.put(`/tasks/${initial.id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Не удалось сохранить задачу');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Удалить эту задачу?')) return;
    setError(null);
    setDeleting(true);
    try {
      await api.delete(`/tasks/${initial.id}`);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Не удалось удалить задачу');
    } finally {
      setDeleting(false);
    }
  }

  const modalWidth = isMobile
    ? 'w-full max-w-full h-full max-h-full rounded-none'
    : 'w-[520px] max-w-full max-h-[90vh] rounded-lg';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className={`bg-white shadow-xl flex flex-col ${modalWidth}`}>
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-brew-border flex-shrink-0">
          <h2 className="text-sm font-semibold text-brew-navy">
            {isEdit ? 'Редактировать задачу' : 'Новая задача'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          <Field label="Название *">
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full h-10 px-2 rounded border border-brew-border text-sm"
              placeholder="Например: Помыть ЦКТ-05"
              required
              maxLength={200}
              autoFocus
            />
          </Field>

          <Field label="Описание">
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-2 py-2 rounded border border-brew-border text-sm resize-none"
              rows={3}
              placeholder="Детали задачи..."
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Приоритет">
              <select
                value={form.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full h-10 px-2 rounded border border-brew-border text-sm"
              >
                <option value="low">Низкий</option>
                <option value="normal">Обычный</option>
                <option value="high">Высокий</option>
              </select>
            </Field>

            <Field label="Срок">
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
                className="w-full h-10 px-2 rounded border border-brew-border text-sm"
              />
            </Field>
          </div>

          <Field label="Назначить сотруднику">
            <select
              value={form.assigned_to}
              onChange={(e) => handleChange('assigned_to', e.target.value)}
              className="w-full h-10 px-2 rounded border border-brew-border text-sm"
            >
              <option value="">— Не назначено —</option>
              {team.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role === 'owner' ? 'владелец' : u.role === 'brewer' ? 'пивовар' : 'наблюдатель'})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Привязать к варке (опц.)">
            <select
              value={form.batch_id}
              onChange={(e) => handleChange('batch_id', e.target.value)}
              className="w-full h-10 px-2 rounded border border-brew-border text-sm"
            >
              <option value="">— Не привязана —</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.recipe_name} · {b.tank_name} · недели {b.start_week}–{b.end_week}
                </option>
              ))}
            </select>
          </Field>

          {isEdit && (
            <Field label="Статус">
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full h-10 px-2 rounded border border-brew-border text-sm"
              >
                <option value="todo">Активная</option>
                <option value="done">Выполнено</option>
              </select>
            </Field>
          )}

          {error && (
            <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}
        </form>

        <div className="px-4 sm:px-5 py-3 border-t border-brew-border flex justify-between gap-2 flex-shrink-0 bg-white">
          {isEdit && canDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 h-10 rounded border border-red-300 text-red-500 text-sm hover:bg-red-50 disabled:opacity-60 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              <span className={isMobile ? 'sr-only' : ''}>
                {deleting ? 'Удаляем...' : 'Удалить'}
              </span>
            </button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 rounded border border-brew-border text-sm text-brew-navy hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 h-10 rounded bg-brew-orange text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-60"
            >
              {saving ? 'Сохраняем...' : isEdit ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs text-gray-500 mb-1">{label}</span>
      {children}
    </label>
  );
}