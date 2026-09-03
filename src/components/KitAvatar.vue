<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
	AVATAR_TEXT_COLOR,
	getAvatarColor,
	getInitials,
} from '../avatar-colors';

/**
 * Аватар: фото, а если его нет или оно не загрузилось — цветной квадрат
 * с инициалами.
 *
 * Заглушка рисуется CSS-ом и не делает сетевого запроса. Так было не всегда:
 * раньше подставлялся сторонний генератор картинок (ui-avatars) — ещё один
 * хост на пути к LCP-картинке, причём без фолбэка, и запрос к нему стартовал
 * только после провала первого.
 */
const props = withDefaults(
	defineProps<{
		/** Для aria-label и, если не задан seed, для выбора цвета. */
		name: string;
		photoUrl?: string | null;
		size: number;
		/** Готовые инициалы. Без них берутся первые буквы двух первых слов. */
		initials?: string;
		/** Строка для выбора цвета. По умолчанию — `name`. */
		colorSeed?: string;
		/** 'eager' — для изображений выше фолда (LCP детальной страницы). */
		loading?: 'lazy' | 'eager';
	}>(),
	{
		photoUrl: null,
		initials: '',
		colorSeed: '',
		loading: 'lazy',
	},
);

/**
 * Наружу сообщаем, показано ли настоящее фото: решение о зуме принимает
 * приложение (оверлей — его компонент), а знает об этом только аватар,
 * потому что фолбэк по ошибке загрузки случается здесь.
 */
const emit = defineEmits<{ 'photo-state': [hasPhoto: boolean] }>();

const hasPhoto = ref(!!props.photoUrl?.trim());
const photoSrc = computed(() => props.photoUrl?.trim() || '');

watch(
	() => props.photoUrl,
	(url) => {
		hasPhoto.value = !!url?.trim();
		emit('photo-state', hasPhoto.value);
	},
);

function onError() {
	hasPhoto.value = false;
	emit('photo-state', false);
}

const shownInitials = computed(() => props.initials || getInitials(props.name));

const placeholderStyle = computed(() => ({
	width: `${props.size}px`,
	height: `${props.size}px`,
	backgroundColor: getAvatarColor(props.colorSeed || props.name),
	color: AVATAR_TEXT_COLOR,
	// Пропорция как у прежней заглушки ui-avatars (font-size = 0.4 от размера)
	fontSize: `${Math.round(props.size * 0.4)}px`,
}));
</script>

<template>
	<!--
		referrerpolicy стоит уже в SSR-разметке, а не навешивается в onMounted:
		самый первый запрос за фото (для hero он же LCP) уходил на чужой хост
		из HTML, то есть с полным Referer — URL страницы. Значение статичное,
		гидрации не мешает.
		fetchpriority: браузер сам поднимает приоритет картинки только после
		раскладки, а LCP-картинку выгоднее начать грузить сразу.
	-->
	<img
		v-if="hasPhoto"
		class="kit-avatar"
		:src="photoSrc"
		:alt="name"
		:width="size"
		:height="size"
		:loading="loading"
		:fetchpriority="loading === 'eager' ? 'high' : undefined"
		referrerpolicy="no-referrer"
		@error="onError"
	/>
	<div
		v-else
		class="kit-avatar kit-avatar--letters"
		:style="placeholderStyle"
		role="img"
		:aria-label="name"
	>
		{{ shownInitials }}
	</div>
</template>

<style scoped>
.kit-avatar {
	border-radius: 10%;
	object-fit: contain;
	/* Белая подложка под фото: чужие картинки бывают с прозрачностью */
	background-color: var(--kit-color-bg-primary);
	flex-shrink: 0;
}

.kit-avatar--letters {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-weight: var(--kit-font-weight-semibold);
	line-height: 1;
	letter-spacing: 0.02em;
	user-select: none;
}
</style>
