<script>
	import '../app.css';
	let { children } = $props();
  import Navigation from '$lib/components/Navigation.svelte';
</script>

<Navigation />

{@render children()}
