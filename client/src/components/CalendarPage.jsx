import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../api';

const START_WEEK = 36;
const BASE_DATE = new Date('2026-09-01T00:00:00');

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEKDAYS_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

function weekToDate(week) {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() + (week - START_WEEK) * 7);
  return d;
}

function startOfMonth(year, month) {
  return new Date(year, month, 1);
}

function getMonthGrid(year, month) {
  const first = startOfMonth(year, month);
  const startDay = (first.getDay() + 6) % 7;
  const gridStart = new Date(first);
  gridStart.setDate(gridStart.getDate() - startDay);

  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateRange(batch) {
  const start = weekToDate(batch.start_week);
  const end = weekToDate(batch.end_week);
  end.setDate(end.getDate() + 6);
  return `${start.getDate()}.${start.getMonth() + 1} — ${end.getDate()}.${end.getMonth() + 1}`;
}

export default function CalendarPage({ user, isMobile = false, onBrewClick }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date('2026-09-01'));
  const [hoveredBatchId, setHoveredBatchId] = useState(null);

  const canEdit = user?.role === 'owner' || user?.role === 'brewer';

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const res = await api.get('/batches');
        setBatches(res.data);
      } catch (err) {
        console.error(err);
        setError('Не удалось загрузить варки');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = useMemo(() => getMonthGrid(year, month), [year, month]);
  const today = new Date();

  function goPrevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }
  function goNextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }
  function goToday() {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  const visibleBatches = batches.filter((b) => {
    const start = weekToDate(b.start_week);
    const end = weekToDate(b.end_week);
    end.setDate(end.getDate() + 6);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    return start <= monthEnd && end >= monthStart;
  });

  function getBatchesForDay(day) {
    return visibleBatches.filter((b) => {
      const start = weekToDate(b.start_week);
      const end = weekToDate(b.end_week);
      end.setDate(end.getDate() + 6);
      return day >= start && day <= end;
    });
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Загрузка календаря...</div>;
  }

  return (
    <div className="p-3 sm:p-6">
      {/* Заголовок + навигация */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="flex-1">
          <h1 className="text-base sm:text-lg font-semibold text-brew-navy">
            Календарь варок
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Варок в этом месяце: {visibleBatches.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goPrevMonth}
            className="w-9 h-9 rounded-md border border-brew-border bg-white hover:bg-gray-50 flex items-center justify-center text-gray-500"
            title="Предыдущий месяц"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={goToday}
            className="px-3 h-9 rounded-md border border-brew-border bg-white hover:bg-gray-50 text-xs text-brew-navy font-medium"
          >
            Сегодня
          </button>

          <div className="min-w-[140px] text-center text-sm font-semibold text-brew-navy">
            {MONTH_NAMES[month]} {year}
          </div>

          <button
            onClick={goNextMonth}
            className="w-9 h-9 rounded-md border border-brew-border bg-white hover:bg-gray-50 flex items-center justify-center text-gray-500"
            title="Следующий месяц"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-xs text-red-500 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      {/* ===== МОБИЛЬНЫЙ ВИД: список дней ===== */}
      {isMobile ? (
        <MobileDayList
          days={days}
          month={month}
          today={today}
          getBatchesForDay={getBatchesForDay}
          hoveredBatchId={hoveredBatchId}
          setHoveredBatchId={setHoveredBatchId}
          onBrewClick={onBrewClick}
          canEdit={canEdit}
        />
      ) : (
        <DesktopGrid
          days={days}
          month={month}
          today={today}
          getBatchesForDay={getBatchesForDay}
          hoveredBatchId={hoveredBatchId}
          setHoveredBatchId={setHoveredBatchId}
          onBrewClick={onBrewClick}
          canEdit={canEdit}
        />
      )}

      {/* Легенда */}
      {visibleBatches.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-gray-500">
          <span className="font-medium">Легенда:</span>
          {visibleBatches.slice(0, 8).map((b) => (
            <div key={b.id} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: b.recipe_color }}
              />
              <span className="truncate max-w-[120px]">{b.recipe_name}</span>
            </div>
          ))}
        </div>
      )}

      {visibleBatches.length === 0 && (
        <div className="mt-3 text-center text-xs text-gray-400">
          В этом месяце варок нет. Пролистай ◀ ▶ или создай новую варку в Планировщике.
        </div>
      )}
    </div>
  );
}

// ===== МОБИЛЬНЫЙ СПИСОК ДНЕЙ =====
function MobileDayList({ days, month, today, getBatchesForDay, onBrewClick, canEdit }) {
  // Показываем только дни текущего месяца
  const monthDays = days.filter((d) => d.getMonth() === month);

  return (
    <div className="bg-white border border-brew-border rounded-lg overflow-hidden">
      {monthDays.map((day, idx) => {
        const isToday = isSameDay(day, today);
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const dayBatches = getBatchesForDay(day);
        const weekdayShort = WEEKDAYS_SHORT[(day.getDay() + 6) % 7];

        return (
          <div
            key={idx}
            className={`border-b border-brew-border last:border-b-0 p-3 ${
              isToday ? 'bg-orange-50/50' : isWeekend ? 'bg-gray-50' : 'bg-white'
            }`}
          >
            {/* Дата дня */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  isToday
                    ? 'bg-brew-orange text-white'
                    : 'bg-gray-100 text-brew-navy'
                }`}
              >
                {day.getDate()}
              </div>
              <div>
                <div className={`text-xs font-medium ${isToday ? 'text-brew-orange' : 'text-brew-navy'}`}>
                  {weekdayShort}
                  {isToday && ' · сегодня'}
                </div>
              </div>
            </div>

            {/* Варки */}
            {dayBatches.length === 0 ? (
              <div className="text-[11px] text-gray-400 pl-10">
                Нет варок
              </div>
            ) : (
              <div className="space-y-1 pl-10">
                {dayBatches.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onBrewClick && canEdit && onBrewClick(b)}
                    disabled={!canEdit}
                    className={`w-full text-left text-xs text-white px-2 py-1.5 rounded truncate transition-opacity ${
                      canEdit ? 'hover:opacity-90 cursor-pointer' : 'cursor-default'
                    }`}
                    style={{ backgroundColor: b.recipe_color }}
                  >
                    <span className="font-medium">{b.recipe_name}</span>
                    <span className="text-white/80 ml-2 text-[10px]">
                      {b.tank_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ===== ДЕСКТОПНАЯ СЕТКА =====
function DesktopGrid({ days, month, today, getBatchesForDay, hoveredBatchId, setHoveredBatchId, onBrewClick, canEdit }) {
  return (
    <div className="bg-white border border-brew-border rounded-lg overflow-hidden">
      {/* Заголовки дней недели */}
      <div className="grid grid-cols-7 border-b border-brew-border bg-gray-50">
        {WEEKDAYS_SHORT.map((d, i) => (
          <div
            key={d}
            className={`px-2 py-2 text-center text-[11px] font-medium ${
              i >= 5 ? 'text-brew-orange' : 'text-gray-500'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Дни месяца */}
      <div className="grid grid-cols-7 grid-rows-6">
        {days.map((day, idx) => {
          const inMonth = day.getMonth() === month;
          const isToday = isSameDay(day, today);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const dayBatches = getBatchesForDay(day);

          return (
            <div
              key={idx}
              className={`border-b border-r border-brew-border p-1 overflow-hidden relative ${
                !inMonth ? 'bg-gray-50' : isWeekend ? 'bg-orange-50/30' : 'bg-white'
              }`}
              style={{
                minHeight: 110,
                borderRight: (idx + 1) % 7 === 0 ? 'none' : undefined,
                borderBottom: idx >= 35 ? 'none' : undefined,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[11px] font-medium w-5 h-5 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-brew-orange text-white'
                      : !inMonth
                      ? 'text-gray-300'
                      : 'text-brew-navy'
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>

              <div className="space-y-0.5">
                {dayBatches.slice(0, 3).map((b) => {
                  const isStart = isSameDay(day, weekToDate(b.start_week));
                  const isHovered = hoveredBatchId === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => onBrewClick && canEdit && onBrewClick(b)}
                      onMouseEnter={() => setHoveredBatchId(b.id)}
                      onMouseLeave={() => setHoveredBatchId(null)}
                      disabled={!canEdit}
                      title={`${b.recipe_name} · ${formatDateRange(b)} · ${b.tank_name}`}
                      className={`w-full text-left text-[9px] leading-tight px-1 py-0.5 rounded truncate transition-all ${
                        canEdit ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                      } ${isHovered ? 'ring-1 ring-brew-orange' : ''}`}
                      style={{
                        backgroundColor: b.recipe_color,
                        color: 'white',
                        marginLeft: isStart ? 0 : -4,
                      }}
                    >
                      {isStart && <span className="font-semibold">▶ </span>}
                      {b.recipe_name}
                    </button>
                  );
                })}
                {dayBatches.length > 3 && (
                  <div className="text-[9px] text-gray-400 pl-1">
                    +{dayBatches.length - 3} ещё
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}