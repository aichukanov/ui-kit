/**
 * Палитра аватаров-заглушек.
 *
 * Цвета взяты из дизайн-системы Fluent UI (Microsoft) — файл
 * `packages/tokens/src/global/colors.ts` в microsoft/fluentui, значения
 * `primary` соответствующих shared colors. Своя палитра до этого подбиралась
 * вручную и выглядела грязно: затемнение ради белого текста давало кирпичный
 * и оливковый.
 *
 * Взяты НЕ все 30 оттенков Fluent, а 16:
 *  - выброшены серые (anchor, mink, beige, platinum) — аватар не должен
 *    выглядеть отключённым;
 *  - выброшены мутные (brown, brass, gold);
 *  - выброшены светлые (peach, marigold, seafoam, lightTeal, gold, pink) —
 *    с белым текстом они дают 2.1–3.8:1;
 *  - из близких оттенков оставлен один (red при cranberry, plum при grape).
 *
 * Инициалы ВСЕГДА белые: выбор между светлым и тёмным текстом — источник
 * ошибок (у мид-тоновых цветов оба варианта плохи), и тёмные буквы на цветном
 * квадрате выглядят хуже. Поэтому требование к палитре ровно одно: каждый цвет
 * обязан давать с белым не меньше 4.5:1.
 *
 * Замеры в комментариях — пересчитывайте при правке. Проверяет тест
 * `tests/unit/avatar-contrast.spec.ts` в приложении-потребителе.
 */
export const AVATAR_TEXT_COLOR = '#ffffff';

export const AVATAR_COLORS = [
	'#c50f1f', // Cranberry — 6.07:1
	'#750b1c', // Dark red — 11.53:1
	'#ca5010', // Pumpkin — 4.50:1 (ровно на границе, запаса нет — не осветлять)
	'#498205', // Forest — 4.69:1
	'#0b6a0b', // Dark green — 6.82:1
	'#038387', // Teal — 4.57:1
	'#005b70', // Steel — 7.69:1
	'#0078d4', // Blue — 4.53:1
	'#004e8c', // Royal blue — 8.51:1
	'#0027b4', // Navy — 10.77:1
	'#4f6bed', // Cornflower — 4.51:1
	'#7160e8', // Lavender — 4.63:1
	'#5c2e91', // Purple — 9.31:1
	'#881798', // Grape — 8.01:1
	'#b146c2', // Lilac — 4.64:1
	'#bf0077', // Magenta — 6.03:1
] as const;

/** Относительная яркость sRGB по WCAG 2.1 */
export function relativeLuminance(hex: string): number {
	const channels = [1, 3, 5].map((offset) => {
		const value = parseInt(hex.substring(offset, offset + 2), 16) / 255;
		return value <= 0.03928
			? value / 12.92
			: Math.pow((value + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** Контраст двух цветов по WCAG 2.1 */
export function contrastRatio(a: string, b: string): number {
	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * djb2 — быстрый и стабильный хеш. Важно именно постоянство: один и тот же
 * человек должен всегда получать один и тот же цвет, иначе аватар «мигает»
 * между страницами.
 */
function hashString(value: string): number {
	let hash = 5381;
	for (let i = 0; i < value.length; i++) {
		hash = (hash << 5) + hash + value.charCodeAt(i);
	}
	return Math.abs(hash);
}

/**
 * Цвет фона по строке-семени.
 *
 * Семя задаёт вызывающий, а не компонент: у docta.me это имя врача, ОЧИЩЕННОЕ
 * от звания, — иначе «Marko Petrović» и «dr Marko Petrović» получили бы разные
 * цвета. Правила чистки предметные, киту про звания знать нечего.
 */
export function getAvatarColor(seed: string): string {
	if (!seed || !seed.trim()) return AVATAR_COLORS[0];
	return AVATAR_COLORS[
		hashString(seed.trim().toLowerCase()) % AVATAR_COLORS.length
	];
}

/**
 * Инициалы по умолчанию: первые буквы первых двух слов.
 *
 * Годится для «Имя Фамилия». Там, где нужны свои правила (у docta.me из
 * «Prof. dr. Marko Petrović» должно получиться «MP», а не «PD»), передавайте
 * готовые инициалы пропсом.
 */
export function getInitials(name: string): string {
	return name
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => Array.from(word)[0]?.toUpperCase() ?? '')
		.join('');
}
