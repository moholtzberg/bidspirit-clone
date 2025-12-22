<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  let currentUser = $state({ id: 'seller1', name: 'Heritage Judaica Auctions', role: 'seller' }); // Mock seller
  let myAuctions = $state([]);
  let loading = $state(true);
  let showCreateModal = $state(false);
  
  let newAuction = $state({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    imageUrl: '',
    status: 'upcoming'
  });
  
  onMount(async () => {
    await loadAuctions();
  });
  
  async function loadAuctions() {
    try {
      loading = true;
      const response = await fetch(`/api/auctions?sellerId=${currentUser.id}`);
      myAuctions = await response.json();
    } catch (error) {
      console.error('Error loading auctions:', error);
    } finally {
      loading = false;
    }
  }
  
  async function createAuction() {
    try {
      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newAuction,
          sellerId: currentUser.id,
          sellerName: currentUser.name,
          totalLots: 0,
          currentBids: 0
        })
      });
      
      if (response.ok) {
        showCreateModal = false;
        newAuction = {
          title: '',
          description: '',
          startDate: '',
          endDate: '',
          imageUrl: '',
          status: 'upcoming'
        };
        await loadAuctions();
      }
    } catch (error) {
      console.error('Error creating auction:', error);
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
  
  function getStatusBadgeClass(status) {
    switch (status) {
      case 'live':
        return 'bg-red-100 text-red-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <div class="container mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-4xl font-bold text-gray-900">Judaica Auction Management</h1>
        <p class="text-gray-600 mt-2">Create and manage your Judaica auctions - menorahs, Torah scrolls, ceremonial objects, and more</p>
      </div>
      <button
        onclick={() => showCreateModal = true}
        class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
      >
        Create New Auction
      </button>
    </div>

    {#if loading}
      <div class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Loading auctions...</p>
      </div>
    {:else if myAuctions.length === 0}
      <div class="bg-white rounded-lg shadow-lg p-12 text-center">
        <p class="text-gray-600 text-lg mb-4">You haven't created any auctions yet.</p>
        <button
          onclick={() => showCreateModal = true}
          class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Create Your First Auction
        </button>
      </div>
    {:else}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {#each myAuctions as auction}
          <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
            <div class="relative">
              <img
                src={auction.imageUrl}
                alt={auction.title}
                class="w-full h-48 object-cover"
              />
              <span class="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold {getStatusBadgeClass(auction.status)}">
                {auction.status.toUpperCase()}
              </span>
            </div>
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-900 mb-2">{auction.title}</h3>
              <p class="text-gray-600 text-sm mb-4 line-clamp-2">{auction.description}</p>
              <div class="space-y-2 mb-4 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Lots:</span>
                  <span class="font-semibold">{auction.totalLots}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Bids:</span>
                  <span class="font-semibold">{auction.currentBids}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Starts:</span>
                  <span class="font-semibold">{formatDate(auction.startDate)}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Ends:</span>
                  <span class="font-semibold">{formatDate(auction.endDate)}</span>
                </div>
              </div>
              <div class="flex gap-2">
                <button
                  onclick={() => goto(`/auctions/${auction.id}`)}
                  class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  View
                </button>
                <button
                  onclick={() => goto(`/seller/auctions/${auction.id}/lots`)}
                  class="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Manage Lots
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Create Auction Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-900">Create New Auction</h2>
          <button
            onclick={() => showCreateModal = false}
            class="text-gray-500 hover:text-gray-700"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onsubmit={(e) => { e.preventDefault(); createAuction(); }}>
          <div class="space-y-4">
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
                Auction Title *
              </label>
              <input
                id="title"
                type="text"
                bind:value={newAuction.title}
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Fine Art & Collectibles Auction"
              />
            </div>

            <div>
              <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                bind:value={newAuction.description}
                required
                rows="4"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your auction..."
              ></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="startDate" class="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  id="startDate"
                  type="datetime-local"
                  bind:value={newAuction.startDate}
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label for="endDate" class="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  id="endDate"
                  type="datetime-local"
                  bind:value={newAuction.endDate}
                  required
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
                bind:value={newAuction.imageUrl}
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div>
              <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
                Status *
              </label>
              <select
                id="status"
                bind:value={newAuction.status}
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="ended">Ended</option>
              </select>
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
              Create Auction
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

