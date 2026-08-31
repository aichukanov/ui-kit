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
	<div class="app-empty" :class="`app-empty--${size}`">
		<div v-if="$slots.icon" class="app-empty__icon">
			<slot name="icon" />
		</div>
		<p v-if="description || $slots.default" class="app-empty__description">
			<slot>{{ description }}</slot>
		</p>
		<div v-if="$slots.action" class="app-empty__action">
			<slot name="action" />
		</div>
	</div>
</template>

<style scoped>
.app-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--spacing-md);
	text-align: center;
	color: var(--color-text-muted);
}

.app-empty--default {
	padding: var(--spacing-3xl) var(--spacing-lg);
}

.app-empty--small {
	padding: var(--spacing-xl) var(--spacing-lg);
}

.app-empty__icon {
	display: inline-flex;
	color: var(--color-text-light);
}

.app-empty--default .app-empty__icon {
	font-size: 48px;
}

.app-empty--small .app-empty__icon {
	font-size: 32px;
}

.app-empty__description {
	margin: 0;
	max-width: 42ch;
	font-size: var(--font-size-base);
	line-height: 1.5;
}

.app-empty--small .app-empty__description {
	font-size: var(--font-size-sm);
}
</style>
