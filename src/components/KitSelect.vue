<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import KitIconClose from '../icons/icon-close.vue';

/**
 * Выпадающий список с поиском и виртуализацией.
 *
 * Виртуализация здесь не преждевременная оптимизация: в админке в список
 * уходит весь каталог — 5237 услуг, 8194 отзыва, 1591 анализ. Без окна
 * раскрытие такого списка вешает вкладку на секунды.
 *
 * Высота строки ФИКСИРОВАННАЯ. Это ограничение осознанное: переменная высота
 * потребовала бы измерять каждую строку, а выигрыш — только в переносе длинных
 * подписей. Для них есть `rowHeight` побольше (см. `wrapLabels`).
 */

type Value = string | number;

interface Option {
	value: Value;
	label: string;
	disabled?: boolean;
}

const props = withDefaults(
	defineProps<{
		options: Option[];
		multiple?: boolean;
		filterable?: boolean;
		clearable?: boolean;
		disabled?: boolean;
		size?: 'small' | 'default' | 'large';
		/** Все видимые строки приходят пропсами: своих текстов у кита нет. */
		placeholder?: string;
		searchPlaceholder?: string;
		noDataText?: string;
		ariaLabel?: string;
		clearLabel?: string;
		/** Переносить длинные подписи на вторую строку (строка станет выше). */
		wrapLabels?: boolean;
		/** Сколько строк видно в раскрытом списке. */
		visibleRows?: number;
		/**
		 * Поиск на сервере: список НЕ фильтруется локально, вместо этого
		 * на каждый ввод летит событие `search`. Нужен там, где вариантов
		 * больше, чем разумно грузить на клиент (пользователи, врачи).
		 */
		remote?: boolean;
		/** Идёт загрузка вариантов (для remote). */
		loading?: boolean;
		loadingText?: string;
		/** Сколько тегов показать в мультивыборе, остальные свернуть в «+N». */
		maxTags?: number;
	}>(),
	{
		multiple: false,
		filterable: false,
		clearable: false,
		disabled: false,
		size: 'default',
		placeholder: '',
		searchPlaceholder: '',
		noDataText: '',
		ariaLabel: '',
		clearLabel: '',
		wrapLabels: false,
		visibleRows: 8,
		remote: false,
		loading: false,
		loadingText: '',
		maxTags: 0,
	},
);

const model = defineModel<Value | Value[] | null>({ default: null });

const emit = defineEmits<{ search: [query: string] }>();

const uid = useId();
const rootRef = ref<HTMLElement>();
const inputRef = ref<HTMLInputElement>();
const listRef = ref<HTMLElement>();
const dropdownRef = ref<HTMLElement>();

const isOpen = ref(false);
const query = ref('');
const activeIndex = ref(-1);
const scrollTop = ref(0);
const dropdownStyle = ref<Record<string, string>>({});

/* Высота строки согласована с CSS: JS считает окно, CSS рисует. */
const rowHeight = computed(() => (props.wrapLabels ? 52 : 36));

const selectedValues = computed<Value[]>(() => {
	if (model.value === null || model.value === undefined) return [];
	return Array.isArray(model.value) ? model.value : [model.value];
});

const labelByValue = computed(() => {
	const map = new Map<Value, string>();
	for (const o of props.options) map.set(o.value, o.label);
	return map;
});

const selectedOptions = computed(() =>
	selectedValues.value.map((v) => ({
		value: v,
		label: labelByValue.value.get(v) ?? String(v),
	})),
);

/* Видимые теги и счётчик свёрнутых: иначе десяток городов ломает панель */
const visibleTags = computed(() =>
	props.maxTags > 0
		? selectedOptions.value.slice(0, props.maxTags)
		: selectedOptions.value,
);

const hiddenTagsCount = computed(() =>
	Math.max(0, selectedOptions.value.length - visibleTags.value.length),
);

/* Полный список в подсказке — свёрнутые названия иначе не узнать */
const hiddenTagsTitle = computed(() =>
	selectedOptions.value
		.slice(visibleTags.value.length)
		.map((o) => o.label)
		.join(', '),
);

/*
 * Фильтрация линейная по всему списку. На 8k строк это доли миллисекунды,
 * а индекс пришлось бы поддерживать при каждой смене options.
 */
const filtered = computed(() => {
	// При remote список уже отфильтрован сервером — фильтровать второй раз
	// нельзя: сервер мог отобрать по полям, которых нет в подписи (email, id)
	if (props.remote) return props.options;
	const q = query.value.trim().toLowerCase();
	if (!q) return props.options;
	return props.options.filter((o) => o.label.toLowerCase().includes(q));
});

const hasValue = computed(() => selectedValues.value.length > 0);

/*
 * Сколько строк влезает в окно браузера с той стороны, куда открыта панель.
 * Считается в place(): при зуме или низком окне восемь строк не помещаются,
 * и без этого ограничения панель уезжала за край экрана.
 */
const rowsThatFit = ref(Infinity);

/* Меньше трёх строк список перестаёт быть списком — дальше не ужимаем */
const MIN_ROWS = 3;

const viewportHeight = computed(
	() =>
		Math.min(
			filtered.value.length,
			props.visibleRows,
			Math.max(MIN_ROWS, rowsThatFit.value),
		) * rowHeight.value,
);

/* Окно видимых строк + запас сверху и снизу, чтобы не мигало при прокрутке */
const OVERSCAN = 4;

const windowStart = computed(() =>
	Math.max(0, Math.floor(scrollTop.value / rowHeight.value) - OVERSCAN),
);

const windowEnd = computed(() =>
	Math.min(
		filtered.value.length,
		Math.ceil((scrollTop.value + viewportHeight.value) / rowHeight.value) +
			OVERSCAN,
	),
);

const visibleOptions = computed(() =>
	filtered.value.slice(windowStart.value, windowEnd.value).map((o, i) => ({
		option: o,
		index: windowStart.value + i,
	})),
);

const activeId = computed(() =>
	activeIndex.value >= 0 ? `${uid}-opt-${activeIndex.value}` : undefined,
);

function isSelected(value: Value) {
	return selectedValues.value.includes(value);
}

/* --- позиционирование --------------------------------------------------- */

/* Зазор между триггером и панелью */
const GAP = 4;

/*
 * Позиция считается от прямоугольника триггера, без popper: список
 * фиксированный, ему нужно лишь перевернуться вверх, когда снизу не влезает.
 *
 * Сторону выбираем по свободному месту, а число строк подгоняем под неё:
 * панель никогда не выходит за окно. Когда триггер исчез из раскладки
 * (перестроение по брейкпоинту, закрытый аккордеон), панель закрываем —
 * иначе она висит в углу окна без хозяина.
 */
function place() {
	const el = rootRef.value;
	if (!el) return;
	const r = el.getBoundingClientRect();
	if (r.width === 0 && r.height === 0) {
		close();
		return;
	}
	// Всё, что в панели кроме списка: рамка, отступы, шапка со слотом
	const chrome =
		(dropdownRef.value?.offsetHeight ?? 0) -
		(listRef.value?.offsetHeight ?? 0);
	const wanted =
		Math.min(filtered.value.length, props.visibleRows) * rowHeight.value +
		chrome;
	const below = window.innerHeight - r.bottom - GAP;
	const above = r.top - GAP;
	const flip = below < wanted && above > below;
	const room = flip ? above : below;
	rowsThatFit.value = Math.floor((room - chrome) / rowHeight.value);

	const next = {
		left: `${r.left}px`,
		width: `${r.width}px`,
		...(flip
			? { bottom: `${window.innerHeight - r.top + GAP}px` }
			: { top: `${r.bottom + GAP}px` }),
	};
	// Панель следит за триггером покадрово — не дёргаем реактивность зря
	const prev = dropdownStyle.value;
	if (
		prev.left !== next.left ||
		prev.width !== next.width ||
		prev.top !== next.top ||
		prev.bottom !== next.bottom
	) {
		dropdownStyle.value = next;
	}
}

/*
 * Пока панель открыта, позиция пересчитывается каждый кадр. Событий scroll
 * и resize недостаточно: раскладка сдвигается и без них — перестроение по
 * брейкпоинту после зума, догрузившийся шрифт, раскрывшийся блок выше.
 * Цена — один getBoundingClientRect на кадр, только пока список открыт.
 */
let trackingFrame = 0;

function track() {
	place();
	trackingFrame = requestAnimationFrame(track);
}

function stopTracking() {
	cancelAnimationFrame(trackingFrame);
	trackingFrame = 0;
}

/* --- открытие и закрытие ------------------------------------------------ */

function open() {
	if (props.disabled || isOpen.value) return;
	isOpen.value = true;
	// Если ничего не выбрано, активен первый: иначе aria-activedescendant
	// пуст и скринридеру нечего объявить при раскрытии
	const selectedAt = filtered.value.findIndex((o) => isSelected(o.value));
	activeIndex.value =
		selectedAt >= 0 ? selectedAt : filtered.value.length ? 0 : -1;
	nextTick(() => {
		place();
		scrollActiveIntoView();
		if (props.filterable) inputRef.value?.focus();
		trackingFrame = requestAnimationFrame(track);
	});
}

function close() {
	if (!isOpen.value) return;
	isOpen.value = false;
	query.value = '';
	activeIndex.value = -1;
	scrollTop.value = 0;
	rowsThatFit.value = Infinity;
	stopTracking();
}

function toggle() {
	if (isOpen.value) close();
	else open();
}

onBeforeUnmount(stopTracking);

/* --- выбор -------------------------------------------------------------- */

function pick(option: Option) {
	if (option.disabled) return;
	if (props.multiple) {
		const next = selectedValues.value.includes(option.value)
			? selectedValues.value.filter((v) => v !== option.value)
			: [...selectedValues.value, option.value];
		model.value = next;
		query.value = '';
	} else {
		model.value = option.value;
		close();
	}
}

function clear() {
	model.value = props.multiple ? [] : null;
	close();
}

function removeTag(value: Value) {
	model.value = selectedValues.value.filter((v) => v !== value);
}

/* --- клавиатура --------------------------------------------------------- */

function scrollActiveIntoView() {
	const list = listRef.value;
	if (!list || activeIndex.value < 0) return;
	const top = activeIndex.value * rowHeight.value;
	const bottom = top + rowHeight.value;
	if (top < list.scrollTop) list.scrollTop = top;
	else if (bottom > list.scrollTop + list.clientHeight) {
		list.scrollTop = bottom - list.clientHeight;
	}
}

function move(step: number) {
	if (!isOpen.value) {
		open();
		return;
	}
	const total = filtered.value.length;
	if (!total) return;
	let next = activeIndex.value;
	// Пропускаем отключённые, но не зацикливаемся, если отключены все
	for (let i = 0; i < total; i++) {
		next = (next + step + total) % total;
		if (!filtered.value[next]?.disabled) break;
	}
	activeIndex.value = next;
	nextTick(scrollActiveIntoView);
}

function onKeydown(e: KeyboardEvent) {
	switch (e.key) {
		case 'ArrowDown':
			e.preventDefault();
			move(1);
			break;
		case 'ArrowUp':
			e.preventDefault();
			move(-1);
			break;
		case 'Home':
			if (!isOpen.value) return;
			e.preventDefault();
			activeIndex.value = 0;
			nextTick(scrollActiveIntoView);
			break;
		case 'End':
			if (!isOpen.value) return;
			e.preventDefault();
			activeIndex.value = filtered.value.length - 1;
			nextTick(scrollActiveIntoView);
			break;
		case 'Enter':
			if (!isOpen.value) {
				e.preventDefault();
				open();
				return;
			}
			if (activeIndex.value >= 0) {
				e.preventDefault();
				pick(filtered.value[activeIndex.value]);
			}
			break;
		case 'Escape':
			if (isOpen.value) {
				e.preventDefault();
				close();
			}
			break;
		case 'Tab':
			close();
			break;
	}
}

function onDocumentPointerDown(e: PointerEvent) {
	const target = e.target as Node;
	if (rootRef.value?.contains(target)) return;
	if (dropdownRef.value?.contains(target)) return;
	close();
}

watch(isOpen, (open) => {
	if (typeof document === 'undefined') return;
	if (open) document.addEventListener('pointerdown', onDocumentPointerDown);
	else document.removeEventListener('pointerdown', onDocumentPointerDown);
});

onBeforeUnmount(() => {
	if (typeof document !== 'undefined') {
		document.removeEventListener('pointerdown', onDocumentPointerDown);
	}
});

/* Фильтр сузился — прежний активный индекс уже ничего не значит */
watch(query, (q) => {
	if (props.remote) emit('search', q);
	activeIndex.value = filtered.value.length ? 0 : -1;
	scrollTop.value = 0;
	if (listRef.value) listRef.value.scrollTop = 0;
	nextTick(place);
});

/*
 * Выбранное показываем ЗНАЧЕНИЕМ поля, а не плейсхолдером: плейсхолдер для
 * скринридера — подсказка, а не значение, и «выбрано X» так не прочиталось бы.
 */
const inputValue = computed(() => {
	if (isOpen.value && props.filterable) return query.value;
	if (props.multiple) return '';
	return selectedOptions.value[0]?.label ?? '';
});

const inputPlaceholder = computed(() => {
	if (isOpen.value && props.filterable) {
		return props.searchPlaceholder || props.placeholder;
	}
	if (props.multiple && hasValue.value) return '';
	return props.placeholder;
});

function onListScroll(e: Event) {
	scrollTop.value = (e.target as HTMLElement).scrollTop;
}
</script>

<template>
	<div
		ref="rootRef"
		class="kit-select"
		:class="[
			`kit-select--size-${size}`,
			{ 'is-open': isOpen, 'is-disabled': disabled },
		]"
	>
		<div class="kit-select__control" @click="toggle">
			<!-- Иконка в поле: у селектора локации в шапке это пин -->
			<span v-if="$slots.prefix" class="kit-select__prefix">
				<slot name="prefix" />
			</span>

			<div class="kit-select__value">
				<template v-if="multiple && hasValue">
					<span
						v-for="opt in visibleTags"
						:key="opt.value"
						class="kit-select__tag"
					>
						{{ opt.label }}
						<button
							type="button"
							class="kit-select__tag-remove"
							:aria-label="clearLabel || undefined"
							@click.stop="removeTag(opt.value)"
						>
							<KitIconClose />
						</button>
					</span>
					<span
						v-if="hiddenTagsCount"
						class="kit-select__tag kit-select__tag--more"
						:title="hiddenTagsTitle"
					>
						+{{ hiddenTagsCount }}
					</span>
				</template>

				<input
					ref="inputRef"
					class="kit-select__input"
					role="combobox"
					aria-autocomplete="list"
					:aria-expanded="isOpen"
					:aria-controls="`${uid}-list`"
					:aria-activedescendant="activeId"
					:aria-label="ariaLabel || undefined"
					:disabled="disabled"
					:readonly="!filterable"
					:value="inputValue"
					:placeholder="inputPlaceholder"
					@input="query = ($event.target as HTMLInputElement).value"
					@keydown="onKeydown"
				/>
			</div>

			<button
				v-if="clearable && hasValue && !disabled"
				type="button"
				class="kit-select__clear"
				:aria-label="clearLabel || undefined"
				@click.stop="clear"
			>
				<KitIconClose />
			</button>

			<span class="kit-select__arrow" aria-hidden="true">
				<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none">
					<path
						d="M6 9l6 6 6-6"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</span>
		</div>

		<!--
			Список в Teleport: внутри карточек и диалогов у родителей бывает
			overflow: hidden, который обрезал бы выпадашку.
		-->
		<!--
			v-if на самом Teleport, а не на содержимом: закрытый список не должен
			телепортировать вообще ничего. Пустые телепорты сбивают порядок
			телепортированного содержимого при гидрации — ловилось предупреждением
			о несовпадении на соседнем KitToaster.
		-->
		<Teleport v-if="isOpen" to="body">
			<div
				ref="dropdownRef"
				class="kit-select__dropdown"
				:class="{ 'kit-select--wrap': wrapLabels }"
				:style="dropdownStyle"
			>
				<!-- Подсказка над списком: объясняет смысл выбора до того,
					как пользователь начнёт выбирать -->
				<div v-if="$slots.header" class="kit-select__header">
					<slot name="header" />
				</div>

				<!-- Загрузка важнее пустоты: при remote список пуст, пока идёт запрос,
					и «ничего не найдено» в этот момент было бы враньём -->
				<div v-if="loading" class="kit-select__empty" role="status">
					{{ loadingText }}
				</div>

				<div
					v-else-if="!filtered.length"
					class="kit-select__empty"
					role="status"
				>
					{{ noDataText }}
				</div>

				<div
					v-else
					:id="`${uid}-list`"
					ref="listRef"
					class="kit-select__list"
					role="listbox"
					:aria-multiselectable="multiple || undefined"
					:style="{ height: `${viewportHeight}px` }"
					@scroll="onListScroll"
				>
					<!--
						Распорка задаёт полную высоту списка, чтобы полоса прокрутки
						соответствовала всем строкам, а не только отрисованным.
					-->
					<div
						class="kit-select__spacer"
						:style="{ height: `${filtered.length * rowHeight}px` }"
					>
						<div
							v-for="row in visibleOptions"
							:id="`${uid}-opt-${row.index}`"
							:key="row.option.value"
							class="kit-select__option"
							:class="{
								'is-active': row.index === activeIndex,
								'is-selected': isSelected(row.option.value),
								'is-disabled': row.option.disabled,
							}"
							role="option"
							:aria-selected="isSelected(row.option.value)"
							:aria-disabled="row.option.disabled || undefined"
							:style="{
								top: `${row.index * rowHeight}px`,
								height: `${rowHeight}px`,
							}"
							:title="row.option.label"
							@click="pick(row.option)"
							@mousemove="activeIndex = row.index"
						>
							{{ row.option.label }}
						</div>
					</div>
				</div>
			</div>
		</Teleport>
	</div>
</template>

<style scoped>
.kit-select {
	position: relative;
	display: block;
	width: 100%;
	font-size: var(--kit-font-size-sm);
}

.kit-select__control {
	display: flex;
	align-items: center;
	gap: var(--kit-spacing-xs);
	box-sizing: border-box;
	min-height: var(--kit-select-height);
	padding: 0 var(--kit-spacing-sm) 0 var(--kit-spacing-md);
	border: var(--kit-border-width-thin) solid var(--kit-color-border-primary);
	border-radius: var(--kit-border-radius-md);
	background-color: var(--kit-color-bg-primary);
	cursor: pointer;
	transition:
		border-color var(--kit-transition-base),
		box-shadow var(--kit-transition-base);
}

.kit-select--size-small {
	--kit-select-height: 24px;
}

.kit-select--size-default {
	--kit-select-height: 32px;
}

.kit-select--size-large {
	--kit-select-height: 40px;
}

.kit-select__control:hover {
	border-color: var(--kit-color-text-light);
}

.kit-select.is-open .kit-select__control,
.kit-select__control:focus-within {
	border-color: var(--kit-color-primary);
	box-shadow: var(--kit-focus-ring);
}

.kit-select.is-disabled .kit-select__control {
	background-color: var(--kit-color-bg-tertiary);
	cursor: not-allowed;
}

.kit-select__prefix {
	display: inline-flex;
	align-items: center;
	flex-shrink: 0;
	color: var(--kit-color-text-muted);
}

.kit-select__header {
	padding: var(--kit-spacing-xs) var(--kit-spacing-md) var(--kit-spacing-sm);
	border-bottom: var(--kit-border-width-thin) solid
		var(--kit-color-border-light);
	color: var(--kit-color-text-muted);
	font-size: var(--kit-font-size-xs);
}

.kit-select__value {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: var(--kit-spacing-xs);
	flex: 1;
	min-width: 0;
	padding: var(--kit-spacing-xs) 0;
}

.kit-select__input {
	flex: 1;
	min-width: 60px;
	border: none;
	outline: none;
	background: transparent;
	color: var(--kit-color-text-primary);
	/*
	 * 16px на мобильных: меньший размер заставляет iOS зумить страницу при
	 * фокусе. На широких экранах возвращаем шкалу контролов.
	 */
	font-size: var(--kit-font-size-base);
	font-family: inherit;
	cursor: inherit;
}

@media (min-width: 768px) {
	.kit-select__input {
		font-size: var(--kit-font-size-sm);
	}
}

.kit-select__input::placeholder {
	color: var(--kit-color-text-placeholder);
}

.kit-select__tag {
	display: inline-flex;
	align-items: center;
	gap: var(--kit-spacing-xs);
	max-width: 100%;
	padding: 2px var(--kit-spacing-xs) 2px var(--kit-spacing-sm);
	border-radius: var(--kit-border-radius-sm);
	background-color: var(--kit-color-bg-tertiary);
	color: var(--kit-color-text-secondary);
	font-size: var(--kit-font-size-xs);
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.kit-select__tag-remove,
.kit-select__clear {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	width: 18px;
	height: 18px;
	padding: 0;
	border: none;
	border-radius: var(--kit-border-radius-full);
	background: transparent;
	color: inherit;
	font-size: var(--kit-font-size-xs);
	cursor: pointer;
	opacity: 0.7;
}

.kit-select__clear {
	width: 20px;
	height: 20px;
	color: var(--kit-color-text-muted);
}

.kit-select__tag-remove:hover,
.kit-select__clear:hover {
	opacity: 1;
	background-color: var(--kit-color-bg-muted);
}

.kit-select__tag-remove:focus-visible,
.kit-select__clear:focus-visible {
	outline: 2px solid var(--kit-color-primary);
	outline-offset: 1px;
	opacity: 1;
}

.kit-select__arrow {
	display: inline-flex;
	flex-shrink: 0;
	color: var(--kit-color-text-light);
	font-size: var(--kit-font-size-base);
	transition: transform var(--kit-transition-base);
}

.kit-select.is-open .kit-select__arrow {
	transform: rotate(180deg);
}

/* --- выпадающий список --- */

.kit-select__dropdown {
	position: fixed;
	z-index: var(--kit-z-dropdown);
	padding: var(--kit-spacing-xs) 0;
	/* Панель телепортирована в body и не наследует размер от .kit-select:
	   без этого строки шли 16px от body и в свою высоту не помещались */
	font-size: var(--kit-font-size-sm);
	border: var(--kit-border-width-thin) solid var(--kit-color-border-secondary);
	border-radius: var(--kit-border-radius-lg);
	background-color: var(--kit-color-bg-primary);
	box-shadow: var(--kit-shadow-lg);
}

.kit-select__list {
	overflow-y: auto;
	overscroll-behavior: contain;
}

/* Распорка держит полную высоту, строки позиционируются в ней абсолютно */
.kit-select__spacer {
	position: relative;
}

.kit-select__option {
	position: absolute;
	/* Строка не касается стенок панели: подсветка активной строки — это
	   скруглённая плашка внутри списка, а не полоса от края до края */
	left: var(--kit-spacing-xs);
	right: var(--kit-spacing-xs);
	display: flex;
	align-items: center;
	box-sizing: border-box;
	padding: 0 var(--kit-spacing-md);
	border-radius: var(--kit-border-radius-sm);
	color: var(--kit-color-text-primary);
	cursor: pointer;
	/*
	 * По умолчанию подпись в одну строку с многоточием, полный текст —
	 * нативной подсказкой (title): названия услуг длинные и в ширину панели
	 * фильтров не влезают.
	 */
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

/* wrapLabels: две строки вместо многоточия, под это и увеличена высота строки */
.kit-select--wrap .kit-select__option {
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
	white-space: normal;
	line-height: 1.3;
	text-overflow: unset;
}

.kit-select__option.is-active {
	background-color: var(--kit-color-bg-tertiary);
}

.kit-select__option.is-selected {
	color: var(--kit-color-primary);
	font-weight: var(--kit-font-weight-medium);
}

.kit-select__option.is-disabled {
	color: var(--kit-color-text-light);
	cursor: not-allowed;
}

.kit-select__tag--more {
	background-color: var(--kit-color-primary-bg);
	color: var(--kit-color-primary);
	cursor: default;
}

.kit-select__empty {
	padding: var(--kit-spacing-md);
	color: var(--kit-color-text-muted);
	text-align: center;
}
</style>
