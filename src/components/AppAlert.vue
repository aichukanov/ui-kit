<script setup lang="ts">
import { computed } from 'vue';
import IconAlertCircle from '../icons/icon-alert-circle.vue';
import IconAlertTriangle from '../icons/icon-alert-triangle.vue';
import IconCheckCircle from '../icons/icon-check-circle.vue';
import IconClose from '../icons/icon-close.vue';
import IconInfo from '../icons/icon-info.vue';

/**
 * Сообщение о состоянии в потоке страницы.
 *
 * Варианты названы по событию (`error` — «ошибка произошла»), а не по опасности
 * действия (`danger` у AppButton): это разные вещи и разные слова намеренно.
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
	info: IconInfo,
	success: IconCheckCircle,
	warning: IconAlertTriangle,
	error: IconAlertCircle,
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
	<div class="app-alert" :class="`app-alert--${variant}`" :role="role">
		<span v-if="showIcon" class="app-alert__icon">
			<component :is="icon" />
		</span>
		<div class="app-alert__content">
			<p v-if="title || $slots.default" class="app-alert__title">
				<slot>{{ title }}</slot>
			</p>
			<p
				v-if="description || $slots.description"
				class="app-alert__description"
			>
				<slot name="description">{{ description }}</slot>
			</p>
		</div>
		<button
			v-if="closable"
			type="button"
			class="app-alert__close"
			:aria-label="closeLabel || undefined"
			@click="$emit('close')"
		>
			<IconClose />
		</button>
	</div>
</template>

<style scoped>
/*
 * Текст берётся из --color-*-solid, а не из базового --color-*: на светлой
 * подложке базовый success даёт 2.4:1, warning 2.1:1 — ниже нормы AA.
 */
.app-alert {
	display: flex;
	align-items: flex-start;
	gap: var(--spacing-sm);
	padding: var(--spacing-sm) var(--spacing-md);
	border: var(--border-width-thin) solid var(--alert-border);
	border-radius: var(--border-radius-md);
	background-color: var(--alert-bg);
	color: var(--alert-fg);
	font-size: var(--font-size-sm);
}

.app-alert--info {
	--alert-bg: var(--color-bg-tertiary);
	--alert-border: var(--color-border-secondary);
	--alert-fg: var(--color-text-secondary);
}

.app-alert--success {
	--alert-bg: var(--color-success-bg);
	--alert-border: var(--color-success-border);
	--alert-fg: var(--color-success-solid);
}

.app-alert--warning {
	--alert-bg: var(--color-warning-bg);
	--alert-border: var(--color-warning-border);
	--alert-fg: var(--color-warning-solid);
}

.app-alert--error {
	--alert-bg: var(--color-danger-bg);
	--alert-border: var(--color-danger-border);
	--alert-fg: var(--color-danger-solid);
}

.app-alert__icon {
	display: inline-flex;
	flex-shrink: 0;
	/* Выравнивание по первой строке заголовка, а не по центру блока */
	margin-top: 0.1em;
	font-size: var(--font-size-base);
}

.app-alert__content {
	flex: 1;
	min-width: 0;
}

.app-alert__title {
	margin: 0;
	font-weight: var(--font-weight-medium);
	line-height: 1.5;
}

.app-alert__description {
	margin: var(--spacing-xs) 0 0;
	line-height: 1.5;
	font-weight: var(--font-weight-normal);
}

.app-alert__close {
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	/* 24px — минимум, при котором цель попадает в палец на 16px-иконке */
	width: 24px;
	height: 24px;
	margin: -2px calc(-1 * var(--spacing-xs)) 0 0;
	padding: 0;
	border: none;
	border-radius: var(--border-radius-sm);
	background: transparent;
	color: inherit;
	font-size: var(--font-size-base);
	cursor: pointer;
	opacity: 0.7;
	transition: opacity var(--transition-base);
}

.app-alert__close:hover {
	opacity: 1;
}

.app-alert__close:focus-visible {
	outline: 2px solid currentColor;
	outline-offset: 1px;
	opacity: 1;
}
</style>
