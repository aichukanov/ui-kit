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
	},
);

const model = defineModel<Value | Value[] | null>({ default: null });

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
const rowHeight = computed(() => (props.wrapLabels ? 52 : 34));

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

/*
 * Фильтрация линейная по всему списку. На 8k строк это доли миллисекунды,
 * а индекс пришлось бы поддерживать при каждой смене options.
 */
const filtered = computed(() => {
	const q = query.value.trim().toLowerCase();
	if (!q) return props.options;
	return props.options.filter((o) => o.label.toLowerCase().includes(q));
});

const hasValue = computed(() => selectedValues.value.length > 0);

const viewportHeight = computed(
	() => Math.min(filtered.value.length, props.visibleRows) * rowHeight.value,
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

/*
 * Позиция считается от прямоугольника триггера, без popper: список
 * фиксированный, ему нужно лишь перевернуться вверх, когда снизу не влезает.
 */
function place() {
	const el = rootRef.value;
	if (!el) return;
	const r = el.getBoundingClientRect();
	const height = viewportHeight.value + 8;
	const below = window.innerHeight - r.bottom;
	const flip = below < height && r.top > below;
	dropdownStyle.value = {
		left: `${r.left}px`,
		width: `${r.width}px`,
		...(flip
			? { bottom: `${window.innerHeight - r.top + 4}px` }
			: { top: `${r.bottom + 4}px` }),
	};
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
	});
	window.addEventListener('scroll', place, true);
	window.addEventListener('resize', place);
}

function close() {
	if (!isOpen.value) return;
	isOpen.value = false;
	query.value = '';
	activeIndex.value = -1;
	scrollTop.value = 0;
	window.removeEventListener('scroll', place, true);
	window.removeEventListener('resize', place);
}

function toggle() {
	if (isOpen.value) close();
	else open();
}

onBeforeUnmount(() => {
	window.removeEventListener('scroll', place, true);
	window.removeEventListener('resize', place);
});

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
watch(query, () => {
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
			<div class="kit-select__value">
				<template v-if="multiple && hasValue">
					<span
						v-for="opt in selectedOptions"
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
				:style="dropdownStyle"
			>
				<div v-if="!filtered.length" class="kit-select__empty" role="status">
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
}

.kit-select.is-disabled .kit-select__control {
	background-color: var(--kit-color-bg-tertiary);
	cursor: not-allowed;
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
	border: var(--kit-border-width-thin) solid var(--kit-color-border-secondary);
	border-radius: var(--kit-border-radius-md);
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
	left: 0;
	right: 0;
	display: flex;
	align-items: center;
	box-sizing: border-box;
	padding: 0 var(--kit-spacing-md);
	color: var(--kit-color-text-primary);
	cursor: pointer;
	/* Подписи в один ряд; для переноса есть wrapLabels с высокой строкой */
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
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

.kit-select__empty {
	padding: var(--kit-spacing-md);
	color: var(--kit-color-text-muted);
	text-align: center;
}
</style>
