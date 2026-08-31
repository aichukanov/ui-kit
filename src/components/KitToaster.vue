<script setup lang="ts">
import KitIconAlertCircle from '../icons/icon-alert-circle.vue';
import KitIconAlertTriangle from '../icons/icon-alert-triangle.vue';
import KitIconCheckCircle from '../icons/icon-check-circle.vue';
import KitIconClose from '../icons/icon-close.vue';
import KitIconInfo from '../icons/icon-info.vue';
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
	success: KitIconCheckCircle,
	error: KitIconAlertCircle,
	warning: KitIconAlertTriangle,
	info: KitIconInfo,
};

/**
 * Замораживает размеры уходящего тоста.
 *
 * На уходе тост выводится из потока (`position: absolute` в `-leave-active`),
 * чтобы остальные плавно поднялись на его место. Но вне потока он теряет
 * ширину, полученную от флекс-контейнера, и пересчитывает её заново — текст
 * переверстывается, и тост «растягивается вниз» вместо того чтобы исчезнуть.
 * Размеры в пикселях известны только живому DOM, поэтому CSS здесь не помог бы.
 *
 * Ширина берётся из getBoundingClientRect, а НЕ из offsetWidth: тот округляет
 * до целого, и потерянной доли пикселя хватает, чтобы последнее слово
 * перескочило на новую строку. Ловилось только на сообщениях, чья длина
 * почти точно равна ширине строки.
 *
 * Высота фиксируется тоже — не потому, что известен сценарий, где она поедет
 * при верной ширине, а чтобы вывести из уравнения весь класс таких ошибок:
 * уходящий элемент не должен пересчитывать раскладку вообще.
 */
function freezeSize(el: Element) {
	const node = el as HTMLElement;
	const rect = node.getBoundingClientRect();
	node.style.width = `${rect.width}px`;
	node.style.height = `${rect.height}px`;
}
</script>

<template>
	<Teleport to="body">
		<!--
			aria-live на контейнере, а не на тосте: регион должен существовать
			в DOM до появления сообщения, иначе скринридер его не озвучит.
			polite, а не assertive, — тост не прерывает чтение страницы.
		-->
		<div
			class="kit-toaster"
			role="status"
			aria-live="polite"
			aria-atomic="false"
		>
			<TransitionGroup name="kit-toast" @before-leave="freezeSize">
				<div
					v-for="toast in toasts"
					:key="toast.id"
					class="kit-toast"
					:class="`kit-toast--${toast.type}`"
				>
					<span class="kit-toast__icon">
						<component :is="icons[toast.type]" />
					</span>
					<p class="kit-toast__message">{{ toast.message }}</p>
					<button
						type="button"
						class="kit-toast__close"
						:aria-label="closeLabel || undefined"
						@click="dismiss(toast.id)"
					>
						<KitIconClose />
					</button>
				</div>
			</TransitionGroup>
		</div>
	</Teleport>
</template>

<style scoped>
.kit-toaster {
	position: fixed;
	/* Ниже модалок, но выше всего остального: тост поверх открытого диалога */
	z-index: var(--kit-z-tooltip);
	top: var(--kit-spacing-lg);
	/*
	 * Контейнер растянут по окну, а тосты центрируются внутри него. Раньше он
	 * был `width: max-content` со сдвигом на половину себя — и при удалении
	 * тоста менял ширину, из-за чего остальные дёргались по горизонтали,
	 * а уходящий (он вне потока) оставался у прежней координаты.
	 */
	left: var(--kit-spacing-lg);
	right: var(--kit-spacing-lg);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--kit-spacing-sm);
	/* Пустой контейнер не должен перехватывать клики по странице */
	pointer-events: none;
}

.kit-toast {
	/* Высота строки сообщения: по ней выравниваются иконка и крестик — они
	   должны стоять на ПЕРВОЙ строке, а не по центру многострочного тоста */
	--kit-toast-line-height: 1.5;
	--kit-toast-line: calc(
		var(--kit-font-size-sm) * var(--kit-toast-line-height)
	);

	pointer-events: auto;
	display: flex;
	align-items: flex-start;
	gap: var(--kit-spacing-sm);
	box-sizing: border-box;
	/* Контейнер во всю ширину окна, поэтому длинная ошибка растянулась бы
	   на весь экран — ограничиваем комфортной длиной строки */
	max-width: min(100%, 32rem);
	padding: var(--kit-spacing-md) var(--kit-spacing-lg);
	border: var(--kit-border-width-thin) solid var(--kit-toast-border);
	border-radius: var(--kit-border-radius-lg);
	background-color: var(--kit-toast-bg);
	color: var(--kit-toast-fg);
	box-shadow: var(--kit-shadow-lg);
	font-size: var(--kit-font-size-sm);
}

/* Цвет текста из *-solid: базовые success/warning на своей заливке дают ~2:1 */
.kit-toast--info {
	--kit-toast-bg: var(--kit-color-bg-primary);
	--kit-toast-border: var(--kit-color-border-secondary);
	--kit-toast-fg: var(--kit-color-text-primary);
}

.kit-toast--success {
	--kit-toast-bg: var(--kit-color-success-bg);
	--kit-toast-border: var(--kit-color-success-border);
	--kit-toast-fg: var(--kit-color-success-solid);
}

.kit-toast--warning {
	--kit-toast-bg: var(--kit-color-warning-bg);
	--kit-toast-border: var(--kit-color-warning-border);
	--kit-toast-fg: var(--kit-color-warning-solid);
}

.kit-toast--error {
	--kit-toast-bg: var(--kit-color-danger-bg);
	--kit-toast-border: var(--kit-color-danger-border);
	--kit-toast-fg: var(--kit-color-danger-solid);
}

.kit-toast__icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	/* Бокс ростом в строку сообщения — иконка центрируется в нём сама */
	height: var(--kit-toast-line);
	font-size: var(--kit-font-size-base);
}

.kit-toast__message {
	margin: 0;
	line-height: var(--kit-toast-line-height);
	/* Длинный текст ошибки должен переноситься, а не растягивать тост */
	overflow-wrap: anywhere;
}

.kit-toast__close {
	flex-shrink: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	/* 24px — минимум, при котором цель попадает в палец на 16px-иконке.
	   Цель выше строки сообщения, поэтому центрируем её по строке расчётом,
	   а не подгонкой на глаз */
	width: 24px;
	height: 24px;
	margin: calc((var(--kit-toast-line) - 24px) / 2)
		calc(-1 * var(--kit-spacing-sm)) 0 0;
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

.kit-toast__close:hover {
	opacity: 1;
}

.kit-toast__close:focus-visible {
	outline: 2px solid currentColor;
	outline-offset: 1px;
	opacity: 1;
}

.kit-toast-enter-active,
.kit-toast-leave-active {
	transition:
		opacity var(--kit-transition-base),
		transform var(--kit-transition-base);
}

.kit-toast-enter-from,
.kit-toast-leave-to {
	opacity: 0;
	transform: translateY(-8px);
}

/*
 * Уезжающий тост выходит из потока, иначе он держал бы своё место до конца
 * анимации, а потом остальные скакнули бы вверх. Размеры ему фиксирует
 * freezeSize() — без этого он пересчитывает раскладку вне потока и текст
 * переверстывается.
 */
.kit-toast-leave-active {
	position: absolute;
}

/* Остальные тосты занимают освободившееся место плавно, а не рывком */
.kit-toast-move {
	transition: transform var(--kit-transition-base);
}

@media (prefers-reduced-motion: reduce) {
	.kit-toast-enter-active,
	.kit-toast-leave-active {
		transition: opacity var(--kit-transition-base);
	}

	.kit-toast-enter-from,
	.kit-toast-leave-to {
		transform: none;
	}

	.kit-toast-move {
		transition: none;
	}
}
</style>
