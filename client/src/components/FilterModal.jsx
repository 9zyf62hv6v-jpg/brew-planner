import { useEffect, useState } from 'react';
import Modal from './Modal';
import api from '../api';

const STATUS_LABELS = {
  planned: 'Запланировано',
  active: 'В процессе',
  done: 'Завершено',
};

export default function FilterModal({ initial, onApply, onClose }) {
  const [recipes, setRecipes] = useState([]);
  const [tanks, setTanks] = useState([]);

  const [statuses, setStatuses] = useState(initial.statuses || []);
  const [recipeIds, setRecipeIds] = useState(initial.recipeIds || []);
  const [tankIds, setTankIds] = useState(initial.tankIds || []);

  useEffect(() => {
    async function load() {
      const [r, t] = await Promise.all([api.get('/recipes'), api.get('/tanks')]);
      setRecipes(r.data);
      setTanks(t.data);
    }
    load();
  }, []);

  function toggleInArray(arr, setArr, value) {
    setArr(arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]);
  }

  function reset() {
    setStatuses([]);
    setRecipeIds([]);
    setTankIds([]);
  }

  function apply() {
    onApply({ statuses, recipeIds, tankIds });
    onClose();
  }

  const isEmpty = statuses.length === 0 && recipeIds.length === 0 && tankIds.length === 0;

  return (
    <Modal
      title="Фильтр варок"
      onClose={onClose}
      width="md"
      footer={
        <div className="flex justify-between">
          <button
            onClick={reset}
            className="px-4 h-9 rounded border border-brew-border text-sm text-brew-navy hover:bg-gray-50"
          >
            Сбросить
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 h-9 rounded border border-brew-border text-sm text-brew-navy hover:bg-gray-50"
            >
              Отмена
            </button>
            <button
              onClick={apply}
              className="px-4 h-9 rounded bg-brew-orange text-white text-sm font-medium hover:bg-orange-600"
            >
              Применить
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {isEmpty && (
          <div className="text-[11px] text-gray-400 bg-gray-50 border border-brew-border rounded px-3 py-2">
            Ничего не выбрано — показываются все варки
          </div>
        )}

        <div>
          <div className="text-xs font-semibold text-brew-navy mb-2">Статус</div>
          <div className="space-y-1.5">
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={statuses.includes(value)}
                  onChange={() => toggleInArray(statuses, setStatuses, value)}
                  className="w-4 h-4 accent-brew-orange"
                />
                <span className="text-brew-navy">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-brew-navy mb-2">Рецепты</div>
          <div className="space-y-1.5">
            {recipes.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={recipeIds.includes(r.id)}
                  onChange={() => toggleInArray(recipeIds, setRecipeIds, r.id)}
                  className="w-4 h-4 accent-brew-orange"
                />
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: r.color }}
                />
                <span className="text-brew-navy">{r.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold text-brew-navy mb-2">Танки</div>
          <div className="grid grid-cols-2 gap-1.5">
            {tanks.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={tankIds.includes(t.id)}
                  onChange={() => toggleInArray(tankIds, setTankIds, t.id)}
                  className="w-4 h-4 accent-brew-orange"
                />
                <span className="text-brew-navy">{t.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}