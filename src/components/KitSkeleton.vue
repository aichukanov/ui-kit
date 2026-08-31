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
		class="kit-skeleton-rows"
		aria-hidden="true"
	>
		<span
			v-for="row in rows"
			:key="row"
			class="kit-skeleton kit-skeleton--text"
			:class="{ 'is-animated': animated, 'is-last': row === rows }"
		/>
	</div>
	<span
		v-else
		class="kit-skeleton"
		:class="[`kit-skeleton--${variant}`, { 'is-animated': animated }]"
		:style="{ width: width || undefined, height: height || undefined }"
		aria-hidden="true"
	/>
</template>

<style scoped>
.kit-skeleton {
	display: block;
	background-color: var(--kit-color-bg-muted);
	border-radius: var(--kit-border-radius-sm);
}

.kit-skeleton--text {
	height: 1em;
	width: 100%;
}

.kit-skeleton--heading {
	height: 1.5em;
	width: 60%;
}

.kit-skeleton--image {
	height: 160px;
	width: 100%;
	border-radius: var(--kit-border-radius-lg);
}

.kit-skeleton--circle {
	height: 40px;
	width: 40px;
	border-radius: var(--kit-border-radius-full);
}

.kit-skeleton--button {
	height: 32px;
	width: 96px;
	border-radius: var(--kit-border-radius-md);
}

.kit-skeleton-rows {
	display: flex;
	flex-direction: column;
	gap: var(--kit-spacing-sm);
}

/* Последняя строка короче — блок читается как абзац текста */
.kit-skeleton-rows .is-last {
	width: 60%;
}

.kit-skeleton.is-animated {
	/* Блик по градиенту вместо пульсации яркости: спокойнее для глаз */
	background-image: linear-gradient(
		90deg,
		transparent 25%,
		var(--kit-color-bg-tertiary) 37%,
		transparent 63%
	);
	background-size: 400% 100%;
	animation: kit-skeleton-shimmer 1.4s ease-in-out infinite;
}

@keyframes kit-skeleton-shimmer {
	from {
		background-position: 100% 50%;
	}

	to {
		background-position: 0 50%;
	}
}

@media (prefers-reduced-motion: reduce) {
	.kit-skeleton.is-animated {
		background-image: none;
		animation: none;
	}
}
</style>
