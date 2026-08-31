<script setup lang="ts">
/**
 * Неинтерактивная метка: статус, категория, признак.
 *
 * Если по метке нужно кликать — это кнопка, а не тег: берите AppButton
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
		class="app-tag"
		:class="[
			`app-tag--variant-${variant}`,
			`app-tag--${appearance}`,
			`app-tag--size-${size}`,
			{ 'is-round': round },
		]"
	>
		<slot />
	</span>
</template>

<style scoped>
/*
 * --tag-fg берётся из *-solid, а не из базового --color-*: на бледной заливке
 * базовый success даёт 2.4:1, warning 2.1:1, danger 3.4:1 — ниже нормы AA
 * для мелкого текста. Element Plus красил именно базовым.
 */
.app-tag {
	--tag-fg: var(--color-text-secondary);
	--tag-bg: var(--color-bg-tertiary);
	--tag-border: var(--color-border-secondary);
	--tag-solid: var(--color-text-secondary);

	display: inline-flex;
	align-items: center;
	gap: var(--spacing-xs);
	box-sizing: border-box;
	border: var(--border-width-thin) solid transparent;
	border-radius: var(--border-radius-sm);
	line-height: 1;
	white-space: nowrap;
}

.app-tag--variant-primary {
	--tag-fg: var(--color-primary);
	--tag-bg: var(--color-primary-bg);
	--tag-border: var(--color-border-accent);
	--tag-solid: var(--color-primary-solid);
}

.app-tag--variant-success {
	--tag-fg: var(--color-success-solid);
	--tag-bg: var(--color-success-bg);
	--tag-border: var(--color-success-border);
	--tag-solid: var(--color-success-solid);
}

.app-tag--variant-warning {
	--tag-fg: var(--color-warning-solid);
	--tag-bg: var(--color-warning-bg);
	--tag-border: var(--color-warning-border);
	--tag-solid: var(--color-warning-solid);
}

.app-tag--variant-danger {
	--tag-fg: var(--color-danger-solid);
	--tag-bg: var(--color-danger-bg);
	--tag-border: var(--color-danger-border);
	--tag-solid: var(--color-danger-solid);
}

/* === Размеры: метрики Element Plus === */
.app-tag--size-small {
	height: 20px;
	padding: 0 var(--spacing-sm);
	font-size: var(--font-size-xs);
}

.app-tag--size-default {
	height: 24px;
	padding: 0 var(--spacing-md);
	font-size: var(--font-size-xs);
}

.app-tag--size-large {
	height: 32px;
	padding: 0 var(--spacing-md);
	font-size: var(--font-size-sm);
}

.app-tag.is-round {
	border-radius: 999px;
}

/* === appearance === */
.app-tag--light {
	background-color: var(--tag-bg);
	border-color: var(--tag-border);
	color: var(--tag-fg);
}

.app-tag--solid {
	background-color: var(--tag-solid);
	border-color: var(--tag-solid);
	color: var(--color-text-on-solid);
}

.app-tag--plain {
	background-color: transparent;
	border-color: var(--tag-fg);
	color: var(--tag-fg);
}
</style>
