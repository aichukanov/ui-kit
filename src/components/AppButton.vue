<script setup lang="ts">
import type { Component } from 'vue';
import IconSpinner from '../icons/icon-spinner.vue';

/**
 * Кнопка дизайн-системы. Два независимых измерения:
 *  - variant — смысл действия (цвет),
 *  - appearance — вес оформления (заливка / контур / без рамки / ссылка).
 *
 * `type` здесь означает то же, что в HTML (button|submit|reset), а не вариант
 * оформления, как в Element Plus. Это сознательно: в проекте уже встречались
 * `<el-button type="submit">`, которые молча НЕ отправляли форму.
 */
withDefaults(
	defineProps<{
		variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
		appearance?: 'solid' | 'plain' | 'text' | 'link';
		size?: 'small' | 'default' | 'large';
		type?: 'button' | 'submit' | 'reset';
		loading?: boolean;
		disabled?: boolean;
		round?: boolean;
		block?: boolean;
		/** Иконка перед текстом. Альтернатива — слот #icon. */
		icon?: Component;
	}>(),
	{
		variant: 'default',
		appearance: 'solid',
		size: 'default',
		type: 'button',
		loading: false,
		disabled: false,
		round: false,
		block: false,
		icon: undefined,
	},
);
</script>

<template>
	<button
		class="app-button"
		:class="[
			`app-button--variant-${variant}`,
			`app-button--${appearance}`,
			`app-button--size-${size}`,
			{ 'is-round': round, 'is-block': block },
		]"
		:type="type"
		:disabled="disabled || loading"
		:aria-busy="loading || undefined"
	>
		<span v-if="loading" class="app-button__icon">
			<IconSpinner />
		</span>
		<span v-else-if="icon || $slots.icon" class="app-button__icon">
			<slot name="icon"><component :is="icon" /></slot>
		</span>
		<span v-if="$slots.default" class="app-button__label"><slot /></span>
	</button>
</template>

<style scoped>
/*
 * Цвета варианта живут в четырёх переменных --btn-*, а правила оформления
 * (solid/plain/text/link) написаны один раз поверх них. Добавить вариант =
 * добавить один блок переменных, а не четыре набора правил.
 */
.app-button {
	--btn-fill: var(--color-bg-primary);
	--btn-fill-hover: var(--color-primary-bg);
	--btn-fill-active: var(--color-primary-bg);
	--btn-accent: var(--color-text-secondary);

	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: var(--spacing-sm);
	box-sizing: border-box;
	border: var(--border-width-thin) solid transparent;
	border-radius: var(--border-radius-md);
	font-family: inherit;
	font-weight: var(--font-weight-normal);
	line-height: 1;
	white-space: nowrap;
	text-decoration: none;
	cursor: pointer;
	transition:
		background-color var(--transition-base),
		border-color var(--transition-base),
		color var(--transition-base);
}

.app-button--variant-primary {
	--btn-fill: var(--color-primary-solid);
	--btn-fill-hover: var(--color-primary-solid-hover);
	--btn-fill-active: var(--color-primary-solid-active);
	--btn-accent: var(--color-primary);
}

.app-button--variant-success {
	--btn-fill: var(--color-success-solid);
	--btn-fill-hover: var(--color-success-solid-hover);
	--btn-fill-active: var(--color-success-solid-active);
	--btn-accent: var(--color-success-solid);
}

.app-button--variant-warning {
	--btn-fill: var(--color-warning-solid);
	--btn-fill-hover: var(--color-warning-solid-hover);
	--btn-fill-active: var(--color-warning-solid-active);
	--btn-accent: var(--color-warning-solid);
}

.app-button--variant-danger {
	--btn-fill: var(--color-danger-solid);
	--btn-fill-hover: var(--color-danger-solid-hover);
	--btn-fill-active: var(--color-danger-solid-active);
	--btn-accent: var(--color-danger-solid);
}

/* Обводка снаружи рамки: на сплошной заливке контур внутри неразличим */
.app-button:focus-visible {
	outline: 2px solid var(--color-primary);
	outline-offset: 2px;
}

.app-button:disabled {
	cursor: not-allowed;
	opacity: 0.55;
}

.app-button.is-block {
	display: flex;
	width: 100%;
}

.app-button.is-round {
	border-radius: 999px;
}

.app-button__icon {
	display: inline-flex;
	align-items: center;
	font-size: 1.15em;
}

/* === Размеры: метрики Element Plus, чтобы миграция не двигала вёрстку === */
.app-button--size-small {
	height: 24px;
	padding: 0 11px;
	font-size: var(--font-size-xs);
	border-radius: calc(var(--border-radius-md) - 1px);
}

.app-button--size-default {
	height: 32px;
	padding: 0 15px;
	font-size: var(--font-size-sm);
}

.app-button--size-large {
	height: 40px;
	padding: 0 19px;
	font-size: var(--font-size-sm);
}

/* === appearance: solid — залитая кнопка === */
.app-button--solid {
	background-color: var(--btn-fill);
	border-color: var(--btn-fill);
	color: var(--color-text-on-solid);
}

.app-button--solid:hover:not(:disabled) {
	background-color: var(--btn-fill-hover);
	border-color: var(--btn-fill-hover);
}

.app-button--solid:active:not(:disabled) {
	background-color: var(--btn-fill-active);
	border-color: var(--btn-fill-active);
}

/*
 * variant="default" не имеет своего цвета, поэтому его сплошной вид — это
 * белая кнопка с рамкой (так же выглядит нейтральная кнопка Element Plus).
 */
.app-button--solid.app-button--variant-default,
.app-button--plain.app-button--variant-default {
	background-color: var(--color-bg-primary);
	border-color: var(--color-border-primary);
	color: var(--color-text-secondary);
}

.app-button--solid.app-button--variant-default:hover:not(:disabled),
.app-button--plain.app-button--variant-default:hover:not(:disabled) {
	background-color: var(--color-primary-bg);
	border-color: var(--color-primary);
	color: var(--color-primary);
}

.app-button--solid.app-button--variant-default:active:not(:disabled),
.app-button--plain.app-button--variant-default:active:not(:disabled) {
	border-color: var(--color-primary-dark);
	color: var(--color-primary-dark);
}

/* === appearance: plain — контур, заливающийся при наведении === */
.app-button--plain {
	background-color: var(--color-bg-primary);
	border-color: var(--btn-accent);
	color: var(--btn-accent);
}

.app-button--plain:hover:not(:disabled) {
	background-color: var(--btn-fill);
	border-color: var(--btn-fill);
	color: var(--color-text-on-solid);
}

.app-button--plain:active:not(:disabled) {
	background-color: var(--btn-fill-active);
	border-color: var(--btn-fill-active);
	color: var(--color-text-on-solid);
}

/* === appearance: text — без рамки и фона === */
.app-button--text {
	background-color: transparent;
	border-color: transparent;
	color: var(--btn-accent);
}

.app-button--text:hover:not(:disabled) {
	background-color: var(--color-bg-tertiary);
}

/* === appearance: link — ведёт себя как ссылка в тексте === */
.app-button--link {
	height: auto;
	padding: 2px;
	background-color: transparent;
	border-color: transparent;
	color: var(--btn-accent);
}

.app-button--link:hover:not(:disabled) {
	text-decoration: underline;
}
</style>
