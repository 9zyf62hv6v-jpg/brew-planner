import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import api from '../api';

const PACKAGE_PRESETS = {
  keg: [
    { label: '10 л', value: 10 },
    { label: '20 л', value: 20 },
    { label: '30 л', value: 30 },
    { label: '50 л', value: 50 },
  ],
  bottle: [
    { label: '0.33 л', value: 0.33 },
    { label: '0.5 л', value: 0.5 },
    { label: '0.75 л', value: 0.75 },
    { label: '1 л', value: 1 },
  ],
  can: [
    { label: '0.33 л', value: 0.33 },
    { label: '0.5 л', value: 0.5 },
  ],
};

export default function ProductModal({ mode, initial, onClose, onSaved, isMobile }) {
  const isEdit = mode === 'edit';

  const [batches, setBatches] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    batch_id: initial?.batch_id || '',
    type: initial?.type || 'keg',
    package_volume_l: initial?.package_volume_l || 30,
    quantity: initial?.quantity || 1,
    location: initial?.location || '',
    bottled_at: initial?.bottled_at ? String(initial.bottled_at).slice(0, 10) : todayISO(),
    notes: initial?.notes || '',
  });

  function todayISO() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/batches');
        setBatches(res.data);
        if (!isEdit && res.data.length > 0 && !form.batch_id) {
          setForm((f) => ({ ...f, batch_id: res.data[0].id }));
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setError(null);

    if (!form.batch_id) {
      setError('Выбери варку');
      return;
    }
    if (!form.quantity || form.quantity <= 0) {
      setError('Количество должно быть больше 0');
      return;
    }

    setSaving(true);
    const payload = {
      batch_id: Number(form.batch_id),
      type: form.type,
      package_volume_l: Number(form.package_volume_l),
      quantity: Number(form.quantity),
      location: form.location || null,
      bottled_at: form.bottled_at || null,
      notes: form.notes || null,
    };

    try {
      if (isEdit) {
        await api.put(`/products/${initial.id}`, payload);
      } else {
        await api.post('/products', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  }

  const modalWidth = isMobile
    ? 'w-full max-w-full h-full max-h-full rounded-none'
    : 'w-[480px] max-w-full max-h-[90vh] rounded-lg';

  const presets = PACKAGE_PRESETS[form.type] || [];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className={`bg-white shadow-xl flex flex-col ${modalWidth}`}>
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-brew-border flex-shrink-0">
          <h2 className="text-sm font-semibold text-brew-navy">
            {isEdit ? 'Редактировать партию' : 'Добавить продукцию'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          <Field label="Варка *">
            <select
              value={form.batch_id}
              onChange={(e) => update('batch_id', e.target.value)}
              className="w-full h-10 px-2 rounded border border-brew-border text-sm"
              required
            >
              <option value="">— Выбери —</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.recipe_name} · {b.tank_name} · недели {b.start_week}–{b.end_week}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Тип упаковки *">
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: 'keg', label: 'Кег', icon: '🛢️' },
                { v: 'bottle', label: 'Бутылка', icon: '🍾' },
                { v: 'can', label: 'Банка', icon: '🥫' },
              ].map((t) => (
                <button
                  key={t.v}
                  type="button"
                  onClick={() => {
                    update('type', t.v);
                    // Устанавливаем дефолтную первую пресет-упаковку
                    const first = PACKAGE_PRESETS[t.v][0];
                    update('package_volume_l', first.value);
                  }}
                  className={`h-12 rounded border text-xs font-medium transition-colors flex flex-col items-center justify-center gap-0.5 ${
                    form.type === t.v
                      ? 'border-brew-orange bg-orange-50 text-brew-orange'
                      : 'border-brew-border bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base leading-none">{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Объём упаковки, л *">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {presets.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => update('package_volume_l', p.value)}
                  className={`px-2.5 h-7 rounded text-xs font-medium transition-colors ${
                    Number(form.package_volume_l) === p.value
                      ? 'bg-brew-orange text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <input
              type="number"
              step="0.01"
              value={form.package_volume_l}
              onChange={(e) => update('package_volume_l', e.target.value)}
              className="w-full h-10 px-2 rounded border border-brew-border text-sm"
              required
              min="0.1"
            />
          </Field>

          <Field label="Количество, шт *">
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => update('quantity', e.target.value)}
              className="w-full h-10 px-2 rounded border border-brew-border text-sm"
              required
              min="1"
            />
          </Field>

          {/* Авто-итог */}
          {form.quantity > 0 && form.package_volume_l > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded px-3 py-2 text-xs text-brew-orange font-medium">
              Всего: {(Number(form.quantity) * Number(form.package_volume_l)).toFixed(1)} л
            </div>
          )}

          <Field label="Локация">
            <input
              type="text"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              className="w-full h-10 px-2 rounded border border-brew-border text-sm"
              placeholder="Склад, холодильник, бар..."
              maxLength={100}
            />
          </Field>

          <Field label="Дата розлива">
            <input
              type="date"
              value={form.bottled_at}
              onChange={(e) => update('bottled_at', e.target.value)}
              className="w-full h-10 px-2 rounded border border-brew-border text-sm"
            />
          </Field>

          <Field label="Заметки">
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="w-full px-2 py-2 rounded border border-brew-border text-sm resize-none"
              rows={2}
            />
          </Field>

          {error && (
            <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}
        </form>

        <div className="px-4 sm:px-5 py-3 border-t border-brew-border flex justify-end gap-2 flex-shrink-0 bg-white">
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
            {saving ? 'Сохраняем...' : isEdit ? 'Сохранить' : 'Добавить'}
          </button>
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