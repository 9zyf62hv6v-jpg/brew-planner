import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Download, Trash2, Edit3, Activity, Thermometer, Droplet,
  FlaskConical, Gauge, FileText,
} from 'lucide-react';
import api, { getToken } from '../api';

export default function JournalPage({ user, isMobile = false }) {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [measurementsLoading, setMeasurementsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [modalState, setModalState] = useState({ open: false, measurement: null });

  const canEdit = user?.role === 'owner' || user?.role === 'brewer';

  // Загружаем варки
  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const res = await api.get('/batches');
        // Только active и done — planned ещё не варится
        const active = res.data.filter((b) => b.status !== 'planned');
        setBatches(active);
        if (active.length > 0 && !selectedBatchId) {
          setSelectedBatchId(active[0].id);
        }
      } catch (err) {
        console.error(err);
        setError('Не удалось загрузить варки');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Загружаем измерения при смене варки
  useEffect(() => {
    if (!selectedBatchId) {
      setMeasurements([]);
      return;
    }
    async function load() {
      try {
        setMeasurementsLoading(true);
        const res = await api.get(`/batches/${selectedBatchId}/measurements`);
        setMeasurements(res.data);
      } catch (err) {
        console.error(err);
        setMeasurements([]);
      } finally {
        setMeasurementsLoading(false);
      }
    }
    load();
  }, [selectedBatchId]);

  function reloadMeasurements() {
    if (!selectedBatchId) return;
    api.get(`/batches/${selectedBatchId}/measurements`).then((res) => {
      setMeasurements(res.data);
    });
  }

  async function handleDelete(id) {
    if (!confirm('Удалить это измерение?')) return;
    try {
      await api.delete(`/measurements/${id}`);
      reloadMeasurements();
    } catch (err) {
      console.error(err);
      alert('Не удалось удалить');
    }
  }

  function handleDownloadCSV() {
    if (!selectedBatchId) return;
    const token = getToken();
    // Открываем URL — браузер скачает файл (токен передаём через query-параметр? нет — сделаем через fetch)
    // Лучше — fetch + blob
    fetch(`/api/batches/${selectedBatchId}/measurements/export.csv`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const batch = batches.find((b) => b.id === selectedBatchId);
        a.download = `measurements-${batch?.recipe_name || selectedBatchId}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error(err);
        alert('Не удалось скачать CSV');
      });
  }

  const selectedBatch = batches.find((b) => b.id === selectedBatchId);

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Загрузка...</div>;
  }

  if (batches.length === 0) {
    return (
      <div className="p-6 text-center">
        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500 mb-1">Нет активных варок</p>
        <p className="text-xs text-gray-400">
          Журнал измерений доступен для варок в статусе «В процессе» или «Завершено»
        </p>
      </div>
    );
  }

  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'h-full'}`}>
      {/* Левая панель — список варок */}
      <div
        className={`${
          isMobile ? 'w-full border-b' : 'w-64 border-r'
        } bg-white border-brew-border flex-shrink-0 overflow-y-auto`}
      >
        <div className="px-3 py-2 border-b border-brew-border">
          <h3 className="text-xs font-semibold text-brew-navy">Варки</h3>
        </div>
        {batches.map((batch) => {
          const active = batch.id === selectedBatchId;
          return (
            <button
              key={batch.id}
              onClick={() => setSelectedBatchId(batch.id)}
              className={`w-full text-left px-3 py-2 border-b border-brew-border transition-colors flex items-center gap-2 ${
                active ? 'bg-brew-orange/10' : 'hover:bg-gray-50'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: batch.recipe_color }}
              />
              <div className="min-w-0 flex-1">
                <div
                  className={`text-xs font-medium truncate ${
                    active ? 'text-brew-orange' : 'text-brew-navy'
                  }`}
                >
                  {batch.recipe_name}
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  {batch.tank_name} · недели {batch.start_week}–{batch.end_week}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Правая панель — измерения */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Заголовок с кнопками */}
        <div className="px-3 sm:px-4 py-2 border-b border-brew-border flex items-center gap-2 flex-wrap bg-white">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-brew-navy truncate">
              {selectedBatch?.recipe_name}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {selectedBatch?.tank_name} · {selectedBatch?.volume_l?.toLocaleString('ru-RU')} л
            </div>
          </div>

          <button
            onClick={handleDownloadCSV}
            className="h-9 px-3 rounded border border-brew-border text-xs text-brew-navy hover:bg-gray-50 flex items-center gap-1"
            title="Скачать CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className={isMobile ? 'sr-only' : ''}>CSV</span>
          </button>

          {canEdit && (
            <button
              onClick={() => setModalState({ open: true, measurement: null })}
              className="h-9 px-3 rounded bg-brew-orange text-white text-xs font-medium hover:bg-orange-600 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Добавить
            </button>
          )}
        </div>

        {/* График + таблица */}
        <div className="flex-1 overflow-y-auto">
          {measurementsLoading ? (
            <div className="p-6 text-center text-gray-400 text-sm">
              Загрузка измерений...
            </div>
          ) : measurements.length === 0 ? (
            <div className="p-6 text-center">
              <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Измерений пока нет</p>
              {canEdit && (
                <p className="text-[10px] text-gray-400 mt-1">
                  Нажми «Добавить», чтобы создать первую запись
                </p>
              )}
            </div>
          ) : (
            <>
              {/* График */}
              <div className="p-3 sm:p-4">
                <MeasurementsChart measurements={measurements} />
              </div>

              {/* Таблица */}
              <div className="px-3 sm:px-4 pb-4">
                <div className="bg-white border border-brew-border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-brew-border">
                      <tr>
                        <th className="text-left px-2 py-2 font-medium text-gray-500">Дата</th>
                        <th className="text-right px-2 py-2 font-medium text-gray-500">pH</th>
                        <th className="text-right px-2 py-2 font-medium text-gray-500">SG</th>
                        <th className="text-right px-2 py-2 font-medium text-gray-500">°C</th>
                        <th className="text-right px-2 py-2 font-medium text-gray-500 hidden sm:table-cell">Бар</th>
                        {canEdit && <th className="w-16"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {measurements.map((m) => (
                        <tr key={m.id} className="border-b border-brew-border last:border-b-0 hover:bg-gray-50">
                          <td className="px-2 py-2 text-brew-navy whitespace-nowrap">
                            {formatDate(m.measured_at)}
                          </td>
                          <td className="px-2 py-2 text-right text-brew-navy">
                            {m.ph ?? '—'}
                          </td>
                          <td className="px-2 py-2 text-right text-brew-navy">
                            {m.gravity ? Number(m.gravity).toFixed(3) : '—'}
                          </td>
                          <td className="px-2 py-2 text-right text-brew-navy">
                            {m.temperature ?? '—'}
                          </td>
                          <td className="px-2 py-2 text-right text-brew-navy hidden sm:table-cell">
                            {m.pressure ?? '—'}
                          </td>
                          {canEdit && (
                            <td className="px-2 py-2">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setModalState({ open: true, measurement: m })}
                                  className="w-6 h-6 rounded hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-brew-orange"
                                  title="Редактировать"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleDelete(m.id)}
                                  className="w-6 h-6 rounded hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500"
                                  title="Удалить"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Заметки — отдельно, если есть */}
                {measurements.some((m) => m.notes) && (
                  <div className="mt-3 space-y-1">
                    {measurements
                      .filter((m) => m.notes)
                      .map((m) => (
                        <div
                          key={m.id}
                          className="text-[11px] text-gray-600 bg-gray-50 rounded px-2 py-1.5"
                        >
                          <span className="text-gray-400">{formatDate(m.measured_at)}: </span>
                          {m.notes}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {modalState.open && canEdit && (
        <MeasurementModal
          batchId={selectedBatchId}
          measurement={modalState.measurement}
          onClose={() => setModalState({ open: false, measurement: null })}
          onSaved={reloadMeasurements}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Простой SVG-график плотности и температуры
function MeasurementsChart({ measurements }) {
  // Сортируем по дате (старые → новые)
  const sorted = [...measurements].sort(
    (a, b) => new Date(a.measured_at) - new Date(b.measured_at)
  );

  const gravityPoints = sorted.filter((m) => m.gravity);
  const tempPoints = sorted.filter((m) => m.temperature);

  if (gravityPoints.length < 2 && tempPoints.length < 2) {
    return (
      <div className="text-center text-[11px] text-gray-400 py-4">
        Для графика нужно минимум 2 измерения
      </div>
    );
  }

  const width = 800;
  const height = 220;
  const padding = { top: 20, right: 40, bottom: 30, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // X — по времени
  const allTimes = sorted.map((m) => new Date(m.measured_at).getTime());
  const minTime = Math.min(...allTimes);
  const maxTime = Math.max(...allTimes);
  const timeRange = maxTime - minTime || 1;

  // Y для плотности (левая ось)
  const gravities = gravityPoints.map((m) => Number(m.gravity));
  const minG = gravities.length > 0 ? Math.min(...gravities) : 1.0;
  const maxG = gravities.length > 0 ? Math.max(...gravities) : 1.06;
  const gRange = maxG - minG || 0.01;
  const gPad = gRange * 0.15;

  // Y для температуры (правая ось)
  const temps = tempPoints.map((m) => Number(m.temperature));
  const minT = temps.length > 0 ? Math.min(...temps) : 0;
  const maxT = temps.length > 0 ? Math.max(...temps) : 30;
  const tRange = maxT - minT || 5;
  const tPad = tRange * 0.15;

  function xFor(time) {
    return padding.left + ((time - minTime) / timeRange) * plotW;
  }
  function yForGravity(g) {
    const top = minG - gPad;
    const bottom = maxG + gPad;
    return padding.top + ((bottom - g) / (bottom - top)) * plotH;
  }
  function yForTemp(t) {
    const top = minT - tPad;
    const bottom = maxT + tPad;
    return padding.top + ((bottom - t) / (bottom - top)) * plotH;
  }

  const gravityPath =
    gravityPoints.length > 1
      ? gravityPoints
          .map((m, i) => {
            const x = xFor(new Date(m.measured_at).getTime());
            const y = yForGravity(Number(m.gravity));
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          })
          .join(' ')
      : '';

  const tempPath =
    tempPoints.length > 1
      ? tempPoints
          .map((m, i) => {
            const x = xFor(new Date(m.measured_at).getTime());
            const y = yForTemp(Number(m.temperature));
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
          })
          .join(' ')
      : '';

  return (
    <div className="bg-white border border-brew-border rounded-lg p-3 overflow-x-auto">
      <div className="flex items-center gap-3 mb-2 text-[11px]">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-blue-500" />
          <span className="text-gray-600">Плотность (SG)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-red-500" />
          <span className="text-gray-600">Температура (°C)</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ minWidth: '400px' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Фон */}
        <rect
          x={padding.left}
          y={padding.top}
          width={plotW}
          height={plotH}
          fill="#FAFAFA"
          stroke="#E5E7EB"
        />

        {/* Сетка по Y */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => {
          const y = padding.top + p * plotH;
          return (
            <line
              key={p}
              x1={padding.left}
              y1={y}
              x2={padding.left + plotW}
              y2={y}
              stroke="#E5E7EB"
              strokeDasharray="2,4"
            />
          );
        })}

        {/* График плотности */}
        {gravityPath && (
          <path
            d={gravityPath}
            fill="none"
            stroke="#2196F3"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}
        {gravityPoints.map((m) => (
          <circle
            key={`g-${m.id}`}
            cx={xFor(new Date(m.measured_at).getTime())}
            cy={yForGravity(Number(m.gravity))}
            r={3.5}
            fill="#2196F3"
          />
        ))}

        {/* График температуры */}
        {tempPath && (
          <path
            d={tempPath}
            fill="none"
            stroke="#E91E63"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeDasharray="6,3"
          />
        )}
        {tempPoints.map((m) => (
          <circle
            key={`t-${m.id}`}
            cx={xFor(new Date(m.measured_at).getTime())}
            cy={yForTemp(Number(m.temperature))}
            r={3.5}
            fill="#E91E63"
          />
        ))}

        {/* Ось X подписи (даты) */}
        {sorted.length > 0 && (
          <>
            <text
              x={padding.left}
              y={height - 10}
              fontSize="10"
              fill="#666"
              textAnchor="start"
            >
              {formatDate(sorted[0].measured_at)}
            </text>
            {sorted.length > 2 && (
              <text
                x={padding.left + plotW / 2}
                y={height - 10}
                fontSize="10"
                fill="#666"
                textAnchor="middle"
              >
                {formatDate(sorted[Math.floor(sorted.length / 2)].measured_at)}
              </text>
            )}
            {sorted.length > 1 && (
              <text
                x={padding.left + plotW}
                y={height - 10}
                fontSize="10"
                fill="#666"
                textAnchor="end"
              >
                {formatDate(sorted[sorted.length - 1].measured_at)}
              </text>
            )}
          </>
        )}

        {/* Подписи осей */}
        {gravityPoints.length > 0 && (
          <text
            x={10}
            y={padding.top + 10}
            fontSize="10"
            fill="#2196F3"
            fontWeight="bold"
          >
            SG {(maxG + gPad).toFixed(3)}
          </text>
        )}
        {gravityPoints.length > 0 && (
          <text
            x={10}
            y={padding.top + plotH - 5}
            fontSize="10"
            fill="#2196F3"
            fontWeight="bold"
          >
            SG {(minG - gPad).toFixed(3)}
          </text>
        )}
        {tempPoints.length > 0 && (
          <text
            x={width - 5}
            y={padding.top + 10}
            fontSize="10"
            fill="#E91E63"
            fontWeight="bold"
            textAnchor="end"
          >
            {Math.round(maxT + tPad)}°C
          </text>
        )}
        {tempPoints.length > 0 && (
          <text
            x={width - 5}
            y={padding.top + plotH - 5}
            fontSize="10"
            fill="#E91E63"
            fontWeight="bold"
            textAnchor="end"
          >
            {Math.round(minT - tPad)}°C
          </text>
        )}
      </svg>
    </div>
  );
}

// Модалка добавления/редактирования измерения
function MeasurementModal({ batchId, measurement, onClose, onSaved, isMobile }) {
  const isEdit = !!measurement;

  const [form, setForm] = useState({
    measured_at: measurement?.measured_at
      ? toLocalDateTime(measurement.measured_at)
      : toLocalDateTime(new Date()),
    ph: measurement?.ph ?? '',
    gravity: measurement?.gravity ?? '',
    temperature: measurement?.temperature ?? '',
    pressure: measurement?.pressure ?? '',
    volume_l: measurement?.volume_l ?? '',
    notes: measurement?.notes ?? '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function toLocalDateTime(iso) {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      measured_at: form.measured_at ? new Date(form.measured_at).toISOString() : new Date().toISOString(),
      ph: form.ph === '' ? null : Number(form.ph),
      gravity: form.gravity === '' ? null : Number(form.gravity),
      temperature: form.temperature === '' ? null : Number(form.temperature),
      pressure: form.pressure === '' ? null : Number(form.pressure),
      volume_l: form.volume_l === '' ? null : Number(form.volume_l),
      notes: form.notes || null,
    };

    try {
      if (isEdit) {
        await api.put(`/measurements/${measurement.id}`, payload);
      } else {
        await api.post(`/batches/${batchId}/measurements`, payload);
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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className={`bg-white shadow-xl flex flex-col ${modalWidth}`}>
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-brew-border flex-shrink-0">
          <h2 className="text-sm font-semibold text-brew-navy">
            {isEdit ? 'Редактировать измерение' : 'Новое измерение'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-500"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          <Field label="Дата и время">
            <input
              type="datetime-local"
              value={form.measured_at}
              onChange={(e) => handleChange('measured_at', e.target.value)}
              className="w-full h-10 px-2 rounded border border-brew-border text-sm"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="pH">
              <input
                type="number"
                step="0.01"
                value={form.ph}
                onChange={(e) => handleChange('ph', e.target.value)}
                className="w-full h-10 px-2 rounded border border-brew-border text-sm"
                placeholder="4.50"
                min="0"
                max="14"
              />
            </Field>
            <Field label="Плотность (SG)">
              <input
                type="number"
                step="0.001"
                value={form.gravity}
                onChange={(e) => handleChange('gravity', e.target.value)}
                className="w-full h-10 px-2 rounded border border-brew-border text-sm"
                placeholder="1.048"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Температура, °C">
              <input
                type="number"
                step="0.1"
                value={form.temperature}
                onChange={(e) => handleChange('temperature', e.target.value)}
                className="w-full h-10 px-2 rounded border border-brew-border text-sm"
                placeholder="20.5"
              />
            </Field>
            <Field label="Давление, бар">
              <input
                type="number"
                step="0.01"
                value={form.pressure}
                onChange={(e) => handleChange('pressure', e.target.value)}
                className="w-full h-10 px-2 rounded border border-brew-border text-sm"
                placeholder="0.8"
              />
            </Field>
          </div>

          <Field label="Объём, л (опц.)">
            <input
              type="number"
              step="0.1"
              value={form.volume_l}
              onChange={(e) => handleChange('volume_l', e.target.value)}
              className="w-full h-10 px-2 rounded border border-brew-border text-sm"
              placeholder="5000"
            />
          </Field>

          <Field label="Заметки">
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-2 py-2 rounded border border-brew-border text-sm resize-none"
              rows={2}
              placeholder="Вкус, запах, особенности..."
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
            {saving ? 'Сохраняем...' : isEdit ? 'Сохранить' : 'Создать'}
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