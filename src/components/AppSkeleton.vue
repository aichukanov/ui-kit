<script setup lang="ts">
/**
 * Заглушка на месте ещё не загруженного контента.
 *
 * `rows` рисует несколько строк текста; последняя короче — так глаз читает
 * блок как абзац, а не как таблицу.
 */
withDefaults(
	defineProps<{
		variant?: 'text' | 'heading' | 'image' | 'circle' | 'button';
		/** Число строк для variant="text". */
		rows?: number;
		animated?: boolean;
		width?: string;
		height?: string;
	}>(),
	{
		variant: 'text',
		rows: 1,
		animated: true,
		width: '',
		height: '',
	},
);
</script>

<template>
	<!--
		aria-hidden: скелетон — визуальная заглушка, скринридеру он не нужен.
		О загрузке сообщает сам блок контента (aria-busy на контейнере).
	-->
	<div
		v-if="variant === 'text' && rows > 1"
		class="app-skeleton-rows"
		aria-hidden="true"
	>
		<span
			v-for="row in rows"
			:key="row"
			class="app-skeleton app-skeleton--text"
			:class="{ 'is-animated': animated, 'is-last': row === rows }"
		/>
	</div>
	<span
		v-else
		class="app-skeleton"
		:class="[`app-skeleton--${variant}`, { 'is-animated': animated }]"
		:style="{ width: width || undefined, height: height || undefined }"
		aria-hidden="true"
	/>
</template>

<style scoped>
.app-skeleton {
	display: block;
	background-color: var(--color-bg-muted);
	border-radius: var(--border-radius-sm);
}

.app-skeleton--text {
	height: 1em;
	width: 100%;
}

.app-skeleton--heading {
	height: 1.5em;
	width: 60%;
}

.app-skeleton--image {
	height: 160px;
	width: 100%;
	border-radius: var(--border-radius-lg);
}

.app-skeleton--circle {
	height: 40px;
	width: 40px;
	border-radius: var(--border-radius-full);
}

.app-skeleton--button {
	height: 32px;
	width: 96px;
	border-radius: var(--border-radius-md);
}

.app-skeleton-rows {
	display: flex;
	flex-direction: column;
	gap: var(--spacing-sm);
}

/* Последняя строка короче — блок читается как абзац текста */
.app-skeleton-rows .is-last {
	width: 60%;
}

.app-skeleton.is-animated {
	/* Блик по градиенту вместо пульсации яркости: спокойнее для глаз */
	background-image: linear-gradient(
		90deg,
		transparent 25%,
		var(--color-bg-tertiary) 37%,
		transparent 63%
	);
	background-size: 400% 100%;
	animation: app-skeleton-shimmer 1.4s ease-in-out infinite;
}

@keyframes app-skeleton-shimmer {
	from {
		background-position: 100% 50%;
	}

	to {
		background-position: 0 50%;
	}
}

@media (prefers-reduced-motion: reduce) {
	.app-skeleton.is-animated {
		background-image: none;
		animation: none;
	}
}
</style>
