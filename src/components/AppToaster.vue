<script setup lang="ts">
import IconAlertCircle from '../icons/icon-alert-circle.vue';
import IconAlertTriangle from '../icons/icon-alert-triangle.vue';
import IconCheckCircle from '../icons/icon-check-circle.vue';
import IconClose from '../icons/icon-close.vue';
import IconInfo from '../icons/icon-info.vue';
import { useToastStack, type ToastType } from '../composables/use-toast';

/**
 * Хост тостов. Монтируется РОВНО ОДИН раз — в app.vue приложения.
 * Сам стек живёт в use-toast.ts, здесь только отрисовка.
 */
withDefaults(
	defineProps<{
		/** Подпись кнопки закрытия для скринридера. */
		closeLabel?: string;
	}>(),
	{ closeLabel: '' },
);

const { toasts, dismiss } = useToastStack();

const icons: Record<ToastType, unknown> = {
	success: IconCheckCircle,
	error: IconAlertCircle,
	warning: IconAlertTriangle,
	info: IconInfo,
};
</script>

<template>
	<Teleport to="body">
		<!--
			aria-live на контейнере, а не на тосте: регион должен существовать
			в DOM до появления сообщения, иначе скринридер его не озвучит.
			polite, а не assertive, — тост не прерывает чтение страницы.
		-->
		<div
			class="app-toaster"
			role="status"
			aria-live="polite"
			aria-atomic="false"
		>
			<TransitionGroup name="app-toast">
				<div
					v-for="toast in toasts"
					:key="toast.id"
					class="app-toast"
					:class="`app-toast--${toast.type}`"
				>
					<span class="app-toast__icon">
						<component :is="icons[toast.type]" />
					</span>
					<p class="app-toast__message">{{ toast.message }}</p>
					<button
						type="button"
						class="app-toast__close"
						:aria-label="closeLabel || undefined"
						@click="dismiss(toast.id)"
					>
						<IconClose />
					</button>
				</div>
			</TransitionGroup>
		</div>
	</Teleport>
</template>

<style scoped>
.app-toaster {
	position: fixed;
	/* Ниже модалок, но выше всего остального: тост поверх открытого диалога */
	z-index: var(--z-tooltip);
	top: var(--spacing-lg);
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--spacing-sm);
	width: max-content;
	max-width: calc(100vw - 2 * var(--spacing-lg));
	/* Пустой контейнер не должен перехватывать клики по странице */
	pointer-events: none;
}

.app-toast {
	pointer-events: auto;
	display: flex;
	align-items: flex-start;
	gap: var(--spacing-sm);
	box-sizing: border-box;
	max-width: 100%;
	padding: var(--spacing-md) var(--spacing-lg);
	border: var(--border-width-thin) solid var(--toast-border);
	border-radius: var(--border-radius-lg);
	background-color: var(--toast-bg);
	color: var(--toast-fg);
	box-shadow: var(--shadow-lg);
	font-size: var(--font-size-sm);
}

/* Цвет текста из *-solid: базовые success/warning на своей заливке дают ~2:1 */
.app-toast--info {
	--toast-bg: var(--color-bg-primary);
	--toast-border: var(--color-border-secondary);
	--toast-fg: var(--color-text-primary);
}

.app-toast--success {
	--toast-bg: var(--color-success-bg);
	--toast-border: var(--color-success-border);
	--toast-fg: var(--color-success-solid);
}

.app-toast--warning {
	--toast-bg: var(--color-warning-bg);
	--toast-border: var(--color-warning-border);
	--toast-fg: var(--color-warning-solid);
}

.app-toast--error {
	--toast-bg: var(--color-danger-bg);
	--toast-border: var(--color-danger-border);
	--toast-fg: var(--color-danger-solid);
}

.app-toast__icon {
	display: inline-flex;
	flex-shrink: 0;
	margin-top: 0.1em;
	font-size: var(--font-size-base);
}

.app-toast__message {
	margin: 0;
	line-height: 1.5;
	/* Длинный текст ошибки должен переноситься, а не растягивать тост */
	overflow-wrap: anywhere;
}

.app-toast__close {
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	margin: -2px calc(-1 * var(--spacing-sm)) 0 0;
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

.app-toast__close:hover {
	opacity: 1;
}

.app-toast__close:focus-visible {
	outline: 2px solid currentColor;
	outline-offset: 1px;
	opacity: 1;
}

.app-toast-enter-active,
.app-toast-leave-active {
	transition:
		opacity var(--transition-base),
		transform var(--transition-base);
}

.app-toast-enter-from,
.app-toast-leave-to {
	opacity: 0;
	transform: translateY(-8px);
}

/* Уезжающий тост выходит из потока, чтобы остальные не дёргались */
.app-toast-leave-active {
	position: absolute;
}

@media (prefers-reduced-motion: reduce) {
	.app-toast-enter-active,
	.app-toast-leave-active {
		transition: opacity var(--transition-base);
	}

	.app-toast-enter-from,
	.app-toast-leave-to {
		transform: none;
	}
}
</style>
