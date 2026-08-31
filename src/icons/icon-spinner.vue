<template>
	<!-- Крутится через CSS, а не SMIL: prefers-reduced-motion должен работать -->
	<svg
		class="icon-spinner"
		xmlns="http://www.w3.org/2000/svg"
		width="1em"
		height="1em"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2.5"
		stroke-linecap="round"
		aria-hidden="true"
	>
		<path d="M21 12a9 9 0 1 1-6.22-8.56" />
	</svg>
</template>

<style scoped>
.icon-spinner {
	animation: icon-spinner-rotate 0.8s linear infinite;
}

@keyframes icon-spinner-rotate {
	to {
		transform: rotate(360deg);
	}
}

@media (prefers-reduced-motion: reduce) {
	.icon-spinner {
		animation-duration: 2.4s;
	}
}
</style>
