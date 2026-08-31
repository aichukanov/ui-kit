import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Nuxt-модуль пакета дизайн-системы.
 *
 * Намеренно НЕ импортирует `@nuxt/kit` и вообще ничего из хост-приложения:
 * пакет подключается симлинком (`file:`), а Node разрешает зависимости от
 * реального пути — до node_modules приложения он не дойдёт. Поэтому модуль
 * написан как обычная функция `(options, nuxt)` и правит `nuxt.options`
 * напрямую, через публичные хуки.
 */

/** Минимальный контракт вместо типов @nuxt/kit — их здесь неоткуда взять. */
interface ComponentsDir {
	path: string;
	pathPrefix?: boolean;
	prefix?: string;
	global?: boolean;
}

interface NuxtLike {
	options: {
		rootDir: string;
		css: string[];
		build: { transpile: (string | RegExp)[] };
		vite: Record<string, any>;
		alias: Record<string, string>;
		typescript: Record<string, any>;
	};
	hook(name: 'components:dirs', fn: (dirs: ComponentsDir[]) => void): void;
	hook(name: 'imports:dirs', fn: (dirs: string[]) => void): void;
}

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(PKG_ROOT, 'src');

export default function uiKit(_options: unknown, nuxt: NuxtLike) {
	// Токены — первыми в цепочке CSS: приложение должно иметь возможность
	// переопределить переменную своим файлом, а не наоборот.
	nuxt.options.css.unshift(resolve(SRC, 'styles/tokens.css'));

	// Компоненты доступны как <AppButton>, а не <UiAppButton>: имена в пакете
	// уже несут префикс App, второй от папки не нужен.
	//
	// Иконки намеренно НЕ регистрируются автоимпортом: в приложении есть свой
	// набор `components/icon/` с теми же именами (IconClose и т.п.), коллизия
	// разрешалась бы молча и непредсказуемо. Иконки пакета импортируются явно.
	nuxt.hook('components:dirs', (dirs) => {
		dirs.push({
			path: resolve(SRC, 'components'),
			pathPrefix: false,
			prefix: '',
		});
	});

	// useToast() и прочее — без ручных импортов, как родные композаблы Nuxt.
	nuxt.hook('imports:dirs', (dirs) => {
		dirs.push(resolve(SRC, 'composables'));
	});

	// Пакет отдаётся исходниками (.vue/.ts), а не сборкой: без transpile
	// Vite оставит их внешними и SSR упадёт на нескомпилированном SFC.
	nuxt.options.build.transpile.push(PKG_ROOT, '@ach/ui-kit');

	// Файлы лежат вне корня проекта — dev-серверу Vite нужно явное разрешение
	// на чтение, иначе в браузере будет 403 на каждый компонент.
	nuxt.options.vite.server ??= {};
	nuxt.options.vite.server.fs ??= {};
	nuxt.options.vite.server.fs.allow ??= [];
	nuxt.options.vite.server.fs.allow.push(PKG_ROOT);

	// Один экземпляр Vue на приложение и пакет: два ломают provide/inject
	// и реактивность (симлинк — классический источник дублей).
	nuxt.options.vite.resolve ??= {};
	nuxt.options.vite.resolve.dedupe ??= [];
	nuxt.options.vite.resolve.dedupe.push('vue');

	/*
	 * Указываем TypeScript, где брать `vue` для файлов пакета.
	 *
	 * Без этого `nuxt typecheck` падает с «Cannot find module 'vue'»: пакет
	 * подключён симлинком, TS разрешает его в реальный путь вне проекта и ищет
	 * зависимости в node_modules РЯДОМ с пакетом, а не в node_modules
	 * приложения. Свой vue в пакете это тоже лечило бы, но ценой второго
	 * экземпляра Vue на диске и риска расхождения версий.
	 *
	 * Ключи paths не конфликтуют с нуxt-овскими (`~/*`, `#app` и т.п.),
	 * поэтому слияние здесь аддитивное.
	 */
	nuxt.options.typescript ??= {};
	nuxt.options.typescript.tsConfig ??= {};
	nuxt.options.typescript.tsConfig.compilerOptions ??= {};
	const paths = (nuxt.options.typescript.tsConfig.compilerOptions.paths ??= {});
	for (const dep of ['vue', '@vue/runtime-core', '@vue/shared']) {
		paths[dep] ??= [resolve(nuxt.options.rootDir, 'node_modules', dep)];
	}
}

uiKit.meta = {
	name: '@ach/ui-kit',
	configKey: 'uiKit',
};
