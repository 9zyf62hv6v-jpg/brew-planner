import { useState, useEffect } from 'react';
import { Plus, Search, Beer, Pencil } from 'lucide-react';
import api from '../api';
import RecipeModal from './RecipeModal';

export default function RecipesPage({ user, isMobile = false }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [modalState, setModalState] = useState({ open: false, recipe: null });
  const [reloadKey, setReloadKey] = useState(0);

  const canEdit = user?.role === 'owner' || user?.role === 'brewer';

  useEffect(() => {
    loadRecipes();
  }, [reloadKey]);

  async function loadRecipes() {
    try {
      setError(null);
      setLoading(true);
      const res = await api.get('/recipes');
      setRecipes(res.data);
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить рецепты');
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    setModalState({ open: true, recipe: null });
  }

  function handleEdit(recipe) {
    if (!canEdit) return;
    setModalState({ open: true, recipe });
  }

  function handleClose() {
    setModalState({ open: false, recipe: null });
  }

  function handleSaved() {
    setReloadKey((k) => k + 1);
  }

  const filtered = recipes.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.style && r.style.toLowerCase().includes(q))
    );
  });

  if (loading && recipes.length === 0) {
    return (
      <div className="p-4 sm:p-6 text-center text-gray-400">
        Загрузка рецептов...
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Поиск по названию или стилю..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-3 rounded-md border border-brew-border text-sm bg-white focus:outline-none focus:border-brew-orange"
          />
        </div>

        {canEdit && (
          <button
            onClick={handleAdd}
            className="h-10 px-4 rounded-md bg-brew-orange text-white text-sm font-medium hover:bg-orange-600 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Новый рецепт
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="bg-white border border-brew-border rounded-lg p-10 text-center">
          <Beer className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-1">
            {search ? 'Ничего не найдено' : 'Рецептов пока нет'}
          </p>
          <p className="text-xs text-gray-400">
            {search
              ? 'Попробуй изменить запрос'
              : 'Создай первый рецепт кнопкой сверху'}
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              canEdit={canEdit}
              onClick={() => handleEdit(recipe)}
            />
          ))}
        </div>
      )}

      {modalState.open && canEdit && (
        <RecipeModal
          mode={modalState.recipe ? 'edit' : 'add'}
          initial={modalState.recipe}
          onClose={handleClose}
          onSaved={handleSaved}
          user={user}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

function RecipeCard({ recipe, canEdit, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-brew-border rounded-lg overflow-hidden transition-shadow relative group ${
        canEdit ? 'hover:shadow-md cursor-pointer' : ''
      }`}
    >
      <div className="h-1.5" style={{ backgroundColor: recipe.color }} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-brew-navy leading-tight">
            {recipe.name}
          </h3>
          {canEdit && (
            <Pencil className="w-3.5 h-3.5 text-gray-300 group-hover:text-brew-orange transition-colors flex-shrink-0 mt-0.5" />
          )}
        </div>

        {recipe.style && (
          <div className="text-xs text-gray-500 mb-3">{recipe.style}</div>
        )}

        <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-brew-border">
          <Stat label="ABV" value={recipe.abv ? `${recipe.abv}%` : '—'} />
          <Stat label="IBU" value={recipe.ibu || '—'} />
          <Stat
            label="Объём"
            value={recipe.volume_l ? `${(recipe.volume_l / 100).toFixed(0)} гл` : '—'}
          />
        </div>

        <div className="mt-2 text-[10px] text-gray-400 text-center">
          {recipe.ingredients?.length || 0} ингредиент(ов)
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-[10px] text-gray-400 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-sm font-semibold text-brew-navy">{value}</div>
    </div>
  );
}