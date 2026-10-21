<script setup lang="ts">
import { computed, useAttrs, type Component } from 'vue';
import KitIconSpinner from '../icons/icon-spinner.vue';

/**
 * Кнопка дизайн-системы. Два независимых измерения:
 *  - variant — смысл действия (цвет),
 *  - appearance — вес оформления (заливка / контур / без рамки / ссылка).
 *
 * `type` здесь означает то же, что в HTML (button|submit|reset), а не вариант
 * оформления, как в Element Plus. Это сознательно: в проекте уже встречались
 * `<el-button type="submit">`, которые молча НЕ отправляли форму.
 *
 * Действие-переход («все отзывы», «к списку услуг») — это НЕ кнопка, а `<a>`:
 * иначе краулер туда не попадёт, а «открыть в новой вкладке» и копирование
 * адреса не сработают. Поэтому `href` переключает корневой элемент на `<a>`,
 * а `as` позволяет отдать его компоненту-ссылке приложения (`NuxtLink`,
 * `RouterLink`) — своего роутинга у пакета нет и быть не может. Раньше это
 * измерение существовало только на вид: `appearance="link"` красил `<button>`
 * ссылкой, и разметка врала.
 */
const props = withDefaults(
	defineProps<{
		variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
		appearance?: 'solid' | 'plain' | 'text' | 'link';
		size?: 'small' | 'default' | 'large';
		type?: 'button' | 'submit' | 'reset';
		/** Адрес перехода: корень становится `<a href>`. */
		href?: string;
		/**
		 * Чем рендерить корень вместо `<a>`: компонент-ссылка приложения.
		 * Его собственные пропы (`to` у NuxtLink) передаются как обычные
		 * атрибуты и доезжают через fallthrough.
		 */
		as?: string | Component;
		loading?: boolean;
		disabled?: boolean;
		round?: boolean;
		block?: boolean;
		/** Иконка перед текстом. Альтернатива — слот #icon. */
		icon?: Component;
		/** Иконка после текста: стрелка перехода. Слот — #icon-right. */
		iconRight?: Component;
	}>(),
	{
		variant: 'default',
		appearance: 'solid',
		size: 'default',
		type: 'button',
		href: undefined,
		as: undefined,
		loading: false,
		disabled: false,
		round: false,
		block: false,
		icon: undefined,
		iconRight: undefined,
	},
);

const isDisabled = computed(() => props.disabled || props.loading);

/**
 * Выключенная ссылка — это `<a>` БЕЗ адреса и без компонента-ссылки.
 *
 * Атрибута `disabled` у ссылки нет, а гасить переход своим обработчиком
 * ненадёжно: порядок с внутренним обработчиком `NuxtLink`/`RouterLink`
 * ничем не гарантирован, и клик мог бы пройти. Без `href` элемент инертен
 * по самой разметке — ни клика, ни фокуса, ни «открыть в новой вкладке».
 * Состояние при этом озвучивается `aria-disabled`.
 */
const tag = computed(() => {
	const linkTag = props.as ?? (props.href ? 'a' : 'button');
	if (linkTag === 'button') return 'button';
	return isDisabled.value ? 'a' : linkTag;
});
const isButton = computed(() => tag.value === 'button');

/*
 * Пропы компонента-ссылки (`to` у NuxtLink) приезжают сюда обычными
 * атрибутами. У выключенной ссылки корень — простой `<a>`, и `to` на нём
 * осел бы в DOM невалидным атрибутом (`to="[object Object]"`), поэтому его
 * здесь отбрасываем.
 */
defineOptions({ inheritAttrs: false });

const attrs = useAttrs();
const rootAttrs = computed(() => {
	if (isButton.value || !isDisabled.value) return attrs;
	const { to: _to, ...rest } = attrs;
	return rest;
});
</script>

<template>
	<component
		:is="tag"
		v-bind="rootAttrs"
		class="kit-button"
		:class="[
			`kit-button--variant-${variant}`,
			`kit-button--${appearance}`,
			`kit-button--size-${size}`,
			{ 'is-round': round, 'is-block': block, 'is-disabled': isDisabled },
		]"
		:type="isButton ? type : undefined"
		:href="isButton || isDisabled ? undefined : href"
		:disabled="isButton ? isDisabled : undefined"
		:aria-disabled="!isButton && isDisabled ? 'true' : undefined"
		:aria-busy="loading || undefined"
	>
		<span v-if="loading" class="kit-button__icon">
			<KitIconSpinner />
		</span>
		<span v-else-if="icon || $slots.icon" class="kit-button__icon">
			<slot name="icon"><component :is="icon" /></slot>
		</span>
		<span v-if="$slots.default" class="kit-button__label"><slot /></span>
		<span
			v-if="iconRight || $slots['icon-right']"
			class="kit-button__icon kit-button__icon--right"
		>
			<slot name="icon-right"><component :is="iconRight" /></slot>
		</span>
	</component>
</template>

<style scoped>
/*
 * Цвета варианта живут в четырёх переменных --btn-*, а правила оформления
 * (solid/plain/text/link) написаны один раз поверх них. Добавить вариант =
 * добавить один блок переменных, а не четыре набора правил.
 */
.kit-button {
	--kit-button-fill: var(--kit-color-bg-primary);
	--kit-button-fill-hover: var(--kit-color-bg-secondary);
	--kit-button-fill-active: var(--kit-color-bg-tertiary);
	--kit-button-accent: var(--kit-color-text-secondary);
	/* Бледная подложка варианта: ховер контурных и текстовых кнопок */
	--kit-button-tint: var(--kit-color-bg-tertiary);

	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: var(--kit-spacing-sm);
	box-sizing: border-box;
	border: var(--kit-border-width-thin) solid transparent;
	border-radius: var(--kit-border-radius-md);
	font-family: inherit;
	font-weight: var(--kit-font-weight-medium);
	line-height: 1;
	white-space: nowrap;
	text-decoration: none;
	cursor: pointer;
	transition:
		background-color var(--kit-transition-base),
		border-color var(--kit-transition-base),
		color var(--kit-transition-base),
		box-shadow var(--kit-transition-base);
}

.kit-button--variant-primary {
	--kit-button-fill: var(--kit-color-primary-solid);
	--kit-button-fill-hover: var(--kit-color-primary-solid-hover);
	--kit-button-fill-active: var(--kit-color-primary-solid-active);
	--kit-button-accent: var(--kit-color-primary);
	--kit-button-tint: var(--kit-color-primary-bg);
}

.kit-button--variant-success {
	--kit-button-fill: var(--kit-color-success-solid);
	--kit-button-fill-hover: var(--kit-color-success-solid-hover);
	--kit-button-fill-active: var(--kit-color-success-solid-active);
	--kit-button-accent: var(--kit-color-success-solid);
	--kit-button-tint: var(--kit-color-success-bg);
}

.kit-button--variant-warning {
	--kit-button-fill: var(--kit-color-warning-solid);
	--kit-button-fill-hover: var(--kit-color-warning-solid-hover);
	--kit-button-fill-active: var(--kit-color-warning-solid-active);
	--kit-button-accent: var(--kit-color-warning-solid);
	--kit-button-tint: var(--kit-color-warning-bg);
}

.kit-button--variant-danger {
	--kit-button-fill: var(--kit-color-danger-solid);
	--kit-button-fill-hover: var(--kit-color-danger-solid-hover);
	--kit-button-fill-active: var(--kit-color-danger-solid-active);
	--kit-button-accent: var(--kit-color-danger-solid);
	--kit-button-tint: var(--kit-color-danger-bg);
}

/* Обводка снаружи рамки: на сплошной заливке контур внутри неразличим */
.kit-button:focus-visible {
	outline: 2px solid var(--kit-color-primary);
	outline-offset: 2px;
}

/* У `<a>` атрибута `disabled` нет — состояние несёт класс (см. onClick) */
.kit-button:disabled,
.kit-button.is-disabled {
	cursor: not-allowed;
	opacity: 0.55;
}

.kit-button.is-block {
	display: flex;
	width: 100%;
}

.kit-button.is-round {
	border-radius: var(--kit-border-radius-pill);
}

.kit-button__icon {
	display: inline-flex;
	align-items: center;
	font-size: 1.15em;
}

/*
 * Стрелка перехода подаётся вперёд на ховере — только у безрамочных весов:
 * у залитой кнопки сдвиг внутри прямоугольника читается как дрожание.
 */
.kit-button--text .kit-button__icon--right,
.kit-button--link .kit-button__icon--right {
	transition: transform var(--kit-transition-base);
}

.kit-button--text:hover:not(:disabled, .is-disabled) .kit-button__icon--right,
.kit-button--link:hover:not(:disabled, .is-disabled) .kit-button__icon--right {
	transform: translateX(2px);
}

@media (prefers-reduced-motion: reduce) {
	.kit-button__icon--right {
		transition: none;
		transform: none !important;
	}
}

/* === Размеры: метрики Element Plus, чтобы миграция не двигала вёрстку === */
.kit-button--size-small {
	height: 24px;
	padding: 0 11px;
	font-size: var(--kit-font-size-xs);
	border-radius: var(--kit-border-radius-sm);
}

.kit-button--size-default {
	height: 32px;
	padding: 0 15px;
	font-size: var(--kit-font-size-sm);
}

.kit-button--size-large {
	height: 40px;
	padding: 0 19px;
	font-size: var(--kit-font-size-sm);
}

/* === appearance: solid — залитая кнопка === */
.kit-button--solid {
	background-color: var(--kit-button-fill);
	border-color: var(--kit-button-fill);
	color: var(--kit-color-text-on-solid);
	/* Едва заметная контактная тень отделяет кнопку от карточки того же
	   тона; у text/link её нет — они часть текста, а не объект */
	box-shadow: var(--kit-shadow-xs);
}

.kit-button--solid:hover:not(:disabled, .is-disabled) {
	background-color: var(--kit-button-fill-hover);
	border-color: var(--kit-button-fill-hover);
}

.kit-button--solid:active:not(:disabled, .is-disabled) {
	background-color: var(--kit-button-fill-active);
	border-color: var(--kit-button-fill-active);
	box-shadow: none;
}

/*
 * variant="default" не имеет своего цвета, поэтому его сплошной вид — это
 * белая кнопка с рамкой. Ховер нейтральный (на полтона темнее), а не
 * индиго, как у Element Plus: второстепенная кнопка не должна при наведении
 * притворяться главной.
 */
.kit-button--solid.kit-button--variant-default,
.kit-button--plain.kit-button--variant-default {
	background-color: var(--kit-color-bg-primary);
	border-color: var(--kit-color-border-primary);
	color: var(--kit-color-text-secondary);
}

.kit-button--solid.kit-button--variant-default:hover:not(
		:disabled,
		.is-disabled
	),
.kit-button--plain.kit-button--variant-default:hover:not(
		:disabled,
		.is-disabled
	) {
	background-color: var(--kit-color-bg-secondary);
	border-color: var(--kit-color-text-light);
	color: var(--kit-color-text-heading);
}

.kit-button--solid.kit-button--variant-default:active:not(
		:disabled,
		.is-disabled
	),
.kit-button--plain.kit-button--variant-default:active:not(
		:disabled,
		.is-disabled
	) {
	background-color: var(--kit-color-bg-tertiary);
	border-color: var(--kit-color-text-light);
	color: var(--kit-color-text-heading);
}

/*
 * === appearance: plain — контур, при наведении подсвечивается бледной
 * подложкой своего цвета. Полная заливка на ховере (манера Element Plus)
 * превращала контурную кнопку в сплошную — два веса становились
 * неразличимы ровно в момент, когда пользователь на них смотрит.
 */
.kit-button--plain {
	background-color: var(--kit-color-bg-primary);
	border-color: var(--kit-button-accent);
	color: var(--kit-button-accent);
}

.kit-button--plain:hover:not(:disabled, .is-disabled) {
	background-color: var(--kit-button-tint);
}

.kit-button--plain:active:not(:disabled, .is-disabled) {
	background-color: var(--kit-button-tint);
	border-color: var(--kit-button-fill-active);
	color: var(--kit-button-fill-active);
}

/* === appearance: text — без рамки и фона === */
.kit-button--text {
	background-color: transparent;
	border-color: transparent;
	color: var(--kit-button-accent);
}

.kit-button--text:hover:not(:disabled, .is-disabled) {
	background-color: var(--kit-button-tint);
}

.kit-button--text:active:not(:disabled, .is-disabled) {
	color: var(--kit-button-fill-active);
}

/* === appearance: link — ведёт себя как ссылка в тексте === */
.kit-button--link {
	height: auto;
	padding: 2px;
	background-color: transparent;
	border-color: transparent;
	color: var(--kit-button-accent);
}

.kit-button--link:hover:not(:disabled, .is-disabled) {
	text-decoration: underline;
}
</style>
