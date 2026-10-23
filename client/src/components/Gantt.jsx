import { useEffect, useState, useRef } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import api from '../api';

const BASE_WEEK_WIDTH = 60;
const DAYS_WEEK_WIDTH = 140;
const START_WEEK = 36;
const END_WEEK = 52;
const TOTAL_WEEKS = END_WEEK - START_WEEK + 1;
const CURRENT_WEEK_OFFSET = 6.5;
const DRAG_THRESHOLD = 3;

const months = [
  { name: 'сент. 2026 г.', weeks: 4 },
  { name: 'окт. 2026 г.', weeks: 5 },
  { name: 'нояб. 2026 г.', weeks: 4 },
  { name: 'дек. 2026 г.', weeks: 4 },
];

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function findConflict(brews, tankId, startWeek, endWeek, excludeId) {
  return brews.find(
    (b) =>
      b.id !== excludeId &&
      b.tank_id === tankId &&
      !(b.end_week < startWeek || b.start > endWeek)
  );
}

export default function Gantt({
  reloadKey,
  onBrewClick,
  onChanged,
  canEdit = true,
  zoom = 1,
  viewMode = 'weeks',
  density = 'compact',
  displayMode = 'batches',
  filter = { statuses: [], recipeIds: [], tankIds: [] },
  isMobile = false, // 👈 НОВОЕ
}) {
  const [tanks, setTanks] = useState([]);
  const [brews, setBrews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [dragState, setDragState] = useState(null);
  const [collapsed, setCollapsed] = useState(isMobile); // 👈 На мобиле свёрнута по умолчанию

  const dragRef = useRef(null);
  const tanksRef = useRef([]);
  const brewsRef = useRef([]);
  const toastTimerRef = useRef(null);

  const WEEK_WIDTH = (viewMode === 'days' ? DAYS_WEEK_WIDTH : BASE_WEEK_WIDTH) * zoom;
  const ROW_HEIGHT = density === 'full' ? 44 : 32;

  useEffect(() => { tanksRef.current = tanks; }, [tanks]);
  useEffect(() => { brewsRef.current = brews; }, [brews]);

  function showToast(message) {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const [tanksRes, batchesRes] = await Promise.all([
          api.get('/tanks'),
          api.get('/batches'),
        ]);

        const tanksData = tanksRes.data;
        const batchesData = batchesRes.data;

        const tankIndexById = {};
        tanksData.forEach((t, i) => {
          tankIndexById[t.id] = i;
        });

        const brewsData = batchesData
          .filter((b) => tankIndexById[b.tank_id] !== undefined)
          .map((b) => ({
            id: b.id,
            tank: tankIndexById[b.tank_id],
            tank_id: b.tank_id,
            recipe_id: b.recipe_id,
            name: b.recipe_name,
            color: b.recipe_color,
            start: b.start_week,
            end_week: b.end_week,
            weeks: b.end_week - b.start_week + 1,
            volume: b.volume_l,
            volume_l: b.volume_l,
            status: b.status,
            bottling_week: b.bottling_week,
            bottling_volume_l: b.bottling_volume_l,
            outline: b.status === 'planned' && b.start_week >= 48,
          }));

        setTanks(tanksData);
        setBrews(brewsData);
      } catch (err) {
        console.error(err);
        setError('Не удалось загрузить данные. Проверь, запущен ли бэкенд.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reloadKey]);

  const visibleBrews = brews.filter((b) => {
    if (filter.statuses?.length && !filter.statuses.includes(b.status)) return false;
    if (filter.recipeIds?.length && !filter.recipeIds.includes(b.recipe_id)) return false;
    if (filter.tankIds?.length && !filter.tankIds.includes(b.tank_id)) return false;
    return true;
  });

  // 👇 Drag-and-drop отключаем на мобиле — на тач-устройствах таскать варки неудобно
  useEffect(() => {
    if (!canEdit || isMobile) return;

    function handleMouseMove(e) {
      const drag = dragRef.current;
      if (!drag) return;

      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      drag.dx = dx;
      drag.dy = dy;
      document.body.style.userSelect = 'none';

      if (drag.mode === 'bottling') {
        setDragState({ id: drag.brew.id, dx, dy: 0, conflict: false, mode: 'bottling' });
        return;
      }

      const weeksShift = Math.round(dx / WEEK_WIDTH);
      const tanksShift = Math.round(dy / ROW_HEIGHT);
      const tanksList = tanksRef.current;

      const previewStart = clamp(drag.origStart + weeksShift, START_WEEK, END_WEEK - drag.weeks + 1);
      const previewTankIdx = clamp(drag.origTank + tanksShift, 0, tanksList.length - 1);
      const previewEnd = previewStart + drag.weeks - 1;
      const previewTankId = tanksList[previewTankIdx]?.id;

      const conflict = previewTankId
        ? findConflict(brewsRef.current, previewTankId, previewStart, previewEnd, drag.brew.id)
        : null;

      setDragState({ id: drag.brew.id, dx, dy, conflict: !!conflict, mode: 'batch' });
    }

    async function handleMouseUp() {
      const drag = dragRef.current;
      if (!drag) return;
      dragRef.current = null;

      const dx = drag.dx || 0;
      const dy = drag.dy || 0;
      document.body.style.userSelect = '';

      const moved = Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD;

      if (!moved) {
        setDragState(null);
        onBrewClick(drag.brew);
        return;
      }

      if (drag.mode === 'bottling') {
        const weeksShift = Math.round(dx / WEEK_WIDTH);
        const minBottling = drag.brew.end_week;
        const newBottlingWeek = clamp(drag.origBottlingWeek + weeksShift, minBottling, END_WEEK);

        if (newBottlingWeek === drag.origBottlingWeek) {
          setDragState(null);
          return;
        }

        setDragState(null);
        try {
          await api.put(`/batches/${drag.brew.id}`, {
            recipe_id: drag.brew.recipe_id,
            tank_id: drag.brew.tank_id,
            volume_l: drag.brew.volume_l,
            start_week: drag.brew.start,
            end_week: drag.brew.end_week,
            status: drag.brew.status,
            bottling_week: newBottlingWeek,
            bottling_volume_l: drag.brew.bottling_volume_l,
          });
          if (onChanged) onChanged();
        } catch (err) {
          console.error(err);
          showToast(err.response?.data?.error || 'Не удалось переместить розлив');
        }
        return;
      }

      const weeksShift = Math.round(dx / WEEK_WIDTH);
      const tanksShift = Math.round(dy / ROW_HEIGHT);
      const tanksList = tanksRef.current;

      const newStart = clamp(drag.origStart + weeksShift, START_WEEK, END_WEEK - drag.weeks + 1);
      const newTank = clamp(drag.origTank + tanksShift, 0, tanksList.length - 1);
      const newEnd = newStart + drag.weeks - 1;
      const newTankId = tanksList[newTank]?.id;

      if (newStart === drag.origStart && newTank === drag.origTank) {
        setDragState(null);
        return;
      }

      if (!newTankId) {
        setDragState(null);
        return;
      }

      const conflict = findConflict(brewsRef.current, newTankId, newStart, newEnd, drag.brew.id);
      if (conflict) {
        setDragState(null);
        showToast(`Танк занят: «${conflict.name}» (недели ${conflict.start}–${conflict.end_week})`);
        return;
      }

      setDragState(null);

      let nextBottling = drag.brew.bottling_week;
      if (nextBottling && nextBottling < newEnd) {
        nextBottling = newEnd;
        showToast('Розлив сдвинут вместе с варкой');
      }

      try {
        await api.put(`/batches/${drag.brew.id}`, {
          recipe_id: drag.brew.recipe_id,
          tank_id: newTankId,
          volume_l: drag.brew.volume_l,
          start_week: newStart,
          end_week: newEnd,
          status: drag.brew.status,
          bottling_week: nextBottling,
          bottling_volume_l: drag.brew.bottling_volume_l,
        });
        if (onChanged) onChanged();
      } catch (err) {
        console.error(err);
        showToast(err.response?.data?.error || 'Не удалось переместить варку');
      }
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [onBrewClick, onChanged, canEdit, WEEK_WIDTH, ROW_HEIGHT, displayMode, isMobile]);

  function startDrag(e, brew, mode) {
    if (!canEdit || isMobile) return; // 👈 На мобиле drag отключён
    if (mode === 'bottling' && !brew.bottling_week) return;
    e.preventDefault();
    dragRef.current = {
      brew,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origStart: brew.start,
      origBottlingWeek: brew.bottling_week,
      origTank: brew.tank,
      weeks: mode === 'bottling' ? 1 : brew.weeks,
      dx: 0,
      dy: 0,
    };
    setDragState({ id: brew.id, dx: 0, dy: 0, conflict: false, mode });
  }

  if (loading) {
    return (
      <div className="bg-white border border-brew-border rounded-lg m-2 sm:m-3 p-10 text-center text-gray-400">
        Загрузка данных...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-brew-border rounded-lg m-2 sm:m-3 p-10 text-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="bg-white border border-brew-border rounded-lg m-2 sm:m-3 flex overflow-hidden">
        {!collapsed && (
          <LeftPanel
            tanks={tanks}
            brews={brews}
            currentWeek={Math.floor(START_WEEK + CURRENT_WEEK_OFFSET)}
            rowHeight={ROW_HEIGHT}
            isMobile={isMobile}
            onCollapse={() => setCollapsed(true)}
          />
        )}
        <Timeline
          tanks={tanks}
          brews={visibleBrews}
          dragState={dragState}
          onStartDrag={startDrag}
          canEdit={canEdit}
          weekWidth={WEEK_WIDTH}
          rowHeight={ROW_HEIGHT}
          viewMode={viewMode}
          displayMode={displayMode}
          collapsed={collapsed}
          isMobile={isMobile}
          onExpand={() => setCollapsed(false)}
          onBrewClick={onBrewClick}
        />
      </div>

      {toast && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 bg-red-500 text-white px-4 py-3 rounded shadow-lg z-[60] text-sm max-w-md mx-auto">
          {toast}
        </div>
      )}
    </div>
  );
}

function LeftPanel({ tanks, brews, rowHeight, onCollapse, isMobile }) {
  // Считаем, сколько уникальных танков занято на текущей неделе
  const busyCount = (() => {
    const currentWeek = Math.floor(START_WEEK + CURRENT_WEEK_OFFSET);
    const busyTankIds = new Set();
    brews.forEach((b) => {
      if (b.start <= currentWeek && b.end_week >= currentWeek) {
        busyTankIds.add(b.tank_id);
      }
    });
    return busyTankIds.size;
  })();

  return (
    <div className={`${isMobile ? 'w-36' : 'w-56'} flex-shrink-0 border-r border-brew-border bg-white`}>
      <div
        className="px-2 sm:px-3 py-2 border-b border-brew-border flex items-start justify-between"
        style={{ height: 70 + 24 + 32 }}
      >
        <div className="min-w-0">
          <div className="text-xs font-semibold text-brew-navy truncate">
            {isMobile ? 'ЦКТ' : 'Площадки и ЦКТ'}
          </div>
          <div className="text-[10px] text-gray-400 mt-1 truncate">
            Занято сегодня: {busyCount} из {tanks.length}
          </div>
        </div>
        <button
          onClick={onCollapse}
          title="Свернуть панель"
          className="w-5 h-5 rounded border border-brew-border flex items-center justify-center text-gray-400 hover:bg-gray-50 flex-shrink-0"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
      </div>

      <div className="h-8 px-2 sm:px-3 flex items-center border-b border-brew-border bg-gray-50 gap-2">
        <span className="text-xs text-brew-navy font-medium">Основная</span>
        <span className="text-[10px] text-gray-400">{tanks.length} ЦКТ</span>
      </div>

      {tanks.map((tank) => (
        <div
          key={tank.id}
          className="px-2 sm:px-3 flex items-center justify-between border-b border-brew-border"
          style={{ height: rowHeight }}
        >
          <span className="text-xs text-brew-navy truncate">{tank.name}</span>
          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">{tank.volume_hl} гл</span>
        </div>
      ))}
    </div>
  );
}

function Timeline({
  tanks,
  brews,
  dragState,
  onStartDrag,
  canEdit,
  weekWidth,
  rowHeight,
  viewMode,
  displayMode,
  collapsed,
  isMobile,
  onExpand,
  onBrewClick,
}) {
  const totalWidth = TOTAL_WEEKS * weekWidth;
  const isBottlingMode = displayMode === 'bottling';

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden touch-pan-x touch-pan-y">
      <div className="relative" style={{ width: totalWidth, minWidth: '100%' }}>
        {collapsed && (
          <button
            onClick={onExpand}
            title="Развернуть панель ЦКТ"
            className={`fixed z-20 w-6 h-6 rounded-r-md bg-white border border-brew-border border-l-0 flex items-center justify-center text-gray-400 hover:bg-gray-50 ${
              isMobile ? 'top-[130px] left-0' : 'top-[210px] left-14'
            }`}
          >
            {isMobile ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}

        <div className="h-5 flex items-center justify-center border-b border-brew-border">
          <span className="text-xs font-semibold text-brew-orange">2026</span>
        </div>

        <div className="h-6 flex border-b border-brew-border">
          {months.map((m) => (
            <div
              key={m.name}
              className="flex items-center justify-center border-r border-brew-border text-[11px] text-gray-500"
              style={{ width: m.weeks * weekWidth }}
            >
              {m.name}
            </div>
          ))}
        </div>

        <div className="h-8 flex border-b border-brew-border">
          {Array.from({ length: TOTAL_WEEKS }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-center border-r border-brew-border text-[11px] text-gray-400 overflow-hidden"
              style={{ width: weekWidth }}
            >
              {viewMode === 'days' ? (
                <div className="flex w-full h-full">
                  {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                    <div
                      key={d}
                      className="flex-1 flex items-center justify-center border-r border-brew-border last:border-r-0 text-[9px]"
                    >
                      {d}
                    </div>
                  ))}
                </div>
              ) : (
                START_WEEK + i
              )}
            </div>
          ))}
        </div>

        <div className="relative">
          <div className="h-8 border-b border-brew-border bg-gray-50" />

          {tanks.map((tank, idx) => (
            <div
              key={tank.id}
              className="border-b border-brew-border relative"
              style={{ height: rowHeight }}
            >
              {Array.from({ length: TOTAL_WEEKS }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-r border-brew-border"
                  style={{ left: (i + 1) * weekWidth - 1 }}
                />
              ))}

              {viewMode === 'days' &&
                Array.from({ length: TOTAL_WEEKS * 7 }).map((_, i) => (
                  <div
                    key={`d-${i}`}
                    className="absolute top-0 bottom-0 border-r border-brew-border opacity-40"
                    style={{ left: (i + 1) * (weekWidth / 7) - 1 }}
                  />
                ))}

              {/* Варки */}
              {brews
                .filter((b) => b.tank === idx)
                .map((brew) => {
                  const isDragging =
                    dragState && dragState.id === brew.id && dragState.mode === 'batch';
                  return (
                    <BrewBar
                      key={brew.id}
                      brew={brew}
                      isDragging={isDragging}
                      hasConflict={isDragging && dragState.conflict}
                      dx={isDragging ? dragState.dx : 0}
                      dy={isDragging ? dragState.dy : 0}
                      onStartDrag={onStartDrag}
                      canEdit={canEdit}
                      interactive={!isBottlingMode}
                      dimmed={isBottlingMode}
                      isMobile={isMobile}
                      weekWidth={weekWidth}
                      rowHeight={rowHeight}
                      onBrewClick={onBrewClick}
                    />
                  );
                })}

              {/* Розливы */}
              {isBottlingMode &&
                brews
                  .filter((b) => b.tank === idx && b.bottling_week)
                  .map((brew) => {
                    const isDragging =
                      dragState && dragState.id === brew.id && dragState.mode === 'bottling';
                    return (
                      <BottlingBar
                        key={`bot-${brew.id}`}
                        brew={brew}
                        isDragging={isDragging}
                        dx={isDragging ? dragState.dx : 0}
                        onStartDrag={onStartDrag}
                        canEdit={canEdit}
                        isMobile={isMobile}
                        weekWidth={weekWidth}
                        rowHeight={rowHeight}
                        onBrewClick={onBrewClick}
                      />
                    );
                  })}
            </div>
          ))}

          <div
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
            style={{ left: CURRENT_WEEK_OFFSET * weekWidth }}
          />
        </div>
      </div>
    </div>
  );
}

function BrewBar({
  brew,
  isDragging,
  hasConflict,
  dx,
  dy,
  onStartDrag,
  canEdit,
  interactive,
  dimmed,
  isMobile,
  weekWidth,
  rowHeight,
  onBrewClick,
}) {
  const left = (brew.start - START_WEEK) * weekWidth + 3;
  const width = brew.weeks * weekWidth - 6;
  const isOutline = brew.outline;

  let boxShadow;
  if (isDragging) {
    boxShadow = hasConflict
      ? '0 0 0 3px #EF4444, 0 4px 12px rgba(239,68,68,0.35)'
      : '0 4px 12px rgba(0,0,0,0.2)';
  }

  const draggable = canEdit && interactive && !isMobile;
  const cursor = draggable
    ? isDragging
      ? 'cursor-grabbing'
      : 'cursor-grab'
    : 'cursor-pointer';

  const fontSize = rowHeight < 36 ? '10px' : '11px';

  // На мобиле — только клик (открывает модалку), без drag
  const handleMouseDown = draggable
    ? (e) => onStartDrag(e, brew, 'batch')
    : undefined;

  const handleClick = !draggable && canEdit
    ? () => onBrewClick(brew)
    : undefined;

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className={`absolute rounded flex items-center px-2 font-medium overflow-hidden whitespace-nowrap transition-opacity select-none ${
        isOutline ? 'border-2 border-dashed bg-transparent' : 'text-white'
      } ${cursor} ${isDragging ? 'opacity-90' : draggable ? 'hover:opacity-90' : ''}`}
      style={{
        top: 2,
        bottom: 2,
        left,
        width,
        fontSize,
        transform: isDragging ? `translate(${dx}px, ${dy}px)` : undefined,
        zIndex: isDragging ? 20 : 1,
        boxShadow,
        backgroundColor: isOutline ? 'transparent' : brew.color,
        borderColor: isOutline ? brew.color : undefined,
        color: isOutline ? brew.color : 'white',
        opacity: dimmed && !isDragging ? 0.12 : isDragging ? 0.9 : 1,
      }}
      title={brew.name}
    >
      {!dimmed && (
        <span className="truncate pointer-events-none">
          {brew.name}
          {!isMobile && ` | ${brew.volume.toLocaleString('ru-RU')} л`}
        </span>
      )}
    </div>
  );
}

function BottlingBar({
  brew,
  isDragging,
  dx,
  onStartDrag,
  canEdit,
  isMobile,
  weekWidth,
  rowHeight,
  onBrewClick,
}) {
  const left = (brew.bottling_week - START_WEEK) * weekWidth + 3;
  const width = weekWidth - 6;

  const draggable = canEdit && !isMobile;
  const cursor = draggable
    ? isDragging
      ? 'cursor-grabbing'
      : 'cursor-grab'
    : 'cursor-pointer';

  const volumeText = brew.bottling_volume_l
    ? `${brew.bottling_volume_l.toLocaleString('ru-RU')} л`
    : `${brew.volume_l.toLocaleString('ru-RU')} л`;

  const handleMouseDown = draggable
    ? (e) => onStartDrag(e, brew, 'bottling')
    : undefined;

  const handleClick = !draggable && canEdit
    ? () => onBrewClick(brew)
    : undefined;

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className={`absolute rounded flex items-center justify-center gap-1 font-medium text-white select-none ${cursor} ${
        isDragging ? 'opacity-95' : 'hover:opacity-90'
      }`}
      style={{
        top: 3,
        bottom: 3,
        left,
        width,
        fontSize: rowHeight < 36 ? '10px' : '11px',
        backgroundColor: brew.color,
        boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.25)' : '0 1px 3px rgba(0,0,0,0.15)',
        transform: isDragging ? `translate(${dx}px, 0)` : undefined,
        zIndex: isDragging ? 20 : 5,
      }}
      title={`Розлив: ${brew.name}`}
    >
      <Package className="w-3 h-3 pointer-events-none" />
      {!isMobile && weekWidth >= 80 && (
        <span className="truncate pointer-events-none">{volumeText}</span>
      )}
    </div>
  );
}