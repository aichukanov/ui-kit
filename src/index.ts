/*
 * Точка входа для явных импортов и для проектов без Nuxt.
 *
 * В Nuxt-приложении ничего из этого файла импортировать не нужно: модуль
 * `@ach/ui-kit/nuxt` регистрирует компоненты и composables автоимпортом.
 */

export { default as AppAlert } from './components/AppAlert.vue';
export { default as AppButton } from './components/AppButton.vue';
export { default as AppEmpty } from './components/AppEmpty.vue';
export { default as AppLoadingOverlay } from './components/AppLoadingOverlay.vue';
export { default as AppSkeleton } from './components/AppSkeleton.vue';
export { default as AppTag } from './components/AppTag.vue';
export { default as AppToaster } from './components/AppToaster.vue';

export { useToast, useToastStack } from './composables/use-toast';
export type { Toast, ToastOptions, ToastType } from './composables/use-toast';

export * from './icons';
