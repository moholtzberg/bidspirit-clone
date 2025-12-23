<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  let session = $state(null);
  let currentUser = $state(null);
  let myBids = $state([]);
  let myWinningBids = $state([]);
  let loading = $state(true);
  
  onMount(async () => {
    await loadSession();
    if (session?.user) {
      await loadUserData();
    } else {
      // Redirect to login if not authenticated
      goto('/auth/login');
    }
  });
  
  async function loadSession() {
    try {
      const res = await fetch('/auth/session');
      const data = await res.json();
      session = data;
    } catch (error) {
      console.error('Error loading session:', error);
    }
  }
  
  async function loadUserData() {
    try {
      loading = true;
      
      // Get or create user in our database
      let userResponse = await fetch(`/api/users?email=${encodeURIComponent(session.user.email)}`);
      if (!userResponse.ok) {
        // User doesn't exist in our DB yet - create them
        userResponse = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: session.user.email,
            name: session.user.name || `${session.user.first_name || ''} ${session.user.last_name || ''}`.trim(),
            firstName: session.user.first_name || null,
            lastName: session.user.last_name || null,
            role: 'BUYER'
          })
        });
      }
      currentUser = await userResponse.json();
      
      // Load user's bids
      const bidsResponse = await fetch(`/api/bids?userId=${currentUser.id}`);
      const allBids = await bidsResponse.json();
      
      // Get unique lots for these bids
      const lotIds = [...new Set(allBids.map(bid => bid.lotId))];
      const lotPromises = lotIds.map(id => fetch(`/api/lots/${id}`).then(r => r.json()));
      const lots = await Promise.all(lotPromises);
      
      // Match bids with lots
      myBids = allBids.map(bid => {
        const lot = lots.find(l => l.id === bid.lotId);
        return { ...bid, lot };
      }).filter(bid => bid.lot); // Filter out bids with missing lots
      
      // Find winning bids (where user is highest bidder)
      myWinningBids = myBids.filter(bid => 
        bid.lot && bid.lot.highestBidderId === currentUser.id
      );
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      loading = false;
    }
  }
  
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
  
  function formatDate(dateString) {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold text-gray-900 mb-8">My Dashboard</h1>

    {#if loading}
      <div class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Loading...</p>
      </div>
    {:else}
      <!-- User Info -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Profile</h2>
        <div class="space-y-2">
          <p><span class="font-semibold">Name:</span> {currentUser.name}</p>
          <p><span class="font-semibold">Email:</span> {currentUser.email}</p>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-lg font-semibold text-gray-600 mb-2">Total Bids</h3>
          <p class="text-3xl font-bold text-blue-600">{myBids.length}</p>
        </div>
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-lg font-semibold text-gray-600 mb-2">Winning Bids</h3>
          <p class="text-3xl font-bold text-green-600">{myWinningBids.length}</p>
        </div>
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h3 class="text-lg font-semibold text-gray-600 mb-2">Total Value</h3>
          <p class="text-3xl font-bold text-purple-600">
            {formatCurrency(myWinningBids.reduce((sum, bid) => sum + bid.amount, 0))}
          </p>
        </div>
      </div>

      <!-- My Bids -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">My Bids</h2>
        {#if myBids.length === 0}
          <p class="text-gray-600">You haven't placed any bids yet.</p>
        {:else}
          <div class="space-y-4">
            {#each myBids as bid}
              <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="font-bold text-lg text-gray-900 mb-2">
                      {bid.lot?.title || 'Unknown Lot'}
                    </h3>
                    <p class="text-sm text-gray-600 mb-2">Lot #{bid.lot?.lotNumber}</p>
                    <p class="text-sm text-gray-500">Bid placed: {formatDate(bid.timestamp)}</p>
                  </div>
                  <div class="text-right ml-4">
                    <p class="text-2xl font-bold text-blue-600 mb-2">{formatCurrency(bid.amount)}</p>
                    {#if bid.lot?.highestBidderId === currentUser.id}
                      <span class="inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                        Winning
                      </span>
                    {:else}
                      <span class="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                        Outbid
                      </span>
                    {/if}
                  </div>
                </div>
                {#if bid.lot}
                  <div class="mt-4 pt-4 border-t">
                    <a
                      href="/lots/{bid.lot.id}"
                      class="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      View Lot →
                    </a>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Winning Bids -->
      {#if myWinningBids.length > 0}
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Winning Bids</h2>
          <div class="space-y-4">
            {#each myWinningBids as bid}
              <div class="border-2 border-green-500 rounded-lg p-4 bg-green-50">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="font-bold text-lg text-gray-900 mb-2">
                      {bid.lot?.title || 'Unknown Lot'}
                    </h3>
                    <p class="text-sm text-gray-600 mb-2">Lot #{bid.lot?.lotNumber}</p>
                    <p class="text-sm text-gray-500">Bid placed: {formatDate(bid.timestamp)}</p>
                  </div>
                  <div class="text-right ml-4">
                    <p class="text-2xl font-bold text-green-600 mb-2">{formatCurrency(bid.amount)}</p>
                    <span class="inline-block px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-semibold">
                      You're Winning!
                    </span>
                  </div>
                </div>
                {#if bid.lot}
                  <div class="mt-4 pt-4 border-t border-green-300">
                    <a
                      href="/lots/{bid.lot.id}"
                      class="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      View Lot →
                    </a>
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

