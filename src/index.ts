/*
 * Точка входа для явных импортов и для проектов без Nuxt.
 *
 * В Nuxt-приложении ничего из этого файла импортировать не нужно: модуль
 * `@ach/ui-kit/nuxt` регистрирует компоненты и composables автоимпортом.
 */

export { default as KitAlert } from './components/KitAlert.vue';
export { default as KitButton } from './components/KitButton.vue';
export { default as KitEmpty } from './components/KitEmpty.vue';
export { default as KitLoadingOverlay } from './components/KitLoadingOverlay.vue';
export { default as KitSelect } from './components/KitSelect.vue';
export { default as KitSkeleton } from './components/KitSkeleton.vue';
export { default as KitTag } from './components/KitTag.vue';
export { default as KitToaster } from './components/KitToaster.vue';

export { useToast, useToastStack } from './composables/use-toast';
export type { Toast, ToastOptions, ToastType } from './composables/use-toast';

export * from './icons';
