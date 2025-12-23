<script>
    import { page } from '$app/stores';
    import { signOut } from '@auth/sveltekit/client';
    import { goto } from '$app/navigation';
    
    let isMenuOpen = $state(false);
    let session = $state(null);
    
    $effect(async () => {
      try {
        const res = await fetch('/auth/session');
        const data = await res.json();
        session = data;
      } catch (error) {
        console.error('Error loading session:', error);
      }
    });
    
    async function handleLogout() {
      await signOut({ redirect: false });
      goto('/');
    }
</script>

<!-- Navigation Bar -->
<nav class="bg-white shadow sticky top-0 z-50">
    <div class="container mx-auto px-4 py-4 flex items-center justify-between">
      
        <a href="/" class="flex items-center space-x-2">
            <span class="text-2xl font-bold text-blue-600">BidSpirit</span>
            <span class="text-sm text-gray-600 font-medium">Judaica Auctions</span>
        </a>
  
      <!-- Desktop Menu -->
      <ul class="hidden md:flex space-x-6 items-center">
        <li>
          <a 
            href="/" 
            class="text-gray-700 hover:text-blue-600 transition-colors {($page.url.pathname === '/') ? 'text-blue-600 font-semibold' : ''}"
          >
            Auctions
          </a>
        </li>
        <li>
          <a 
            href="/dashboard" 
            class="text-gray-700 hover:text-blue-600 transition-colors {($page.url.pathname === '/dashboard') ? 'text-blue-600 font-semibold' : ''}"
          >
            Dashboard
          </a>
        </li>
        <li>
          <a 
            href="/seller" 
            class="text-gray-700 hover:text-blue-600 transition-colors {($page.url.pathname.startsWith('/seller')) ? 'text-blue-600 font-semibold' : ''}"
          >
            Seller Portal
          </a>
        </li>
        <li>
          <a 
            href="/auction-houses/signup" 
            class="text-gray-700 hover:text-blue-600 transition-colors {($page.url.pathname === '/auction-houses/signup') ? 'text-blue-600 font-semibold' : ''}"
          >
            Register Auction House
          </a>
        </li>
        {#if session?.user}
          <li>
            <a 
              href="/dashboard" 
              class="text-gray-700 hover:text-blue-600 transition-colors {($page.url.pathname === '/dashboard') ? 'text-blue-600 font-semibold' : ''}"
            >
              {session.user.name || session.user.email}
            </a>
          </li>
          <li>
            <button
              onclick={handleLogout}
              class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </li>
        {:else}
          <li>
            <a 
              href="/auth/login" 
              class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Login
            </a>
          </li>
        {/if}
      </ul>
  
      <!-- Mobile Menu Button -->
      <button
        class="md:hidden text-gray-700 focus:outline-none"
        onclick={() => isMenuOpen = !isMenuOpen}
        aria-label="Toggle navigation menu"
        aria-expanded={isMenuOpen}
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {#if isMenuOpen}
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          {:else}
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16" />
          {/if}
        </svg>
      </button>
    </div>
  
    <!-- Mobile Menu -->
    {#if isMenuOpen}
      <div class="md:hidden bg-white shadow">
        <ul class="flex flex-col items-center space-y-4 py-4">
          <li>
            <a 
              href="/" 
              class="text-gray-700 hover:text-blue-600 transition-colors {($page.url.pathname === '/') ? 'text-blue-600 font-semibold' : ''}"
            >
              Auctions
            </a>
          </li>
          <li>
            <a 
              href="/dashboard" 
              class="text-gray-700 hover:text-blue-600 transition-colors {($page.url.pathname === '/dashboard') ? 'text-blue-600 font-semibold' : ''}"
            >
              Dashboard
            </a>
          </li>
          <li>
            <a 
              href="/seller" 
              class="text-gray-700 hover:text-blue-600 transition-colors {($page.url.pathname.startsWith('/seller')) ? 'text-blue-600 font-semibold' : ''}"
            >
              Seller Portal
            </a>
          </li>
          <li>
            <a 
              href="/auction-houses/signup" 
              class="text-gray-700 hover:text-blue-600 transition-colors {($page.url.pathname === '/auction-houses/signup') ? 'text-blue-600 font-semibold' : ''}"
            >
              Register Auction House
            </a>
          </li>
          {#if session?.user}
            <li>
              <a 
                href="/dashboard" 
                class="text-gray-700 hover:text-blue-600 transition-colors {($page.url.pathname === '/dashboard') ? 'text-blue-600 font-semibold' : ''}"
              >
                {session.user.name || session.user.email}
              </a>
            </li>
            <li>
              <button
                onclick={handleLogout}
                class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </li>
          {:else}
            <li>
              <a 
                href="/auth/login" 
                class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Login
              </a>
            </li>
          {/if}
        </ul>
      </div>
    {/if}
</nav>
