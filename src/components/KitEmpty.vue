<script setup lang="ts">
/**
 * Состояние «ничего не найдено».
 *
 * Текст приходит только пропсом или слотом: своих строк на конкретном языке
 * в пакете нет — за i18n отвечает приложение.
 */
withDefaults(
	defineProps<{
		description?: string;
		size?: 'small' | 'default';
	}>(),
	{ description: '', size: 'default' },
);
</script>

<template>
	<div class="kit-empty" :class="`kit-empty--${size}`">
		<div v-if="$slots.icon" class="kit-empty__icon">
			<slot name="icon" />
		</div>
		<p v-if="description || $slots.default" class="kit-empty__description">
			<slot>{{ description }}</slot>
		</p>
		<div v-if="$slots.action" class="kit-empty__action">
			<slot name="action" />
		</div>
	</div>
</template>

<style scoped>
.kit-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--kit-spacing-md);
	text-align: center;
	color: var(--kit-color-text-muted);
}

.kit-empty--default {
	padding: var(--kit-spacing-3xl) var(--kit-spacing-lg);
}

.kit-empty--small {
	padding: var(--kit-spacing-xl) var(--kit-spacing-lg);
}

.kit-empty__icon {
	display: inline-flex;
	color: var(--kit-color-text-light);
}

.kit-empty--default .kit-empty__icon {
	font-size: 48px;
}

.kit-empty--small .kit-empty__icon {
	font-size: 32px;
}

.kit-empty__description {
	margin: 0;
	max-width: 42ch;
	font-size: var(--kit-font-size-base);
	line-height: 1.5;
}

.kit-empty--small .kit-empty__description {
	font-size: var(--kit-font-size-sm);
}
</style>
