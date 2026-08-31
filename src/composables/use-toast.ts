import { shallowRef } from 'vue';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
	id: number;
	type: ToastType;
	message: string;
}

export interface ToastOptions {
	/** Мс до автозакрытия. 0 — не закрывать автоматически. */
	duration?: number;
}

/** Ошибку читают дольше, чем подтверждение успеха. */
const DEFAULT_DURATION: Record<ToastType, number> = {
	success: 3000,
	info: 3000,
	warning: 4000,
	error: 5000,
};

/** Больше не помещается на экран телефона, не превращая его в стену тостов. */
const MAX_VISIBLE = 4;

/*
 * Стек живёт на уровне модуля, а не в useState/provide. Причина: тосты
 * вызываются из обработчиков событий и .catch() — то есть вне setup-контекста,
 * где inject недоступен. Утечки состояния между SSR-запросами это не создаёт:
 * push() ниже отсекает сервер, так что на сервере массив всегда пуст.
 */
const toasts = shallowRef<Toast[]>([]);
let nextId = 0;

const isClient = typeof window !== 'undefined';

function push(type: ToastType, message: string, options?: ToastOptions) {
	// На сервере тост показать некому: он появляется только в ответ на действие
	// пользователя, а разметка ушла бы в HTML и мигнула бы при гидрации.
	if (!isClient || !message) return;

	const id = ++nextId;
	const next = [...toasts.value, { id, type, message }];
	toasts.value = next.slice(-MAX_VISIBLE);

	const duration = options?.duration ?? DEFAULT_DURATION[type];
	if (duration > 0) {
		setTimeout(() => dismiss(id), duration);
	}
}

function dismiss(id: number) {
	toasts.value = toasts.value.filter((toast) => toast.id !== id);
}

/**
 * Замена ElMessage. Вызывать можно откуда угодно, включая обработчики событий
 * и промисы, — привязки к setup-контексту у стека нет.
 */
export function useToast() {
	return {
		success: (message: string, options?: ToastOptions) =>
			push('success', message, options),
		error: (message: string, options?: ToastOptions) =>
			push('error', message, options),
		warning: (message: string, options?: ToastOptions) =>
			push('warning', message, options),
		info: (message: string, options?: ToastOptions) =>
			push('info', message, options),
		dismiss,
	};
}

/** Для AppToaster — единственного легального читателя стека. */
export function useToastStack() {
	return { toasts, dismiss };
}
