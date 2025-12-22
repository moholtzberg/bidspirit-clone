<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  
  let auction = $state(null);
  let lots = $state([]);
  let loading = $state(true);
  let showCreateModal = $state(false);
  
  let newLot = $state({
    lotNumber: 1,
    title: '',
    description: '',
    startingBid: 0,
    bidIncrement: 100,
    imageUrl: '',
    status: 'active',
    endTime: ''
  });
  
  $effect(() => {
    if ($page.params.id) {
      loadData();
    }
  });
  
  async function loadData() {
    try {
      loading = true;
      const [auctionRes, lotsRes] = await Promise.all([
        fetch(`/api/auctions/${$page.params.id}`),
        fetch(`/api/lots?auctionId=${$page.params.id}`)
      ]);
      
      auction = await auctionRes.json();
      lots = await lotsRes.json();
      
      // Set default lot number
      if (lots.length > 0) {
        newLot.lotNumber = lots.length + 1;
      }
      
      // Set default end time to auction end time
      if (auction && !newLot.endTime) {
        const endDate = new Date(auction.endDate);
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        const hours = String(endDate.getHours()).padStart(2, '0');
        const minutes = String(endDate.getMinutes()).padStart(2, '0');
        newLot.endTime = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      loading = false;
    }
  }
  
  async function createLot() {
    try {
      const response = await fetch('/api/lots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newLot,
          auctionId: auction.id,
          currentBid: newLot.startingBid,
          highestBidderId: null,
          highestBidderName: null
        })
      });
      
      if (response.ok) {
        showCreateModal = false;
        const endDate = new Date(auction.endDate);
        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        const hours = String(endDate.getHours()).padStart(2, '0');
        const minutes = String(endDate.getMinutes()).padStart(2, '0');
        const defaultEndTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        newLot = {
          lotNumber: lots.length + 2,
          title: '',
          description: '',
          startingBid: 0,
          bidIncrement: 100,
          imageUrl: '',
          status: 'active',
          endTime: defaultEndTime
        };
        await loadData();
        
        // Update auction total lots count
        await fetch(`/api/auctions/${auction.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            totalLots: lots.length + 1
          })
        });
      }
    } catch (error) {
      console.error('Error creating lot:', error);
    }
  }
  
  function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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
</script>

{#if loading}
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
{:else if auction}
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <button
        onclick={() => goto('/seller')}
        class="text-blue-600 hover:text-blue-800 mb-6 flex items-center"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Auctions
      </button>

      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-4xl font-bold text-gray-900 mb-2">Manage Lots</h1>
          <p class="text-gray-600 text-lg">{auction.title}</p>
        </div>
        <div class="flex gap-3">
          <button
            onclick={() => goto(`/seller/auctions/${auction.id}/lots/tools`)}
            class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-semibold"
          >
            Banner Tools
          </button>
          <button
            onclick={() => showCreateModal = true}
            class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Add New Lot
          </button>
        </div>
      </div>

      {#if lots.length === 0}
        <div class="bg-white rounded-lg shadow-lg p-12 text-center">
          <p class="text-gray-600 text-lg mb-4">No lots added yet.</p>
          <button
            onclick={() => showCreateModal = true}
            class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Add Your First Lot
          </button>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each lots as lot}
            <div class="bg-white rounded-lg shadow-md overflow-hidden">
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
                <div class="space-y-2 mb-4 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500">Starting Bid:</span>
                    <span class="font-semibold">{formatCurrency(lot.startingBid)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Current Bid:</span>
                    <span class="font-semibold text-blue-600">{formatCurrency(lot.currentBid)}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Bid Increment:</span>
                    <span class="font-semibold">{formatCurrency(lot.bidIncrement)}</span>
                  </div>
                </div>
                <button
                  onclick={() => goto(`/lots/${lot.id}`)}
                  class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  View Lot
                </button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<!-- Create Lot Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Add New Lot</h2>
          <button
            onclick={() => showCreateModal = false}
            class="text-gray-500 hover:text-gray-700"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onsubmit={(e) => { e.preventDefault(); createLot(); }}>
          <div class="space-y-4">
            <div>
              <label for="lotNumber" class="block text-sm font-medium text-gray-700 mb-2">
                Lot Number *
              </label>
              <input
                id="lotNumber"
                type="number"
                bind:value={newLot.lotNumber}
                required
                min="1"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
                Lot Title *
              </label>
              <input
                id="title"
                type="text"
                bind:value={newLot.title}
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Original Oil Painting - Landscape"
              />
            </div>

            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                bind:value={newLot.description}
                required
                rows="4"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the lot..."
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="startingBid" class="block text-sm font-medium text-gray-700 mb-2">
                  Starting Bid ($) *
                </label>
                <input
                  id="startingBid"
                  type="number"
                  bind:value={newLot.startingBid}
                  required
                  min="0"
                  step="0.01"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label for="bidIncrement" class="block text-sm font-medium text-gray-700 mb-2">
                  Bid Increment ($) *
                </label>
                <input
                  id="bidIncrement"
                  type="number"
                  bind:value={newLot.bidIncrement}
                  required
                  min="1"
                  step="0.01"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label for="imageUrl" class="block text-sm font-medium text-gray-700 mb-2">
                Image URL *
              </label>
              <input
                id="imageUrl"
                type="url"
                bind:value={newLot.imageUrl}
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label for="endTime" class="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <input
                id="endTime"
                type="datetime-local"
                bind:value={newLot.endTime}
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div class="flex gap-4 mt-6">
            <button
              type="button"
              onclick={() => showCreateModal = false}
              class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Add Lot
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

