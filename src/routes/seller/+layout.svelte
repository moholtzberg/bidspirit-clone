<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  let {
    data
  } = $props();
  
  let session = $state(data?.session);
  
  // Client-side check as backup (in case session expires while on page)
  $effect(() => {
    if (!session?.user) {
      goto('/auth/login?redirect=' + encodeURIComponent($page.url.pathname));
    }
  });
  
  // Periodically check session validity (every 30 seconds)
  onMount(() => {
    const checkInterval = setInterval(async () => {
      try {
        const res = await fetch('/auth/session', { credentials: 'include' });
        if (!res.ok) {
          clearInterval(checkInterval);
          goto('/auth/login?redirect=' + encodeURIComponent($page.url.pathname));
          return;
        }
        
        const sessionData = await res.json();
        
        if (!sessionData?.user) {
          clearInterval(checkInterval);
          goto('/auth/login?redirect=' + encodeURIComponent($page.url.pathname));
        } else {
          session = sessionData;
        }
      } catch (error) {
        console.error('Error checking session:', error);
        clearInterval(checkInterval);
        goto('/auth/login?redirect=' + encodeURIComponent($page.url.pathname));
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(checkInterval);
  });
</script>

<slot {session} />

