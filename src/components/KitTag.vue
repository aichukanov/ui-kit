<script setup lang="ts">
/**
 * Неинтерактивная метка: статус, категория, признак.
 *
 * Если по метке нужно кликать — это кнопка, а не тег: берите KitButton
 * с size="small" и appearance="plain".
 */
withDefaults(
	defineProps<{
		variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
		/** light — бледная заливка, solid — сплошная, plain — только контур. */
		appearance?: 'light' | 'solid' | 'plain';
		size?: 'small' | 'default' | 'large';
		round?: boolean;
	}>(),
	{
		variant: 'default',
		appearance: 'light',
		size: 'default',
		round: false,
	},
);
</script>

<template>
	<span
		class="kit-tag"
		:class="[
			`kit-tag--variant-${variant}`,
			`kit-tag--${appearance}`,
			`kit-tag--size-${size}`,
			{ 'is-round': round },
		]"
	>
		<slot />
	</span>
</template>

<style scoped>
/*
 * --kit-tag-fg берётся из *-solid, а не из базового --color-*: на бледной заливке
 * базовый success даёт 2.4:1, warning 2.1:1, danger 3.4:1 — ниже нормы AA
 * для мелкого текста. Element Plus красил именно базовым.
 */
.kit-tag {
	--kit-tag-fg: var(--kit-color-text-secondary);
	--kit-tag-bg: var(--kit-color-bg-tertiary);
	--kit-tag-border: var(--kit-color-border-secondary);
	--kit-tag-solid: var(--kit-color-text-secondary);

	display: inline-flex;
	align-items: center;
	gap: var(--kit-spacing-xs);
	box-sizing: border-box;
	border: var(--kit-border-width-thin) solid transparent;
	border-radius: var(--kit-border-radius-sm);
	line-height: 1;
	white-space: nowrap;
}

.kit-tag--variant-primary {
	--kit-tag-fg: var(--kit-color-primary);
	--kit-tag-bg: var(--kit-color-primary-bg);
	--kit-tag-border: var(--kit-color-border-accent);
	--kit-tag-solid: var(--kit-color-primary-solid);
}

.kit-tag--variant-success {
	--kit-tag-fg: var(--kit-color-success-solid);
	--kit-tag-bg: var(--kit-color-success-bg);
	--kit-tag-border: var(--kit-color-success-border);
	--kit-tag-solid: var(--kit-color-success-solid);
}

.kit-tag--variant-warning {
	--kit-tag-fg: var(--kit-color-warning-solid);
	--kit-tag-bg: var(--kit-color-warning-bg);
	--kit-tag-border: var(--kit-color-warning-border);
	--kit-tag-solid: var(--kit-color-warning-solid);
}

.kit-tag--variant-danger {
	--kit-tag-fg: var(--kit-color-danger-solid);
	--kit-tag-bg: var(--kit-color-danger-bg);
	--kit-tag-border: var(--kit-color-danger-border);
	--kit-tag-solid: var(--kit-color-danger-solid);
}

/* === Размеры: метрики Element Plus === */
.kit-tag--size-small {
	height: 20px;
	padding: 0 var(--kit-spacing-sm);
	font-size: var(--kit-font-size-xs);
}

.kit-tag--size-default {
	height: 24px;
	padding: 0 var(--kit-spacing-md);
	font-size: var(--kit-font-size-xs);
}

.kit-tag--size-large {
	height: 32px;
	padding: 0 var(--kit-spacing-md);
	font-size: var(--kit-font-size-sm);
}

.kit-tag.is-round {
	border-radius: 999px;
}

/* === appearance === */
.kit-tag--light {
	background-color: var(--kit-tag-bg);
	border-color: var(--kit-tag-border);
	color: var(--kit-tag-fg);
}

.kit-tag--solid {
	background-color: var(--kit-tag-solid);
	border-color: var(--kit-tag-solid);
	color: var(--kit-color-text-on-solid);
}

.kit-tag--plain {
	background-color: transparent;
	border-color: var(--kit-tag-fg);
	color: var(--kit-tag-fg);
}
</style>
