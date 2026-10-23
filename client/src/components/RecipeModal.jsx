import { useState, useEffect, useMemo } from 'react';
import { X, Trash2, Plus, Wheat, Leaf, FlaskConical, Calculator } from 'lucide-react';
import api from '../api';
import { calcOG, calcFG, calcABV, calcIBU, recalcAll } from '../utils/recipeMath';

const COLOR_PRESETS = [
  '#4CAF50', '#B45309', '#E91E63', '#2196F3', '#607D8B',
  '#FF9800', '#9C27B0', '#00BCD4', '#795548', '#F44336',
];

export default function RecipeModal({ mode, initial, onClose, onSaved, user, isMobile = false }) {
  const isEdit = mode === 'edit';
  const canDelete = user?.role === 'owner';

  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    name: initial?.name || '',
    style: initial?.style || '',
    color: initial?.color || '#4CAF50',
    description: initial?.description || '',
    volume_l: initial?.volume_l ?? 5400,
    boil_time_min: initial?.boil_time_min ?? 60,
    efficiency: initial?.efficiency ?? 75,
    og: initial?.og || '',
    fg: initial?.fg || '',
    ibu: initial?.ibu || '',
    abv: initial?.abv || '',
  });

  const [ingredients, setIngredients] = useState(initial?.ingredients || []);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Автоматический расчёт OG/FG/ABV/IBU при изменении ингредиентов
  const autoCalc = useMemo(() => {
    return recalcAll(
      ingredients,
      Number(form.volume_l),
      Number(form.efficiency),
      null
    );
  }, [ingredients, form.volume_l, form.efficiency]);

  // Кнопка "Применить расчёт" — заполняет поля из autoCalc
  function applyAutoCalc() {
    setForm((f) => ({
      ...f,
      og: autoCalc.og || '',
      fg: autoCalc.fg || '',
      abv: autoCalc.abv || '',
      ibu: autoCalc.ibu || '',
    }));
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addIngredient(type) {
    const empty = {
      type,
      name: '',
      amount: type === 'yeast' ? 1 : type === 'hop' ? 20 : 1,
      unit: type === 'yeast' ? 'pcs' : type === 'hop' ? 'g' : 'kg',
      color_ebc: type === 'malt' ? 10 : null,
      potential_sg: type === 'malt' ? 1.037 : null,
      alpha_acid: type === 'hop' ? 5 : null,
      boil_time_min: type === 'hop' ? 60 : null,
      attenuation: type === 'yeast' ? 75 : null,
    };
    setIngredients((prev) => [...prev, empty]);
  }

  function updateIngredient(idx, field, value) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing))
    );
  }

  function removeIngredient(idx) {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (!form.name.trim()) {
      setError('Название рецепта обязательно');
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      style: form.style || null,
      color: form.color,
      description: form.description || null,
      volume_l: Number(form.volume_l),
      boil_time_min: Number(form.boil_time_min),
      efficiency: Number(form.efficiency),
      og: form.og ? Number(form.og) : null,
      fg: form.fg ? Number(form.fg) : null,
      ibu: form.ibu ? Number(form.ibu) : null,
      abv: form.abv ? Number(form.abv) : null,
      ingredients: ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({
          type: i.type,
          name: i.name.trim(),
          amount: Number(i.amount),
          unit: i.unit,
          color_ebc: i.color_ebc ? Number(i.color_ebc) : null,
          potential_sg: i.potential_sg ? Number(i.potential_sg) : null,
          alpha_acid: i.alpha_acid ? Number(i.alpha_acid) : null,
          boil_time_min: i.boil_time_min ? Number(i.boil_time_min) : null,
          attenuation: i.attenuation ? Number(i.attenuation) : null,
        })),
    };

    try {
      if (isEdit) {
        await api.put(`/recipes/${initial.id}`, payload);
      } else {
        await api.post('/recipes', payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Не удалось сохранить рецепт');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Удалить рецепт? Ингредиенты тоже удалятся.')) return;
    setError(null);
    setDeleting(true);
    try {
      await api.delete(`/recipes/${initial.id}`);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Не удалось удалить рецепт');
    } finally {
      setDeleting(false);
    }
  }

  const modalWidth = isMobile
    ? 'w-full max-w-full h-full max-h-full rounded-none'
    : 'w-[720px] max-w-full max-h-[92vh] rounded-lg';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className={`bg-white shadow-xl flex flex-col ${modalWidth}`}>
        {/* Заголовок */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-brew-border flex-shrink-0">
          <h2 className="text-sm font-semibold text-brew-navy">
            {isEdit ? 'Редактировать рецепт' : 'Новый рецепт'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded hover:bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Скроллируемое тело */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5"
        >
          {/* === Основное === */}
          <section>
            <h3 className="text-xs font-semibold text-brew-orange uppercase mb-2">
              Основное
            </h3>
            <div className="space-y-3">
              <Field label="Название *">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full h-10 px-2 rounded border border-brew-border text-sm"
                  required
                  maxLength={150}
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Стиль">
                  <input
                    type="text"
                    value={form.style}
                    onChange={(e) => handleChange('style', e.target.value)}
                    className="w-full h-10 px-2 rounded border border-brew-border text-sm"
                    placeholder="IPA, Stout, Lager..."
                    maxLength={100}
                  />
                </Field>

                <Field label="Цвет">
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => handleChange('color', e.target.value)}
                      className="w-12 h-10 rounded border border-brew-border cursor-pointer"
                    />
                    <div className="flex flex-wrap gap-1">
                      {COLOR_PRESETS.slice(0, 6).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleChange('color', c)}
                          className="w-6 h-6 rounded border border-brew-border"
                          style={{ backgroundColor: c }}
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                </Field>
              </div>

              <Field label="Описание">
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-2 py-2 rounded border border-brew-border text-sm resize-none"
                  rows={2}
                  placeholder="Заметки, особенности..."
                />
              </Field>
            </div>
          </section>

          {/* === Параметры партии === */}
          <section>
            <h3 className="text-xs font-semibold text-brew-orange uppercase mb-2">
              Параметры партии
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="Объём, л">
                <input
                  type="number"
                  value={form.volume_l}
                  onChange={(e) => handleChange('volume_l', e.target.value)}
                  className="w-full h-10 px-2 rounded border border-brew-border text-sm"
                  min="1"
                />
              </Field>
              <Field label="Кипячение, мин">
                <input
                  type="number"
                  value={form.boil_time_min}
                  onChange={(e) => handleChange('boil_time_min', e.target.value)}
                  className="w-full h-10 px-2 rounded border border-brew-border text-sm"
                  min="1"
                />
              </Field>
              <Field label="Эффективность, %">
                <input
                  type="number"
                  value={form.efficiency}
                  onChange={(e) => handleChange('efficiency', e.target.value)}
                  className="w-full h-10 px-2 rounded border border-brew-border text-sm"
                  min="1"
                  max="100"
                />
              </Field>
            </div>
          </section>

          {/* === Расчётные параметры === */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-brew-orange uppercase flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5" />
                Расчётные параметры
              </h3>
              <button
                type="button"
                onClick={applyAutoCalc}
                className="text-xs px-2 py-1 rounded bg-orange-50 text-brew-orange hover:bg-orange-100 flex items-center gap-1"
                title="Подставить значения из авто-расчёта"
              >
                <Calculator className="w-3 h-3" />
                Применить авто-расчёт
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="OG (нач. плотн.)">
                <input
                  type="number"
                  step="0.001"
                  value={form.og}
                  onChange={(e) => handleChange('og', e.target.value)}
                  className="w-full h-10 px-2 rounded border border-brew-border text-sm"
                  placeholder="1.050"
                />
              </Field>
              <Field label="FG (кон. плотн.)">
                <input
                  type="number"
                  step="0.001"
                  value={form.fg}
                  onChange={(e) => handleChange('fg', e.target.value)}
                  className="w-full h-10 px-2 rounded border border-brew-border text-sm"
                  placeholder="1.010"
                />
              </Field>
              <Field label="ABV, %">
                <input
                  type="number"
                  step="0.01"
                  value={form.abv}
                  onChange={(e) => handleChange('abv', e.target.value)}
                  className="w-full h-10 px-2 rounded border border-brew-border text-sm"
                  placeholder="5.2"
                />
              </Field>
              <Field label="IBU">
                <input
                  type="number"
                  step="0.1"
                  value={form.ibu}
                  onChange={(e) => handleChange('ibu', e.target.value)}
                  className="w-full h-10 px-2 rounded border border-brew-border text-sm"
                  placeholder="40"
                />
              </Field>
            </div>

            {autoCalc.og && (
              <div className="mt-2 text-[11px] text-gray-500 bg-gray-50 rounded px-3 py-2">
                Авто-расчёт:{' '}
                OG <b>{Number(autoCalc.og).toFixed(3)}</b>
                {autoCalc.fg && <> · FG <b>{Number(autoCalc.fg).toFixed(3)}</b></>}
                {autoCalc.abv && <> · ABV <b>{Number(autoCalc.abv).toFixed(2)}%</b></>}
                {autoCalc.ibu && <> · IBU <b>{Number(autoCalc.ibu).toFixed(1)}</b></>}
              </div>
)}
            {autoCalc.og && autoCalc.og < 1.02 && (
              <div className="mt-1 text-[11px] text-amber-600 bg-amber-50 rounded px-3 py-2">
               💡 Плотность очень низкая. Для объёма {form.volume_l} л добавь больше солода — для 54 гл обычно ~1000–1300 кг.
             </div>
)}

          </section>

          {/* === Ингредиенты === */}
          <section>
            <h3 className="text-xs font-semibold text-brew-orange uppercase mb-2">
              Ингредиенты
            </h3>

            {/* Солод */}
            <IngredientGroup
              type="malt"
              icon={Wheat}
              title="Солод"
              ingredients={ingredients.filter((i) => i.type === 'malt')}
              onAdd={() => addIngredient('malt')}
              onUpdate={(name, field, value) => {
                const idx = ingredients.findIndex(
                  (i) => i === ingredients.find((x) => x.type === 'malt' && x.name === name)
                );
                // упрощённый способ: ищем по индексу в общем массиве
              }}
              onRemove={removeIngredient}
              allIngredients={ingredients}
              updateIngredient={updateIngredient}
            />

            {/* Хмель */}
            <IngredientGroup
              type="hop"
              icon={Leaf}
              title="Хмель"
              ingredients={ingredients.filter((i) => i.type === 'hop')}
              onAdd={() => addIngredient('hop')}
              allIngredients={ingredients}
              updateIngredient={updateIngredient}
              onRemove={removeIngredient}
            />

            {/* Дрожжи */}
            <IngredientGroup
              type="yeast"
              icon={FlaskConical}
              title="Дрожжи"
              ingredients={ingredients.filter((i) => i.type === 'yeast')}
              onAdd={() => addIngredient('yeast')}
              allIngredients={ingredients}
              updateIngredient={updateIngredient}
              onRemove={removeIngredient}
            />
          </section>

          {error && (
            <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}
        </form>

        {/* Футер */}
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

function IngredientGroup({
  type,
  icon: Icon,
  title,
  ingredients,
  onAdd,
  allIngredients,
  updateIngredient,
  onRemove,
}) {
  // Получаем реальный индекс в общем массиве
  function realIndex(ing) {
    return allIngredients.findIndex((x) => x === ing);
  }

  return (
    <div className="mb-3 border border-brew-border rounded-md overflow-hidden">
      <div className="flex items-center justify-between bg-gray-50 px-3 py-2 border-b border-brew-border">
        <div className="flex items-center gap-2 text-xs font-semibold text-brew-navy">
          <Icon className="w-4 h-4 text-brew-orange" />
          {title}
          <span className="text-gray-400 font-normal">
            ({ingredients.length})
          </span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs px-2 py-1 rounded bg-white border border-brew-border hover:bg-brew-orange hover:text-white hover:border-brew-orange transition-colors flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          Добавить
        </button>
      </div>

      {ingredients.length === 0 && (
        <div className="px-3 py-3 text-xs text-gray-400 text-center">
          Ничего не добавлено
        </div>
      )}

      {ingredients.map((ing) => {
        const idx = realIndex(ing);
        return (
          <div
            key={idx}
            className="p-3 border-b border-brew-border last:border-b-0 grid grid-cols-12 gap-2 items-end"
          >
            {/* Название */}
            <div className={type === 'malt' ? 'col-span-6' : 'col-span-5'}>
              <span className="block text-[10px] text-gray-400 mb-0.5">
                Название
              </span>
              <input
                type="text"
                value={ing.name}
                onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                className="w-full h-9 px-2 rounded border border-brew-border text-sm"
                placeholder={
                  type === 'malt'
                    ? 'Пэйл-эль'
                    : type === 'hop'
                    ? 'Cascade'
                    : 'US-05'
                }
              />
            </div>

            {/* Количество */}
            <div className="col-span-3">
              <span className="block text-[10px] text-gray-400 mb-0.5">
                Кол-во
              </span>
              <input
                type="number"
                step="0.01"
                value={ing.amount}
                onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
                className="w-full h-9 px-2 rounded border border-brew-border text-sm"
              />
            </div>

            {/* Параметр для каждого типа */}
            {type === 'malt' && (
              <>
                <div className="col-span-1">
                  <span className="block text-[10px] text-gray-400 mb-0.5">
                    EBC
                  </span>
                  <input
                    type="number"
                    value={ing.color_ebc || ''}
                    onChange={(e) =>
                      updateIngredient(idx, 'color_ebc', e.target.value)
                    }
                    className="w-full h-9 px-1 rounded border border-brew-border text-xs"
                    placeholder="10"
                  />
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] text-gray-400 mb-0.5">
                    SG потенц.
                  </span>
                  <input
                    type="number"
                    step="0.001"
                    value={ing.potential_sg || ''}
                    onChange={(e) =>
                      updateIngredient(idx, 'potential_sg', e.target.value)
                    }
                    className="w-full h-9 px-1 rounded border border-brew-border text-xs"
                    placeholder="1.037"
                  />
                </div>
              </>
            )}

            {type === 'hop' && (
              <>
                <div className="col-span-2">
                  <span className="block text-[10px] text-gray-400 mb-0.5">
                    α-кислота %
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={ing.alpha_acid || ''}
                    onChange={(e) =>
                      updateIngredient(idx, 'alpha_acid', e.target.value)
                    }
                    className="w-full h-9 px-1 rounded border border-brew-border text-xs"
                    placeholder="5"
                  />
                </div>
                <div className="col-span-2">
                  <span className="block text-[10px] text-gray-400 mb-0.5">
                    Кипяч., мин
                  </span>
                  <input
                    type="number"
                    value={ing.boil_time_min || ''}
                    onChange={(e) =>
                      updateIngredient(idx, 'boil_time_min', e.target.value)
                    }
                    className="w-full h-9 px-1 rounded border border-brew-border text-xs"
                    placeholder="60"
                  />
                </div>
              </>
            )}

            {type === 'yeast' && (
              <div className="col-span-4">
                <span className="block text-[10px] text-gray-400 mb-0.5">
                  Аттенюация %
                </span>
                <input
                  type="number"
                  value={ing.attenuation || ''}
                  onChange={(e) =>
                    updateIngredient(idx, 'attenuation', e.target.value)
                  }
                  className="w-full h-9 px-1 rounded border border-brew-border text-xs"
                  placeholder="75"
                />
              </div>
            )}

            {/* Удалить */}
            <div className="col-span-12 sm:col-span-12 flex justify-end">
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Удалить
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}