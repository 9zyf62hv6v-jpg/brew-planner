import { useState } from 'react';
import {
  Calculator, Droplet, FlaskConical, Sparkles, RefreshCw,
} from 'lucide-react';

export default function ToolsPage({ isMobile = false }) {
  return (
    <div className="p-3 sm:p-6">
      <div className="mb-4">
        <h1 className="text-base sm:text-lg font-semibold text-brew-navy">
          Инструменты пивовара
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          4 калькулятора — считай прямо в браузере, без интернета
        </p>
      </div>

      <div className={`grid gap-3 sm:gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
        <IBUCalculator />
        <ABVCalculator />
        <CarbonationCalculator />
        <DilutionCalculator />
      </div>
    </div>
  );
}

// ============ IBU ============
function IBUCalculator() {
  const [form, setForm] = useState({
    amount_g: 30,
    alpha: 5,
    time_min: 60,
    volume_l: 20,
    og: 1.050,
  });

  const ibu = (() => {
    const { amount_g, alpha, time_min, volume_l, og } = form;
    if (!amount_g || !alpha || !time_min || !volume_l || !og) return 0;
    const aa = Number(alpha) / 100;
    const util =
      1.65 *
      Math.pow(0.000125, Number(og) - 1) *
      ((1 - Math.exp(-0.04 * Number(time_min))) / 4.15);
    const result = (Number(amount_g) * aa * util * 1_000_000) / (Number(volume_l) * 1000);
    return Number(result.toFixed(1));
  })();

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <ToolCard
      icon={Sparkles}
      title="IBU — горечь"
      subtitle="Формула Tinseth"
      result={`${ibu} IBU`}
      color="text-red-500"
    >
      <NumField label="Хмель, г" value={form.amount_g} onChange={(v) => update('amount_g', v)} />
      <NumField label="α-кислота, %" value={form.alpha} onChange={(v) => update('alpha', v)} step="0.1" />
      <NumField label="Кипячение, мин" value={form.time_min} onChange={(v) => update('time_min', v)} />
      <NumField label="Объём, л" value={form.volume_l} onChange={(v) => update('volume_l', v)} />
      <NumField label="OG" value={form.og} onChange={(v) => update('og', v)} step="0.001" />
    </ToolCard>
  );
}

// ============ ABV ============
function ABVCalculator() {
  const [form, setForm] = useState({ og: 1.050, fg: 1.010 });

  const abv = (() => {
    const { og, fg } = form;
    if (!og || !fg) return 0;
    return Number(((Number(og) - Number(fg)) * 131.25).toFixed(2));
  })();

  const attenuation = (() => {
    const { og, fg } = form;
    if (!og || !fg || Number(og) <= 1) return 0;
    return Number((((Number(og) - Number(fg)) / (Number(og) - 1)) * 100).toFixed(1));
  })();

  return (
    <ToolCard
      icon={Droplet}
      title="ABV — алкоголь"
      subtitle="По начальной и конечной плотности"
      result={`${abv}% · аттенюация ${attenuation}%`}
      color="text-blue-500"
    >
      <NumField label="OG (нач.)" value={form.og} onChange={(v) => setForm((f) => ({ ...f, og: v }))} step="0.001" />
      <NumField label="FG (кон.)" value={form.fg} onChange={(v) => setForm((f) => ({ ...f, fg: v }))} step="0.001" />
    </ToolCard>
  );
}

// ============ Карбонизация ============
function CarbonationCalculator() {
  const [form, setForm] = useState({
    volume_l: 20,
    temp_c: 20,
    target_co2: 2.4, // объёмы CO2 (2.2–2.6 для большинства элей)
  });

  // Формула: sugar_g = (target_co2 - residual_co2) * volume_l * 3.79
  // residual_co2 = 3.0378 - 0.050062*T + 0.00026555*T^2
  const result = (() => {
    const { volume_l, temp_c, target_co2 } = form;
    if (!volume_l || !target_co2) return { sugar_g: 0, sugar_kg: 0 };
    const t = Number(temp_c) || 20;
    const residual = 3.0378 - 0.050062 * t + 0.00026555 * t * t;
    const target = Number(target_co2);
    const sugar_g = Math.max(0, (target - residual) * Number(volume_l) * 3.79);
    return {
      sugar_g: Number(sugar_g.toFixed(0)),
      sugar_kg: Number((sugar_g / 1000).toFixed(3)),
    };
  })();

  return (
    <ToolCard
      icon={FlaskConical}
      title="Карбонизация"
      subtitle="Сколько сахара для прайминга"
      result={`${result.sugar_g} г (${result.sugar_kg} кг)`}
      color="text-yellow-600"
    >
      <NumField label="Объём, л" value={form.volume_l} onChange={(v) => setForm((f) => ({ ...f, volume_l: v }))} />
      <NumField label="Температура, °C" value={form.temp_c} onChange={(v) => setForm((f) => ({ ...f, temp_c: v }))} />
      <NumField label="Целевое CO₂, объёмов" value={form.target_co2} onChange={(v) => setForm((f) => ({ ...f, target_co2: v }))} step="0.1" />
      <div className="text-[10px] text-gray-400 mt-1">
        Обычные эли: 2.2–2.6 · Лагеры: 2.4–2.7 · Пшеничные: 2.8–3.2
      </div>
    </ToolCard>
  );
}

// ============ Разведение ============
function DilutionCalculator() {
  const [form, setForm] = useState({
    volume_l: 20,
    og_current: 1.060,
    og_target: 1.050,
  });

  // V_target = V_current × (OG_current - 1) / (OG_target - 1)
  // Добавить воды = V_target - V_current
  const result = (() => {
    const { volume_l, og_current, og_target } = form;
    if (!volume_l || !og_current || !og_target) return { final_l: 0, water_l: 0 };
    const currPts = (Number(og_current) - 1) * 1000;
    const targetPts = (Number(og_target) - 1) * 1000;
    if (targetPts <= 0 || currPts <= targetPts) {
      return { final_l: 0, water_l: 0, error: 'Целевая плотность должна быть ниже текущей' };
    }
    const final_l = (Number(volume_l) * currPts) / targetPts;
    const water_l = final_l - Number(volume_l);
    return {
      final_l: Number(final_l.toFixed(2)),
      water_l: Number(water_l.toFixed(2)),
    };
  })();

  return (
    <ToolCard
      icon={RefreshCw}
      title="Разведение"
      subtitle="Разбавить крепкое сусло/пиво"
      result={
        result.error
          ? result.error
          : `Итог: ${result.final_l} л, долить ${result.water_l} л воды`
      }
      color="text-green-600"
      smallResult={!!result.error}
    >
      <NumField label="Текущий объём, л" value={form.volume_l} onChange={(v) => setForm((f) => ({ ...f, volume_l: v }))} />
      <NumField label="Текущая OG" value={form.og_current} onChange={(v) => setForm((f) => ({ ...f, og_current: v }))} step="0.001" />
      <NumField label="Целевая OG" value={form.og_target} onChange={(v) => setForm((f) => ({ ...f, og_target: v }))} step="0.001" />
    </ToolCard>
  );
}

// ============ Вспомогательные ============
function ToolCard({ icon: Icon, title, subtitle, result, color, children, smallResult }) {
  return (
    <div className="bg-white border border-brew-border rounded-lg p-4 flex flex-col">
      <div className="flex items-start gap-2 mb-3">
        <div className={`w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center flex-shrink-0 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-brew-navy">{title}</div>
          <div className="text-[11px] text-gray-400">{subtitle}</div>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        {children}
      </div>

      <div
        className={`mt-auto pt-3 border-t border-brew-border text-center ${
          smallResult ? 'text-xs text-red-500' : 'text-base font-semibold text-brew-orange'
        }`}
      >
        {result}
      </div>
    </div>
  );
}

function NumField({ label, value, onChange, step = '1' }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-xs text-gray-500 flex-1 min-w-0 truncate">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        step={step}
        className="w-24 h-9 px-2 rounded border border-brew-border text-sm text-right"
      />
    </label>
  );
}