<script setup lang="ts">
import IconSpinner from '../icons/icon-spinner.vue';

/**
 * Замена директивы `v-loading`: обёртка вокруг блока, который перезагружается
 * на месте (смена фильтра, страницы). Оборачиваемый контент остаётся в DOM —
 * поэтому высота блока не прыгает, в отличие от подмены на скелетон.
 *
 * Директивой это не сделано намеренно: директива не может ни отрисовать
 * разметку спиннера, ни выставить aria-busy на нужный элемент.
 */
withDefaults(
	defineProps<{
		loading?: boolean;
		/** Текст для скринридера на время загрузки. */
		label?: string;
	}>(),
	{ loading: false, label: '' },
);
</script>

<template>
	<div class="app-loading-overlay" :aria-busy="loading || undefined">
		<slot />
		<Transition name="app-loading-fade">
			<div v-if="loading" class="app-loading-overlay__veil">
				<span class="app-loading-overlay__spinner"><IconSpinner /></span>
				<span v-if="label" class="app-loading-overlay__label">
					{{ label }}
				</span>
			</div>
		</Transition>
	</div>
</template>

<style scoped>
.app-loading-overlay {
	position: relative;
}

.app-loading-overlay__veil {
	position: absolute;
	inset: 0;
	z-index: var(--z-raised);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: var(--spacing-sm);
	/*
	 * Полупрозрачная вуаль: под ней виден прежний контент, но клики по нему
	 * перехватываются — иначе можно нажать на элемент, который сейчас заменят.
	 */
	background-color: rgb(255 255 255 / 75%);
	color: var(--color-primary);
}

.app-loading-overlay__spinner {
	display: inline-flex;
	font-size: var(--font-size-3xl);
}

.app-loading-overlay__label {
	color: var(--color-text-secondary);
	font-size: var(--font-size-sm);
}

.app-loading-fade-enter-active,
.app-loading-fade-leave-active {
	transition: opacity var(--transition-base);
}

.app-loading-fade-enter-from,
.app-loading-fade-leave-to {
	opacity: 0;
}
</style>
