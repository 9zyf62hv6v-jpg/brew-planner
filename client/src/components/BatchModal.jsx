import { useState, useEffect } from 'react';
import { X, Trash2, Package } from 'lucide-react';
import api from '../api';

export default function BatchModal({ mode, initial, onClose, onSaved, user, isMobile = false }) {
  const isEdit = mode === 'edit';
  const canDelete = user?.role === 'owner';

  const [recipes, setRecipes] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    recipe_id: initial?.recipe_id || '',
    tank_id: initial?.tank_id || '',
    volume_l: initial?.volume_l ?? 5400,
    start_week: initial?.start_week ?? 42,
    end_week: initial?.end_week ?? 48,
    status: initial?.status || 'planned',
    bottling_week: initial?.bottling_week ?? '',
    bottling_volume_l: initial?.bottling_volume_l ?? '',
  });

  useEffect(() => {
    async function load() {
      const [r, t] = await Promise.all([api.get('/recipes'), api.get('/tanks')]);
      setRecipes(r.data);
      setTanks(t.data);
      if (!isEdit) {
        if (r.data.length) setForm((f) => ({ ...f, recipe_id: r.data[0].id }));
        if (t.data.length) setForm((f) => ({ ...f, tank_id: t.data[0].id }));
      }
    }
    load();
  }, [isEdit]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (form.bottling_week !== '' && form.bottling_week !== null) {
      const bw = Number(form.bottling_week);
      const ew = Number(form.end_week);
      if (bw < ew) {
        setError('Неделя розлива не может быть раньше недели конца варки');
        return;
      }
    }

    setSaving(true);

    const payload = {
      recipe_id: Number(form.recipe_id),
      tank_id: Number(form.tank_id),
      volume_l: Number(form.volume_l),
      start_week: Number(form.start_week),
      end_week: Number(form.end_week),
      status: form.status,
      bottling_week: form.bottling_week === '' || form.bottling_week === null ? null : Number(form.bottling_week),
      bottling_volume_l: form.bottling_volume_l === '' || form.bottling_volume_l === null ? null : Number(form.bottling_volume_l),
    };

    try {
      if (isEdit) {
        await api.put(`/batches/${initial.id}`, payload);
      } else {
        await api.post('/batches', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Не удалось сохранить варку');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Удалить эту варку?')) return;
    setError(null);
    setDeleting(true);
    try {
      await api.delete(`/batches/${initial.id}`);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Не удалось удалить варку');
    } finally {
      setDeleting(false);
    }
  }

  // На мобиле — почти fullscreen, на десктопе — фиксированная ширина
  const modalWidth = isMobile
    ? 'w-full max-w-full h-full max-h-full rounded-none'
    : 'w-[440px] max-w-full max-h-[90vh] rounded-lg';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className={`bg-white shadow-xl flex flex-col ${modalWidth}`}>
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-brew-border flex-shrink-0">
          <h2 className="text-sm font-semibold text-brew-navy">
            {isEdit ? 'Редактировать варку' : 'Новая варка'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          <Field label="Рецепт">
            <select
              value={form.recipe_id}
              onChange={(e) => handleChange('recipe_id', e.target.value)}
              className="w-full h-10 px-2 rounded border border-brew-border text-sm"
            >
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.style})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Танк">
            <select
              value={form.tank_id}
              onChange={(e) => handleChange('tank_id', e.target.value)}
              className="w-full h-10 px-2 rounded border border-brew-border text-sm"
            >
              {tanks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.volume_hl} гл
                </option>
              ))}
            </select>
          </Field>

          <Field label="Объём, л">
            <input
              type="number"
              value={form.volume_l}
              onChange={(e) => handleChange('volume_l', e.target.value)}
              className="w-full h-10 px-2 rounded border border-brew-border text-sm"
              required
              min="1"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Неделя начала">
              <input
                type="number"
                value={form.start_week}
                onChange={(e) => handleChange('start_week', e.target.value)}
                className="w-full h-10 px-2 rounded border border-brew-border text-sm"
                required
                min="36"
                max="52"
              />
            </Field>
            <Field label="Неделя конца">
              <input
                type="number"
                value={form.end_week}
                onChange={(e) => handleChange('end_week', e.target.value)}
                className="w-full h-10 px-2 rounded border border-brew-border text-sm"
                required
                min="36"
                max="52"
              />
            </Field>
          </div>

          <Field label="Статус">
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full h-10 px-2 rounded border border-brew-border text-sm"
            >
              <option value="planned">Запланировано</option>
              <option value="active">В процессе</option>
              <option value="done">Завершено</option>
            </select>
          </Field>

          <div className="pt-2 mt-2 border-t border-brew-border">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-brew-orange" />
              <span className="text-xs font-semibold text-brew-orange uppercase">
                Розлив (опционально)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Неделя розлива">
                <input
                  type="number"
                  value={form.bottling_week}
                  onChange={(e) => handleChange('bottling_week', e.target.value)}
                  className="w-full h-10 px-2 rounded border border-brew-border text-sm"
                  placeholder="—"
                  min="36"
                  max="52"
                />
              </Field>
              <Field label="Объём розлива, л">
                <input
                  type="number"
                  value={form.bottling_volume_l}
                  onChange={(e) => handleChange('bottling_volume_l', e.target.value)}
                  className="w-full h-10 px-2 rounded border border-brew-border text-sm"
                  placeholder="—"
                  min="0"
                />
              </Field>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Оставь пустым, если розлив ещё не запланирован.
            </p>
          </div>

          {error && (
            <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}
        </form>

        {/* Футер с кнопками — всегда виден, прижат к низу */}
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