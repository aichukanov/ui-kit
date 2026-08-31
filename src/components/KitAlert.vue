<script setup lang="ts">
import { computed } from 'vue';
import KitIconAlertCircle from '../icons/icon-alert-circle.vue';
import KitIconAlertTriangle from '../icons/icon-alert-triangle.vue';
import KitIconCheckCircle from '../icons/icon-check-circle.vue';
import KitIconClose from '../icons/icon-close.vue';
import KitIconInfo from '../icons/icon-info.vue';

/**
 * Сообщение о состоянии в потоке страницы.
 *
 * Варианты названы по событию (`error` — «ошибка произошла»), а не по опасности
 * действия (`danger` у KitButton): это разные вещи и разные слова намеренно.
 */
const props = withDefaults(
	defineProps<{
		variant?: 'info' | 'success' | 'warning' | 'error';
		title?: string;
		description?: string;
		closable?: boolean;
		showIcon?: boolean;
		/** Подпись кнопки закрытия для скринридера — обязательна при closable. */
		closeLabel?: string;
	}>(),
	{
		variant: 'info',
		title: '',
		description: '',
		closable: false,
		showIcon: false,
		closeLabel: '',
	},
);

defineEmits<{ close: [] }>();

const icons = {
	info: KitIconInfo,
	success: KitIconCheckCircle,
	warning: KitIconAlertTriangle,
	error: KitIconAlertCircle,
};

const icon = computed(() => icons[props.variant]);

/*
 * role="alert" сообщает скринридеру немедленно и прерывает чтение — это
 * оправдано только для ошибок и предупреждений. Для info/success достаточно
 * вежливого status.
 */
const role = computed(() =>
	props.variant === 'error' || props.variant === 'warning' ? 'alert' : 'status',
);
</script>

<template>
	<div class="kit-alert" :class="`kit-alert--${variant}`" :role="role">
		<span v-if="showIcon" class="kit-alert__icon">
			<component :is="icon" />
		</span>
		<div class="kit-alert__content">
			<p v-if="title || $slots.default" class="kit-alert__title">
				<slot>{{ title }}</slot>
			</p>
			<p
				v-if="description || $slots.description"
				class="kit-alert__description"
			>
				<slot name="description">{{ description }}</slot>
			</p>
		</div>
		<button
			v-if="closable"
			type="button"
			class="kit-alert__close"
			:aria-label="closeLabel || undefined"
			@click="$emit('close')"
		>
			<KitIconClose />
		</button>
	</div>
</template>

<style scoped>
/*
 * Текст берётся из --color-*-solid, а не из базового --color-*: на светлой
 * подложке базовый success даёт 2.4:1, warning 2.1:1 — ниже нормы AA.
 */
.kit-alert {
	/*
	 * Высота строки заголовка. Иконка и крестик тянутся к ней, а не к центру
	 * блока: у многострочного алерта они должны стоять на ПЕРВОЙ строке.
	 * Значение в токенах, а не в em, — у иконки своя font-size, и em считался
	 * бы от неё.
	 */
	--kit-alert-line-height: 1.5;
	--kit-alert-line: calc(
		var(--kit-font-size-sm) * var(--kit-alert-line-height)
	);

	display: flex;
	align-items: flex-start;
	gap: var(--kit-spacing-sm);
	padding: var(--kit-spacing-sm) var(--kit-spacing-md);
	border: var(--kit-border-width-thin) solid var(--kit-alert-border);
	border-radius: var(--kit-border-radius-md);
	background-color: var(--kit-alert-bg);
	color: var(--kit-alert-fg);
	font-size: var(--kit-font-size-sm);
}

.kit-alert--info {
	--kit-alert-bg: var(--kit-color-bg-tertiary);
	--kit-alert-border: var(--kit-color-border-secondary);
	--kit-alert-fg: var(--kit-color-text-secondary);
}

.kit-alert--success {
	--kit-alert-bg: var(--kit-color-success-bg);
	--kit-alert-border: var(--kit-color-success-border);
	--kit-alert-fg: var(--kit-color-success-solid);
}

.kit-alert--warning {
	--kit-alert-bg: var(--kit-color-warning-bg);
	--kit-alert-border: var(--kit-color-warning-border);
	--kit-alert-fg: var(--kit-color-warning-solid);
}

.kit-alert--error {
	--kit-alert-bg: var(--kit-color-danger-bg);
	--kit-alert-border: var(--kit-color-danger-border);
	--kit-alert-fg: var(--kit-color-danger-solid);
}

.kit-alert__icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	/* Бокс ростом в строку заголовка — иконка центрируется в нём сама,
	   без подгонки отступом на глаз */
	height: var(--kit-alert-line);
	font-size: var(--kit-font-size-base);
}

.kit-alert__content {
	flex: 1;
	min-width: 0;
}

.kit-alert__title {
	margin: 0;
	font-weight: var(--kit-font-weight-medium);
	line-height: var(--kit-alert-line-height);
}

.kit-alert__description {
	margin: var(--kit-spacing-xs) 0 0;
	line-height: var(--kit-alert-line-height);
	font-weight: var(--kit-font-weight-normal);
}

.kit-alert__close {
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	/* 24px — минимум, при котором цель попадает в палец на 16px-иконке */
	width: 24px;
	height: 24px;
	margin: -2px calc(-1 * var(--kit-spacing-xs)) 0 0;
	padding: 0;
	border: none;
	border-radius: var(--kit-border-radius-sm);
	background: transparent;
	color: inherit;
	font-size: var(--kit-font-size-base);
	cursor: pointer;
	opacity: 0.7;
	transition: opacity var(--kit-transition-base);
}

.kit-alert__close:hover {
	opacity: 1;
}

.kit-alert__close:focus-visible {
	outline: 2px solid currentColor;
	outline-offset: 1px;
	opacity: 1;
}
</style>
