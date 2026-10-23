import { useState, useEffect } from 'react';
import {
  Plus, Package, Trash2, Edit3, MapPin, Calendar as CalendarIcon,
} from 'lucide-react';
import api from '../api';
import ProductModal from './ProductModal';

const TYPE_INFO = {
  keg: { label: 'Кег', icon: '🛢️', color: '#607D8B' },
  bottle: { label: 'Бутылка', icon: '🍾', color: '#4CAF50' },
  can: { label: 'Банка', icon: '🥫', color: '#FF9800' },
};

export default function ProductsPage({ user, isMobile = false }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterBatchId, setFilterBatchId] = useState('');
  const [modalState, setModalState] = useState({ open: false, product: null });

  const canEdit = user?.role === 'owner' || user?.role === 'brewer';

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setError(null);
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить продукцию');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(product) {
    if (!confirm(`Списать партию «${product.recipe_name}»?`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      console.error(err);
    }
  }

  // Уникальные варки для фильтра
  const batches = Array.from(
    new Map(
      products.map((p) => [
        p.batch_id,
        { id: p.batch_id, name: p.recipe_name, color: p.recipe_color },
      ])
    ).values()
  );

  const filtered = filterBatchId
    ? products.filter((p) => String(p.batch_id) === filterBatchId)
    : products;

  // Сводка
  const summary = {
    totalL: filtered.reduce((s, p) => s + Number(p.total_volume_l), 0),
    kegs: filtered.filter((p) => p.type === 'keg').reduce((s, p) => s + p.quantity, 0),
    bottles: filtered.filter((p) => p.type === 'bottle').reduce((s, p) => s + p.quantity, 0),
    cans: filtered.filter((p) => p.type === 'can').reduce((s, p) => s + p.quantity, 0),
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Загрузка продукции...</div>;
  }

  return (
    <div className="p-3 sm:p-6">
      {/* Заголовок + кнопка */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <div className="flex-1">
          <h1 className="text-base sm:text-lg font-semibold text-brew-navy">
            Склад продукции
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Готовое пиво в кегах и бутылках
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setModalState({ open: true, product: null })}
            className="h-10 px-4 rounded-md bg-brew-orange text-white text-sm font-medium hover:bg-orange-600 flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Добавить партию
          </button>
        )}
      </div>

      {/* Сводка */}
      {filtered.length > 0 && (
        <div className={`grid gap-3 mb-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
          <SummaryCard label="Всего литров" value={summary.totalL.toLocaleString('ru-RU')} color="bg-brew-orange/10 text-brew-orange" />
          <SummaryCard label="Кег" value={summary.kegs} color="bg-blue-50 text-blue-600" />
          <SummaryCard label="Бутылок" value={summary.bottles} color="bg-green-50 text-green-600" />
          <SummaryCard label="Банок" value={summary.cans} color="bg-yellow-50 text-yellow-600" />
        </div>
      )}

      {/* Фильтр по варке */}
      {batches.length > 1 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto">
          <button
            onClick={() => setFilterBatchId('')}
            className={`px-3 h-8 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              !filterBatchId ? 'bg-brew-orange text-white' : 'bg-white border border-brew-border text-brew-navy hover:bg-gray-50'
            }`}
          >
            Все варки
          </button>
          {batches.map((b) => (
            <button
              key={b.id}
              onClick={() => setFilterBatchId(String(b.id))}
              className={`px-3 h-8 rounded text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                filterBatchId === String(b.id) ? 'bg-brew-orange text-white' : 'bg-white border border-brew-border text-brew-navy hover:bg-gray-50'
              }`}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
              {b.name}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-4 text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="bg-white border border-brew-border rounded-lg p-10 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-1">Продукции пока нет</p>
          <p className="text-xs text-gray-400">
            {canEdit ? 'Добавь партию кнопкой сверху' : 'Владелец или пивовар добавит продукцию'}
          </p>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              canEdit={canEdit}
              onEdit={() => setModalState({ open: true, product: p })}
              onDelete={() => handleDelete(p)}
            />
          ))}
        </div>
      )}

      {modalState.open && canEdit && (
        <ProductModal
          mode={modalState.product ? 'edit' : 'add'}
          initial={modalState.product}
          onClose={() => setModalState({ open: false, product: null })}
          onSaved={load}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="bg-white border border-brew-border rounded-lg p-3">
      <div className={`text-[10px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded w-fit ${color}`}>
        {label}
      </div>
      <div className="text-xl font-bold text-brew-navy mt-2">{value}</div>
    </div>
  );
}

function ProductCard({ product, canEdit, onEdit, onDelete }) {
  const info = TYPE_INFO[product.type] || TYPE_INFO.bottle;
  const totalL = Number(product.total_volume_l);

  return (
    <div className="bg-white border border-brew-border rounded-lg overflow-hidden hover:shadow-md transition-shadow relative group">
      <div className="h-1.5" style={{ backgroundColor: product.recipe_color }} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold text-brew-navy leading-tight">
            {product.recipe_name || 'Без варки'}
          </h3>
          {canEdit && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onEdit}
                className="w-6 h-6 rounded hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-brew-orange"
                title="Редактировать"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={onDelete}
                className="w-6 h-6 rounded hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500"
                title="Списать"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{info.icon}</span>
          <span className="text-xs text-gray-500">
            {info.label} · {product.package_volume_l} л
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center pt-3 border-t border-brew-border">
          <div>
            <div className="text-[10px] text-gray-400 uppercase">Штук</div>
            <div className="text-lg font-bold text-brew-navy">{product.quantity}</div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase">Всего</div>
            <div className="text-lg font-bold text-brew-orange">{totalL.toFixed(0)} л</div>
          </div>
        </div>

        <div className="mt-2 space-y-1">
          {product.location && (
            <div className="text-[10px] text-gray-500 flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" />
              {product.location}
            </div>
          )}
          {product.bottled_at && (
            <div className="text-[10px] text-gray-500 flex items-center gap-1">
              <CalendarIcon className="w-2.5 h-2.5" />
              Разлито: {formatDate(product.bottled_at)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}