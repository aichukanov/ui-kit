<script setup lang="ts">
import KitIconSpinner from '../icons/icon-spinner.vue';

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
	<div class="kit-loading-overlay" :aria-busy="loading || undefined">
		<slot />
		<Transition name="kit-loading-fade">
			<div v-if="loading" class="kit-loading-overlay__veil">
				<span class="kit-loading-overlay__spinner"><KitIconSpinner /></span>
				<span v-if="label" class="kit-loading-overlay__label">
					{{ label }}
				</span>
			</div>
		</Transition>
	</div>
</template>

<style scoped>
.kit-loading-overlay {
	position: relative;
}

.kit-loading-overlay__veil {
	position: absolute;
	inset: 0;
	z-index: var(--kit-z-raised);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: var(--kit-spacing-sm);
	/*
	 * Полупрозрачная вуаль: под ней виден прежний контент, но клики по нему
	 * перехватываются — иначе можно нажать на элемент, который сейчас заменят.
	 */
	background-color: rgb(255 255 255 / 75%);
	color: var(--kit-color-primary);
}

.kit-loading-overlay__spinner {
	display: inline-flex;
	font-size: var(--kit-font-size-3xl);
}

.kit-loading-overlay__label {
	color: var(--kit-color-text-secondary);
	font-size: var(--kit-font-size-sm);
}

.kit-loading-fade-enter-active,
.kit-loading-fade-leave-active {
	transition: opacity var(--kit-transition-base);
}

.kit-loading-fade-enter-from,
.kit-loading-fade-leave-to {
	opacity: 0;
}
</style>
