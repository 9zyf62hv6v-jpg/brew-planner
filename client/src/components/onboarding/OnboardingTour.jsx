// client/src/components/onboarding/OnboardingTour.jsx
import { useEffect, useState, useLayoutEffect, useRef } from 'react';
import { TOUR_STEPS } from './tourSteps';

const STORAGE_PREFIX = 'brewclone_tour_';

export default function OnboardingTour({ user, onHelp }) {
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const tooltipRef = useRef(null);
  const [, forceLayout] = useState(0);

  const steps = (user && TOUR_STEPS[user.role]) || [];
  const step = isActive ? steps[stepIndex] : null;

  // 🚀 Автозапуск при первом входе
  useEffect(() => {
    if (!user?.id || steps.length === 0) return;
    const key = `${STORAGE_PREFIX}${user.id}`;
    if (localStorage.getItem(key)) return;
    const t = setTimeout(() => setIsActive(true), 800);
    return () => clearTimeout(t);
  }, [user?.id, steps.length]);

  // 📐 Пересчёт позиции цели
  useLayoutEffect(() => {
    if (!step) {
      setRect(null);
      return;
    }
    const update = () => {
      const el = document.querySelector(step.selector);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      // Ограничиваем границы видимой областью (для больших контейнеров вроде Gantt)
      const top = Math.max(0, r.top);
      const left = Math.max(0, r.left);
      const bottom = Math.min(window.innerHeight, r.bottom);
      const right = Math.min(window.innerWidth, r.right);
      setRect({
        top,
        left,
        bottom,
        right,
        width: right - left,
        height: bottom - top,
      });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const interval = setInterval(update, 300);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      clearInterval(interval);
    };
  }, [step]);

  // Когда тултип отрисовался — пересчитать позицию (для точной высоты)
  useLayoutEffect(() => {
    if (isActive) forceLayout((n) => n + 1);
  }, [isActive, stepIndex]);

  // 🔧 API для перезапуска из «Помощи»
  useEffect(() => {
    window.__brewTourRestart = () => {
      if (user?.id) localStorage.removeItem(`${STORAGE_PREFIX}${user.id}`);
      setStepIndex(0);
      setIsActive(true);
    };
    return () => {
      delete window.__brewTourRestart;
    };
  }, [user?.id]);

  const finish = () => {
    if (user?.id) localStorage.setItem(`${STORAGE_PREFIX}${user.id}`, '1');
    setIsActive(false);
  };

  const next = () => {
    if (stepIndex >= steps.length - 1) finish();
    else setStepIndex((i) => i + 1);
  };

  if (!isActive || !step) return null;

  // 🧭 Позиционирование тултипа
  const tooltipW = 340;
  const tooltipH = tooltipRef.current?.offsetHeight || 180;
  let top = window.innerHeight / 2 - tooltipH / 2;
  let left = window.innerWidth / 2 - tooltipW / 2;

  if (rect) {
    const pos = step.position || 'bottom';
    if (pos === 'bottom') {
      top = rect.bottom + 12;
      left = rect.left;
    } else if (pos === 'top') {
      top = rect.top - tooltipH - 12;
      left = rect.left;
    } else if (pos === 'right') {
      top = rect.top;
      left = rect.right + 12;
    } else if (pos === 'left') {
      top = rect.top;
      left = rect.left - tooltipW - 12;
    }
    left = Math.max(12, Math.min(left, window.innerWidth - tooltipW - 12));
    top = Math.max(12, Math.min(top, window.innerHeight - tooltipH - 12));
  }

  return (
    <>
      {/* Затемнение вокруг цели через box-shadow-трюк */}
      {rect ? (
        <div
          className="fixed pointer-events-none z-[100] transition-all duration-200 rounded-lg"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-black/55 z-[100] pointer-events-none" />
      )}

      {/* Тултип */}
      <div
        ref={tooltipRef}
        className="fixed z-[101] w-[340px] bg-white rounded-xl shadow-2xl border border-brew-orange p-4"
        style={{ top, left }}
      >
        <div className="flex items-start justify-between mb-1 gap-2">
          <h3 className="font-semibold text-brew-navy text-sm leading-tight">
            {step.title}
          </h3>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {step.section} · {stepIndex + 1}/{steps.length}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-4 leading-snug">{step.text}</p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => { onHelp?.(); finish(); }}
              className="text-xs px-3 py-1.5 rounded-lg border border-brew-border text-brew-navy hover:bg-brew-bg transition-colors"
            >
              Справка
            </button>
            <button
              onClick={finish}
              className="text-xs px-3 py-1.5 rounded-lg border border-brew-border text-brew-navy hover:bg-brew-bg transition-colors"
            >
              Не показывать
            </button>
          </div>
          <button
            onClick={next}
            className="text-xs px-4 py-1.5 rounded-lg bg-brew-orange text-white font-medium hover:opacity-90 transition-opacity"
          >
            Далее
          </button>
        </div>
      </div>
    </>
  );
}