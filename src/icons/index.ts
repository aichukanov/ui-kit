/*
 * Иконки пакета — только универсальные, нужные его собственным контролам.
 * Доменные и брендовые иконки (логотипы мессенджеров, клиника, врач, анализ)
 * остаются в приложении: дизайн-система про контролы, а не про предметную область.
 *
 * Автоимпортом НЕ регистрируются — импортировать явно:
 *   import { IconClose } from '@ach/ui-kit/icons';
 */
export { default as IconClose } from './icon-close.vue';
export { default as IconCheckCircle } from './icon-check-circle.vue';
export { default as IconAlertCircle } from './icon-alert-circle.vue';
export { default as IconAlertTriangle } from './icon-alert-triangle.vue';
export { default as IconInfo } from './icon-info.vue';
export { default as IconSpinner } from './icon-spinner.vue';
