// Расчёты пивоваренных параметров

/**
 * Расчёт OG (начальной плотности)
 * Формула: points = Σ(kg × PPG × efficiency) / (volume_l / 3.785), PPG = (SG-1)*1000
 * Проще: OG ≈ 1 + ((Σ kg × (SG-1)×1000 × efficiency/100) × 0.08345) / volume_l
 */
export function calcOG(ingredients, volume_l, efficiency) {
  const malts = ingredients.filter(
    (i) => i.type === 'malt' && i.potential_sg && i.amount
  );
  if (malts.length === 0 || !volume_l) return null;

  let totalPoints = 0;
  for (const m of malts) {
    const ppg = (Number(m.potential_sg) - 1) * 1000; // 1.037 → 37
    totalPoints +=
      Number(m.amount) * ppg * (Number(efficiency) / 100);
  }
    // Коэффициент перевода imperial→metric: 3.785/0.4536 ≈ 8.345
  const points = (totalPoints * 8.345) / Number(volume_l);
  return Number((1 + points / 1000).toFixed(3));
}

/**
 * Расчёт FG (конечной плотности)
 * FG ≈ 1 + (OG_points × (1 - attenuation/100)) / 1000
 */
export function calcFG(og, ingredients) {
  if (!og) return null;
  const yeasts = ingredients.filter(
    (i) => i.type === 'yeast' && i.attenuation
  );
  const avgAtt =
    yeasts.length > 0
      ? yeasts.reduce((s, y) => s + Number(y.attenuation), 0) / yeasts.length
      : 75; // default attenuation
  const ogPoints = (Number(og) - 1) * 1000;
  const fgPoints = ogPoints * (1 - avgAtt / 100);
  return Number((1 + fgPoints / 1000).toFixed(3));
}

/**
 * Расчёт ABV (алкоголь в % объёма)
 * ABV = (OG - FG) × 131.25
 */
export function calcABV(og, fg) {
  if (!og || !fg) return null;
  const abv = (Number(og) - Number(fg)) * 131.25;
  return Number(abv.toFixed(2));
}

/**
 * Расчёт IBU (горечь)
 * Формула Tinseth:
 * IBU = (amount_g × (AA/100) × utilization × 1_000_000) / volume_l / 1000
 * utilization = (1.65 × 0.000125^(OG-1)) × ((1 - e^(-0.04×time)) / 4.15)
 */
export function calcIBU(ingredients, volume_l, og) {
  const hops = ingredients.filter(
    (i) =>
      i.type === 'hop' &&
      i.alpha_acid &&
      i.amount &&
      i.boil_time_min !== null &&
      i.boil_time_min !== undefined
  );
  if (hops.length === 0 || !volume_l) return null;

  const ogForCalc = og || 1.05;
  let totalIBU = 0;

  for (const h of hops) {
    const aa = Number(h.alpha_acid) / 100;
    const amountG = Number(h.amount);
    const timeMin = Number(h.boil_time_min);
    const util =
      1.65 *
      Math.pow(0.000125, ogForCalc - 1) *
      ((1 - Math.exp(-0.04 * timeMin)) / 4.15);
    totalIBU += (amountG * aa * util * 1_000_000) / (volume_l * 1000);
  }

  return Number(totalIBU.toFixed(1));
}

/**
 * Расчёт цвета SRM (упрощённо) — не обязательно
 * Использовать не будем пока
 */

/**
 * Полный расчёт всех параметров
 */
export function recalcAll(ingredients, volume_l, efficiency, currentOG) {
  const og = currentOG || calcOG(ingredients, volume_l, efficiency);
  const fg = calcFG(og, ingredients);
  const abv = calcABV(og, fg);
  const ibu = calcIBU(ingredients, volume_l, og);
  return { og, fg, abv, ibu };
}

/**
 * Форматирование плотности для отображения
 */
export function formatGravity(sg) {
  if (!sg) return '—';
  return Number(sg).toFixed(3);
}