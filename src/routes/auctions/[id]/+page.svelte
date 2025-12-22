<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  let auction = $state(null);
  let lots = $state([]);
  let loading = $state(true);
  
  $effect(() => {
    if ($page.params.id) {
      loadAuction();
    }
  });
  
  async function loadAuction() {
    try {
      loading = true;
      const [auctionRes, lotsRes] = await Promise.all([
        fetch(`/api/auctions/${$page.params.id}`),
        fetch(`/api/lots?auctionId=${$page.params.id}`)
      ]);
      
      auction = await auctionRes.json();
      lots = await lotsRes.json();
    } catch (error) {
      console.error('Error loading auction:', error);
    } finally {
      loading = false;
    }
  }
  
  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
</script>

{#if loading}
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="mt-4 text-gray-600">Loading auction...</p>
    </div>
  </div>
{:else if auction}
  <div class="min-h-screen bg-gray-50">
    <!-- Auction Header -->
    <div class="bg-white shadow-sm">
      <div class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <img
              src={auction.imageUrl}
              alt={auction.title}
              class="w-full h-96 object-cover rounded-lg shadow-lg"
            />
          </div>
          <div>
            <div class="mb-4">
              <span class="px-3 py-1 rounded-full text-sm font-semibold {auction.status === 'live' ? 'bg-red-100 text-red-800' : auction.status === 'upcoming' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
                {auction.status.toUpperCase()}
              </span>
            </div>
            <h1 class="text-4xl font-bold text-gray-900 mb-4">{auction.title}</h1>
            <p class="text-gray-600 text-lg mb-6">{auction.description}</p>
            <div class="space-y-3 mb-6">
              <div class="flex items-center text-gray-700">
                <span class="font-semibold mr-2">Seller:</span>
                <span>{auction.sellerName}</span>
              </div>
              <div class="flex items-center text-gray-700">
                <span class="font-semibold mr-2">Start Date:</span>
                <span>{formatDate(auction.startDate)}</span>
              </div>
              <div class="flex items-center text-gray-700">
                <span class="font-semibold mr-2">End Date:</span>
                <span>{formatDate(auction.endDate)}</span>
              </div>
              <div class="flex items-center text-gray-700">
                <span class="font-semibold mr-2">Total Lots:</span>
                <span>{auction.totalLots}</span>
              </div>
              {#if auction.status === 'live'}
                <div class="flex items-center text-red-600">
                  <span class="font-semibold mr-2">Active Bids:</span>
                  <span>{auction.currentBids}</span>
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lots Section -->
    <div class="container mx-auto px-4 py-8">
      <h2 class="text-3xl font-bold text-gray-900 mb-6">Lots ({lots.length})</h2>
      
      {#if lots.length === 0}
        <div class="bg-white rounded-lg shadow p-8 text-center">
          <p class="text-gray-600">No lots available for this auction yet.</p>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each lots as lot}
            <div
              onclick={() => goto(`/lots/${lot.id}`)}
              class="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
            >
              <div class="relative">
                <img
                  src={lot.imageUrl}
                  alt={lot.title}
                  class="w-full h-48 object-cover"
                />
                <div class="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-sm font-bold">
                  Lot #{lot.lotNumber}
                </div>
              </div>
              <div class="p-6">
                <h3 class="text-lg font-bold text-gray-900 mb-2">{lot.title}</h3>
                <p class="text-gray-600 text-sm mb-4 line-clamp-2">{lot.description}</p>
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <p class="text-xs text-gray-500">Current Bid</p>
                    <p class="text-xl font-bold text-blue-600">{formatCurrency(lot.currentBid)}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-xs text-gray-500">Starting Bid</p>
                    <p class="text-lg font-semibold">{formatCurrency(lot.startingBid)}</p>
                  </div>
                </div>
                {#if lot.highestBidderName}
                  <p class="text-sm text-gray-600 mb-2">Highest bidder: {lot.highestBidderName}</p>
                {/if}
                <button class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                  View & Bid
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <p class="text-gray-600 text-lg">Auction not found</p>
      <button
        onclick={() => goto('/')}
        class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Back to Auctions
      </button>
    </div>
  </div>
{/if}

