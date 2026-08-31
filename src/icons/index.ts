/*
 * Иконки пакета — только универсальные, нужные его собственным контролам.
 * Доменные и брендовые иконки (логотипы мессенджеров, клиника, врач, анализ)
 * остаются в приложении: дизайн-система про контролы, а не про предметную область.
 *
 * Автоимпортом НЕ регистрируются — импортировать явно:
 *   import { KitIconClose } from '@ach/ui-kit/icons';
 */
export { default as KitIconClose } from './icon-close.vue';
export { default as KitIconCheckCircle } from './icon-check-circle.vue';
export { default as KitIconAlertCircle } from './icon-alert-circle.vue';
export { default as KitIconAlertTriangle } from './icon-alert-triangle.vue';
export { default as KitIconInfo } from './icon-info.vue';
export { default as KitIconSpinner } from './icon-spinner.vue';
