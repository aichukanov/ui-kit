<script setup lang="ts">
import { computed } from 'vue';
import KitIconChevronLeft from '../icons/icon-chevron-left.vue';
import KitIconChevronRight from '../icons/icon-chevron-right.vue';

/**
 * Пагинация дизайн-системы.
 *
 * Главное отличие от `el-pagination`, ради которого компонент и появился:
 * когда страница отражена в URL, номера рендерятся настоящими `<a href>` —
 * и попадают в серверную разметку. Element Plus отдавал `<li class="number">`
 * без ссылки, поэтому `?page=2` и дальше существовали, но краулер до них
 * не доходил, а вес с первой страницы вглубь листинга не передавался.
 *
 * Адрес компонент НЕ собирает: его отдаёт потребитель функцией `href`.
 * Своя склейка неизбежно разошлась бы с `rel=canonical` целевой страницы
 * по порядку параметров, а это ровно те дубли, против которых канонический
 * порядок и заводился.
 *
 * Без `href` (страница живёт не в URL, а в состоянии — например, попап на
 * карте) рендерятся кнопки: ссылка на адрес, которого нет, была бы враньём.
 *
 * `rel="prev|next"` на стрелках — семантика самой разметки, а не сигнал для
 * Google: его `rel=next/prev` не использует с 2019 года, ради него всё это
 * и переделывалось.
 */
const props = withDefaults(
	defineProps<{
		/** Всего элементов, а не страниц — страницы считает компонент. */
		total: number;
		currentPage: number;
		pageSize?: number;
		/** Сколько номеров показывать вместе с первым и последним. */
		pagerCount?: number;
		disabled?: boolean;
		/**
		 * Построитель адреса страницы. Есть — номера становятся ссылками.
		 * Для первой страницы обязан вернуть адрес БЕЗ параметра `page`.
		 */
		href?: (page: number) => string;
		/** aria-label стрелок и номеров: своих строк у пакета нет. */
		prevLabel?: string;
		nextLabel?: string;
		pageLabel?: (page: number) => string;
	}>(),
	{
		pageSize: 10,
		pagerCount: 5,
		disabled: false,
		href: undefined,
		prevLabel: undefined,
		nextLabel: undefined,
		pageLabel: undefined,
	},
);

const emit = defineEmits<{ 'update:current-page': [page: number] }>();

const pageCount = computed(() =>
	Math.max(1, Math.ceil(props.total / props.pageSize)),
);

const current = computed(() =>
	Math.min(Math.max(1, props.currentPage), pageCount.value),
);

/**
 * Окно номеров повторяет раскладку Element Plus: первая и последняя страницы
 * видны всегда, между ними — до `pagerCount` номеров, разрывы обозначены
 * многоточием. Сохранено намеренно: миграция не должна двигать вёрстку.
 *
 * Многоточие здесь неинтерактивно — в Element Plus оно прыгало на ±5 страниц,
 * но это скрытая механика (точки превращались в стрелки только при наведении),
 * и её потеря не стоит двух лишних состояний.
 */
const middlePages = computed(() => {
	const count = pageCount.value;
	const pager = props.pagerCount;
	const half = Math.floor((pager - 1) / 2);
	const hasPrevMore = count > pager && current.value > pager - half;
	const hasNextMore = count > pager && current.value < count - half;

	let from: number;
	let to: number;
	if (hasPrevMore && !hasNextMore) {
		from = count - (pager - 2);
		to = count - 1;
	} else if (!hasPrevMore && hasNextMore) {
		from = 2;
		to = pager - 1;
	} else if (hasPrevMore && hasNextMore) {
		const offset = Math.floor(pager / 2) - 1;
		from = current.value - offset;
		to = current.value + offset;
	} else {
		from = 2;
		to = count - 1;
	}

	const pages: number[] = [];
	for (let page = Math.max(2, from); page <= Math.min(count - 1, to); page++) {
		pages.push(page);
	}
	return { pages, hasPrevMore, hasNextMore };
});

interface Cell {
	key: string;
	type: 'prev' | 'next' | 'page' | 'more';
	page: number;
	disabled: boolean;
	isCurrent: boolean;
	/** Прячется на узком экране — см. комментарий у `cells`. */
	collapsible: boolean;
}

/*
 * Узкий экран: соседей текущей страницы прячем, остаются `‹ 1 … 4 … 67 ›`.
 *
 * Перенос на вторую строку — не вариант: он запрещён во всех системах, где
 * это вообще проговорено (USWDS держит `row nowrap` и пишет «avoid using
 * Pagination in any context where it would be more than one line long»).
 * Срезание слотов по мере сужения — ровно то, что делают eBay (минимум пять
 * слотов) и слотовая модель USWDS.
 *
 * Прятать можно НЕ любого соседа, а только того, на чьей стороне уже есть
 * многоточие: иначе `1 [3] 5` соврёт, что страниц 2 и 4 не существует.
 * Когда страниц мало и многоточий нет, прятать нечего — полный набор и так
 * помещается в строку.
 *
 * Скрытие CSS-ом, а не пересчётом набора: `pagerCount` по ширине окна
 * разъехался бы с серверной разметкой при гидратации. Ссылки при этом
 * остаются в DOM, то есть путь обхода вглубь листинга не страдает.
 */
const cells = computed<Cell[]>(() => {
	const count = pageCount.value;
	const { pages, hasPrevMore, hasNextMore } = middlePages.value;

	const pageCell = (page: number): Cell => ({
		key: `p${page}`,
		type: 'page',
		page,
		disabled: props.disabled,
		isCurrent: page === current.value,
		collapsible:
			page !== 1 &&
			page !== count &&
			page !== current.value &&
			(page < current.value ? hasPrevMore : hasNextMore),
	});
	const moreCell = (key: string): Cell => ({
		key,
		type: 'more',
		page: 0,
		disabled: true,
		isCurrent: false,
		collapsible: false,
	});

	const list: Cell[] = [
		{
			key: 'prev',
			type: 'prev',
			page: current.value - 1,
			disabled: props.disabled || current.value <= 1,
			isCurrent: false,
			collapsible: false,
		},
		pageCell(1),
	];

	if (hasPrevMore) {
		list.push(moreCell('more-prev'));
	}
	pages.forEach((page) => list.push(pageCell(page)));
	if (hasNextMore) {
		list.push(moreCell('more-next'));
	}
	if (count > 1) {
		list.push(pageCell(count));
	}

	list.push({
		key: 'next',
		type: 'next',
		page: current.value + 1,
		disabled: props.disabled || current.value >= count,
		isCurrent: false,
		collapsible: false,
	});

	return list;
});

const cellLabel = (cell: Cell) => {
	if (cell.type === 'prev') return props.prevLabel;
	if (cell.type === 'next') return props.nextLabel;
	return props.pageLabel?.(cell.page);
};

const go = (page: number) => {
	if (page === current.value) return;
	emit('update:current-page', page);
};

/**
 * Ссылка нужна краулеру и «открыть в новой вкладке», но человеку внутри
 * приложения перезагрузка ни к чему. Поэтому обычный левый клик гасится и
 * уходит событием, а клик с модификатором или не левой кнопкой отдаётся
 * браузеру нетронутым.
 */
const onLinkClick = (event: MouseEvent, page: number) => {
	if (
		event.defaultPrevented ||
		event.button !== 0 ||
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey ||
		event.altKey
	) {
		return;
	}
	event.preventDefault();
	go(page);
};
</script>

<template>
	<ul class="kit-pagination">
		<li
			v-for="cell in cells"
			:key="cell.key"
			class="kit-pagination__cell"
			:class="{ 'kit-pagination__cell--collapsible': cell.collapsible }"
		>
			<span
				v-if="cell.type === 'more'"
				class="kit-pagination__more"
				aria-hidden="true"
				>…</span
			>
			<a
				v-else-if="href && !cell.disabled"
				class="kit-pagination__item"
				:class="[
					`kit-pagination__item--${cell.type}`,
					{ 'is-current': cell.isCurrent },
				]"
				:href="href(cell.page)"
				:rel="cell.type === 'page' ? undefined : cell.type"
				:aria-label="cellLabel(cell)"
				:aria-current="cell.isCurrent ? 'page' : undefined"
				@click="onLinkClick($event, cell.page)"
			>
				<KitIconChevronLeft v-if="cell.type === 'prev'" />
				<KitIconChevronRight v-else-if="cell.type === 'next'" />
				<template v-else>{{ cell.page }}</template>
			</a>
			<button
				v-else
				type="button"
				class="kit-pagination__item"
				:class="[
					`kit-pagination__item--${cell.type}`,
					{ 'is-current': cell.isCurrent },
				]"
				:disabled="cell.disabled"
				:aria-label="cellLabel(cell)"
				:aria-current="cell.isCurrent ? 'page' : undefined"
				@click="go(cell.page)"
			>
				<KitIconChevronLeft v-if="cell.type === 'prev'" />
				<KitIconChevronRight v-else-if="cell.type === 'next'" />
				<template v-else>{{ cell.page }}</template>
			</button>
		</li>
	</ul>
</template>

<style scoped>
.kit-pagination {
	display: flex;
	align-items: center;
	/* Пейджер живёт в одну строку всегда: вторая строка — это уже не пейджер,
	   а сыпь из кнопок. Не влезающее срезается медиазапросом ниже. */
	flex-wrap: nowrap;
	justify-content: center;
	gap: var(--kit-spacing-xs);
	margin: 0;
	padding: 0;
	list-style: none;
}

.kit-pagination__cell {
	display: flex;
}

.kit-pagination__item {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	/* Метрика пейджера Element Plus: миграция не должна двигать вёрстку */
	min-width: 32px;
	height: 32px;
	padding: 0 var(--kit-spacing-xs);
	border: var(--kit-border-width-thin) solid transparent;
	border-radius: var(--kit-border-radius-sm);
	background-color: var(--kit-color-bg-secondary);
	color: var(--kit-color-text-secondary);
	font-family: inherit;
	font-size: var(--kit-font-size-sm);
	font-weight: var(--kit-font-weight-medium);
	line-height: 1;
	text-decoration: none;
	cursor: pointer;
	transition:
		background-color var(--kit-transition-base),
		color var(--kit-transition-base);
}

.kit-pagination__item:hover:not(:disabled):not(.is-current) {
	background-color: var(--kit-color-primary-bg);
	color: var(--kit-color-primary);
}

.kit-pagination__item:focus-visible {
	outline: 2px solid var(--kit-color-primary);
	outline-offset: 2px;
}

.kit-pagination__item.is-current {
	background-color: var(--kit-color-primary-solid);
	color: var(--kit-color-text-on-solid);
	cursor: default;
}

.kit-pagination__item:disabled {
	color: var(--kit-color-text-light);
	cursor: not-allowed;
}

.kit-pagination__more {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 32px;
	height: 32px;
	/* Многоточие видно глазом, поэтому цвет читаемый, а не как у disabled */
	color: var(--kit-color-text-secondary);
	font-size: var(--kit-font-size-sm);
	line-height: 1;
}

/*
 * На тач-экранах цель 32px мимо пальца — там она растёт до 44px (NFR-6
 * миграции). Условие по указателю, а не по ширине окна: на планшете с
 * широким экраном палец такой же.
 */
@media (hover: none) and (pointer: coarse) {
	.kit-pagination__item {
		min-width: 44px;
		height: 44px;
	}

	.kit-pagination__more {
		height: 44px;
	}
}

/*
 * Узкий экран — условие по ШИРИНЕ, в отличие от тач-целей выше: там речь про
 * палец, здесь про то, что девять слотов по 44px (428px) не помещаются.
 * Порог тот же, на котором обёртка приложения переносит пейджер в центр.
 *
 * Многоточие при этом ужимается: оно не кликабельно, тач-цель ему не нужна.
 */
@media (max-width: 600px) {
	.kit-pagination__cell--collapsible {
		display: none;
	}

	.kit-pagination__more {
		min-width: 24px;
	}
}
</style>
