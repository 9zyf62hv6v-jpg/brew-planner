import { useState, useEffect } from 'react';
import {
  Beer, Package, ListTodo, Activity, Calendar, TrendingUp,
  Check, Clock, AlertCircle, ArrowRight, Droplet,
} from 'lucide-react';
import api from '../api';

export default function DashboardPage({ user, onNavigate, isMobile = false }) {
  const [data, setData] = useState({
    batches: [],
    tasks: [],
    products: [],
    recipes: [],
    measurements: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [batchesRes, tasksRes, productsRes, recipesRes] = await Promise.all([
          api.get('/batches'),
          api.get('/tasks'),
          api.get('/products'),
          api.get('/recipes'),
        ]);

        // Подтянем последние измерения для активных варок (максимум 5 запросов)
        const activeBatches = batchesRes.data.filter((b) => b.status === 'active').slice(0, 5);
        const measurementsResults = await Promise.all(
          activeBatches.map((b) =>
            api.get(`/batches/${b.id}/measurements`).then((r) => ({
              batch: b,
              measurements: r.data,
            })).catch(() => ({ batch: b, measurements: [] }))
          )
        );
        const allMeasurements = measurementsResults.flatMap((r) =>
          r.measurements.map((m) => ({ ...m, batch: r.batch }))
        );

        setData({
          batches: batchesRes.data,
          tasks: tasksRes.data,
          products: productsRes.data,
          recipes: recipesRes.data,
          measurements: allMeasurements,
        });
      } catch (err) {
        console.error('Ошибка загрузки дашборда:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const { batches, tasks, products, recipes, measurements } = data;

  // Метрики
  const stats = {
    activeBatches: batches.filter((b) => b.status === 'active').length,
    plannedBatches: batches.filter((b) => b.status === 'planned').length,
    doneBatches: batches.filter((b) => b.status === 'done').length,
    activeTasks: tasks.filter((t) => t.status === 'todo').length,
    overdueTasks: tasks.filter(
      (t) => t.status === 'todo' && t.due_date && new Date(t.due_date) < new Date(new Date().toDateString())
    ).length,
    totalProductsL: products.reduce((s, p) => s + Number(p.total_volume_l || 0), 0),
    kegsCount: products.filter((p) => p.type === 'keg').reduce((s, p) => s + p.quantity, 0),
    bottlesCount: products.filter((p) => p.type === 'bottle').reduce((s, p) => s + p.quantity, 0),
    recipesCount: recipes.length,
  };

  // Последние измерения (сортируем по дате, берём 5)
  const recentMeasurements = [...measurements]
    .sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at))
    .slice(0, 5);

  // Активные задачи (сортируем: высокий приоритет, потом по сроку, берём 5)
  const priorityWeight = { high: 0, normal: 1, low: 2 };
  const activeTasks = tasks
    .filter((t) => t.status === 'todo')
    .sort((a, b) => {
      const p = (priorityWeight[a.priority] || 1) - (priorityWeight[b.priority] || 1);
      if (p !== 0) return p;
      if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    })
    .slice(0, 5);

  // Активные варки (для мини-ганта)
  const activeOrPlanned = batches
    .filter((b) => b.status === 'active' || b.status === 'planned')
    .sort((a, b) => a.start_week - b.start_week)
    .slice(0, 5);

  const hour = new Date().getHours();
  const greeting =
    hour < 6 ? 'Доброй ночи' :
    hour < 12 ? 'Доброе утро' :
    hour < 18 ? 'Добрый день' :
    'Добрый вечер';

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-400">Загрузка дашборда...</div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-6xl">
      {/* Приветствие */}
      <div className="mb-5">
        <h1 className="text-lg sm:text-2xl font-semibold text-brew-navy">
          {greeting}, {user?.name?.split(' ')[0] || 'пивовар'}! 🍺
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Вот что происходит на пивоварне прямо сейчас
        </p>
      </div>

      {/* Основные метрики — 4 карточки */}
      <div className={`grid gap-3 mb-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-4'}`}>
        <MetricCard
          icon={Beer}
          label="Варок в работе"
          value={stats.activeBatches}
          sub={`${stats.plannedBatches} запланировано`}
          color="bg-orange-50 text-brew-orange"
          onClick={() => onNavigate('gantt')}
        />
        <MetricCard
          icon={ListTodo}
          label="Активных задач"
          value={stats.activeTasks}
          sub={stats.overdueTasks > 0 ? `${stats.overdueTasks} просрочено` : 'всё в порядке'}
          subColor={stats.overdueTasks > 0 ? 'text-red-500' : 'text-green-600'}
          color="bg-blue-50 text-blue-600"
          onClick={() => onNavigate('tasks')}
        />
        <MetricCard
          icon={Package}
          label="На складе, л"
          value={stats.totalProductsL.toLocaleString('ru-RU')}
          sub={`${stats.kegsCount} кег · ${stats.bottlesCount} бутылок`}
          color="bg-green-50 text-green-600"
          onClick={() => onNavigate('products')}
        />
        <MetricCard
          icon={Beer}
          label="Рецептов"
          value={stats.recipesCount}
          sub="в справочнике"
          color="bg-purple-50 text-purple-600"
          onClick={() => onNavigate('recipes')}
        />
      </div>

      {/* Основная сетка: слева — мини-гант и задачи, справа — измерения */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {/* Мини-Гант загрузки */}
        <div className={isMobile ? '' : 'lg:col-span-2'}>
          <Card
            title="Загрузка ЦКТ"
            icon={TrendingUp}
            action={{
              label: 'Планировщик',
              onClick: () => onNavigate('gantt'),
            }}
          >
            {activeOrPlanned.length === 0 ? (
              <EmptyState
                icon={Beer}
                text="Нет активных или запланированных варок"
                actionLabel="Создать варку"
                onAction={() => onNavigate('gantt')}
              />
            ) : (
              <MiniGantt batches={activeOrPlanned} />
            )}
          </Card>

          {/* Активные задачи */}
          <div className="mt-4">
            <Card
              title="Активные задачи"
              icon={ListTodo}
              badge={stats.activeTasks > 0 ? stats.activeTasks : null}
              action={{
                label: 'Все задачи',
                onClick: () => onNavigate('tasks'),
              }}
            >
              {activeTasks.length === 0 ? (
                <EmptyState
                  icon={Check}
                  text="Нет активных задач — всё сделано!"
                  actionLabel="Создать задачу"
                  onAction={() => onNavigate('tasks')}
                />
              ) : (
                <div className="space-y-2">
                  {activeTasks.map((task) => (
                    <TaskRow key={task.id} task={task} />
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Правая колонка: последние измерения */}
        <div>
          <Card
            title="Последние измерения"
            icon={Activity}
            action={{
              label: 'Журнал',
              onClick: () => onNavigate('journal'),
            }}
          >
            {recentMeasurements.length === 0 ? (
              <EmptyState
                icon={Droplet}
                text="Пока нет измерений"
                actionLabel="Открыть журнал"
                onAction={() => onNavigate('journal')}
              />
            ) : (
              <div className="space-y-2">
                {recentMeasurements.map((m) => (
                  <MeasurementRow key={m.id} measurement={m} />
                ))}
              </div>
            )}
          </Card>

          {/* Быстрые действия */}
          <div className="mt-4">
            <Card title="Быстрые действия" icon={ArrowRight}>
              <div className="space-y-1.5">
                <QuickAction
                  icon={Calendar}
                  label="Календарь"
                  onClick={() => onNavigate('calendar')}
                />
                <QuickAction
                  icon={Beer}
                  label="Инструменты"
                  onClick={() => onNavigate('tools')}
                />
                <QuickAction
                  icon={Beer}
                  label="Продукция"
                  onClick={() => onNavigate('products')}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, sub, subColor = 'text-gray-400', color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-brew-border rounded-lg p-3 sm:p-4 text-left hover:shadow-md transition-shadow group"
    >
      <div className={`w-9 h-9 rounded-md flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-[11px] text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-brew-navy leading-tight">{value}</div>
      {sub && <div className={`text-[10px] mt-1 ${subColor}`}>{sub}</div>}
    </button>
  );
}

function Card({ title, icon: Icon, badge, action, children }) {
  return (
    <div className="bg-white border border-brew-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-brew-border">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-brew-orange" />}
          <h3 className="text-sm font-semibold text-brew-navy">{title}</h3>
          {badge !== null && badge !== undefined && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brew-orange text-white font-medium">
              {badge}
            </span>
          )}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="text-[11px] text-brew-orange hover:underline flex items-center gap-0.5"
          >
            {action.label}
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="p-3 sm:p-4">{children}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, text, actionLabel, onAction }) {
  return (
    <div className="text-center py-6">
      <Icon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
      <p className="text-xs text-gray-500 mb-2">{text}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="text-[11px] text-brew-orange hover:underline"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function MiniGantt({ batches }) {
  // Мини-гант: показываем недели 36-52, но сжимаем в компактную полосу
  const START_WEEK = 36;
  const END_WEEK = 52;
  const TOTAL = END_WEEK - START_WEEK + 1;

  return (
    <div className="space-y-2">
      {batches.map((b) => {
        const startPct = ((b.start_week - START_WEEK) / TOTAL) * 100;
        const widthPct = ((b.end_week - b.start_week + 1) / TOTAL) * 100;
        const statusLabel = { planned: 'План', active: 'В работе', done: 'Готово' };

        return (
          <div key={b.id}>
            <div className="flex items-center justify-between mb-1 text-[11px]">
              <span className="text-brew-navy font-medium truncate">
                {b.recipe_name}
              </span>
              <span className="text-gray-400 text-[10px] flex-shrink-0 ml-2">
                {b.tank_name} · {statusLabel[b.status] || b.status}
              </span>
            </div>
            <div className="relative h-4 bg-gray-100 rounded overflow-hidden">
              <div
                className="absolute top-0 bottom-0 rounded transition-all"
                style={{
                  left: `${startPct}%`,
                  width: `${Math.max(widthPct, 4)}%`,
                  backgroundColor: b.recipe_color,
                  opacity: b.status === 'planned' ? 0.5 : 1,
                }}
              />
              {/* Линия "сегодня" */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                style={{ left: `${((42 - START_WEEK + 0.5) / TOTAL) * 100}%` }}
              />
            </div>
            <div className="text-[9px] text-gray-400 mt-0.5 flex justify-between">
              <span>неделя {b.start_week}</span>
              <span>неделя {b.end_week}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskRow({ task }) {
  const overdue = task.due_date && new Date(task.due_date) < new Date(new Date().toDateString());
  const priorityDot = {
    high: 'bg-red-500',
    normal: 'bg-blue-500',
    low: 'bg-gray-400',
  };

  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-brew-border last:border-b-0">
      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${priorityDot[task.priority] || priorityDot.normal}`} />
      <div className="min-w-0 flex-1">
        <div className="text-xs text-brew-navy font-medium truncate">{task.title}</div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.due_date && (
            <span className={`text-[10px] flex items-center gap-0.5 ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
              <Clock className="w-2.5 h-2.5" />
              {new Date(task.due_date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
              {overdue && ' · просрочено'}
            </span>
          )}
          {task.assigned_to_name && (
            <span className="text-[10px] text-gray-400 truncate">
              → {task.assigned_to_name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MeasurementRow({ measurement }) {
  const m = measurement;
  const date = new Date(m.measured_at);
  return (
    <div className="py-1.5 border-b border-brew-border last:border-b-0">
      <div className="flex items-center justify-between gap-2 mb-0.5">
        <span className="text-xs font-medium text-brew-navy truncate">
          {m.batch?.recipe_name || 'Без варки'}
        </span>
        <span className="text-[10px] text-gray-400 flex-shrink-0">
          {date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-gray-500 flex-wrap">
        {m.gravity && <span>SG <b className="text-blue-600">{Number(m.gravity).toFixed(3)}</b></span>}
        {m.temperature && <span>T <b className="text-red-500">{m.temperature}°C</b></span>}
        {m.ph && <span>pH <b className="text-brew-navy">{m.ph}</b></span>}
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-2 px-2 py-2 rounded hover:bg-gray-50 transition-colors text-left group"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-gray-400 group-hover:text-brew-orange" />
        <span className="text-xs text-brew-navy">{label}</span>
      </div>
      <ArrowRight className="w-3 h-3 text-gray-300 group-hover:text-brew-orange" />
    </button>
  );
}