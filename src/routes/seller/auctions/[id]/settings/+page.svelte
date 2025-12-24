<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let auction = $state(null);
  let loading = $state(true);
  let saving = $state(false);
  let errorMessage = $state('');
  let successMessage = $state('');
  let expandedSections = $state({});

  let settings = $state({
    defaultAuctionDurationDays: 7,
    defaultPreviewPeriodDays: 1,
    autoStartAuctions: false,
    autoCloseAuctions: false,
    staggeredLotClosing: false,
    lotClosingIntervalSeconds: 30,
    requireRegistrationToBid: false,
    allowAbsenteeBids: true,
    extendBiddingOnLastMinuteBid: false,
    biddingExtensionSeconds: 300,
    minimumBidIncrement: 0,
    allowProxyBidding: true,
    maxProxyBidAmount: null,
    defaultAuctionStatus: 'UPCOMING',
    
    // Catalog Settings
    displayStartPriceInCatalog: true,
    enableAbsenteeBids: true,
    buyersPremium: 0,
    daysToAllowPostAuctionSale: null,
    
    // Live Auction Settings
    baseLiveAuctionStartPriceOnAbsenteeBids: false,
    
    // Automatic Auction Settings
    automaticAuctionInitialTimerSeconds: 30,
    automaticAuctionTimerResetSeconds: 15,
    
    // Currency
    currency: 'USD',
  });

  function toggleSection(section) {
    expandedSections[section] = !expandedSections[section];
  }

  onMount(async () => {
    await loadAuction();
  });

  async function loadAuction() {
    try {
      loading = true;
      errorMessage = '';

      const auctionResponse = await fetch(`/api/auctions/${$page.params.id}`);
      if (!auctionResponse.ok) {
        throw new Error('Auction not found');
      }
      auction = await auctionResponse.json();

      // Load existing settings
      const settingsResponse = await fetch(`/api/auctions/${auction.id}/settings`);
      if (settingsResponse.ok) {
        const existingSettings = await settingsResponse.json();
        // Merge with defaults, preserving existing values
        settings = { ...settings, ...existingSettings };
      }
    } catch (error) {
      console.error('Error loading auction:', error);
      errorMessage = 'Error loading auction data. Please try again.';
    } finally {
      loading = false;
    }
  }

  async function saveSettings() {
    try {
      saving = true;
      errorMessage = '';
      successMessage = '';

      const response = await fetch(`/api/auctions/${auction.id}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save settings');
      }

      successMessage = 'Settings saved successfully!';
      setTimeout(() => {
        successMessage = '';
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      errorMessage = error.message || 'Failed to save settings. Please try again.';
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>Auction Settings - {auction?.title || 'Loading...'}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-6">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
    {#if loading}
      <div class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Loading auction settings...</p>
      </div>
    {:else if errorMessage && !auction}
      <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p class="text-red-800">{errorMessage}</p>
        <a href="/seller" class="text-blue-600 hover:underline mt-2 inline-block">
          Back to Seller Portal
        </a>
      </div>
    {:else if auction}
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-white">Auction Settings</h1>
              <div class="mt-2 text-blue-100 text-sm">
                <span class="font-semibold">{auction.title}</span>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <a
                href="/seller/auctions/{auction.id}/lots"
                class="bg-white/20 text-white px-4 py-2 rounded-lg hover:bg-white/30 transition-colors text-sm font-semibold"
              >
                Manage Lots
              </a>
              <button
                onclick={saveSettings}
                disabled={saving}
                class="bg-white text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>

        {#if errorMessage}
          <div class="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4">
            <p class="text-red-800 text-sm">{errorMessage}</p>
          </div>
        {/if}

        {#if successMessage}
          <div class="bg-green-50 border-l-4 border-green-400 p-4 mx-6 mt-4">
            <p class="text-green-800 text-sm">{successMessage}</p>
          </div>
        {/if}

        <!-- Settings Form -->
        <form onsubmit={(e) => { e.preventDefault(); saveSettings(); }} class="p-6">
          <div class="space-y-4">
            <!-- Default Auction Settings -->
            <div class="border border-gray-200 rounded-lg">
              <button
                type="button"
                onclick={() => toggleSection('defaultAuction')}
                class="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span class="font-medium text-gray-900">Default Auction Settings</span>
                <svg class="w-5 h-5 text-gray-500 transform transition-transform {expandedSections.defaultAuction ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {#if expandedSections.defaultAuction}
                <div class="p-4 space-y-4">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Default Auction Duration (Days)</label>
                      <input type="number" bind:value={settings.defaultAuctionDurationDays} min="1" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      <p class="text-xs text-gray-500 mt-1">Default number of days an auction runs</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Default Preview Period (Days)</label>
                      <input type="number" bind:value={settings.defaultPreviewPeriodDays} min="0" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      <p class="text-xs text-gray-500 mt-1">Preview period before auction starts</p>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Default Auction Status</label>
                      <select bind:value={settings.defaultAuctionStatus} class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="UPCOMING">Upcoming</option>
                        <option value="LIVE">Live</option>
                        <option value="ENDED">Ended</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Minimum Bid Increment</label>
                      <input type="number" bind:value={settings.minimumBidIncrement} step="0.01" min="0" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      <p class="text-xs text-gray-500 mt-1">Minimum increment for bids (0 = use bid increments table)</p>
                    </div>
                  </div>
                </div>
              {/if}
            </div>

            <!-- Automation Settings -->
            <div class="border border-gray-200 rounded-lg">
              <button
                type="button"
                onclick={() => toggleSection('automation')}
                class="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span class="font-medium text-gray-900">Automation Settings</span>
                <svg class="w-5 h-5 text-gray-500 transform transition-transform {expandedSections.automation ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {#if expandedSections.automation}
                <div class="p-4 space-y-3">
                  <label class="flex items-center">
                    <input type="checkbox" bind:checked={settings.autoStartAuctions} class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <div>
                      <span class="text-sm font-medium text-gray-700">Auto-start auctions</span>
                      <p class="text-xs text-gray-500">Automatically start auctions at their scheduled start date</p>
                    </div>
                  </label>
                  <label class="flex items-center">
                    <input type="checkbox" bind:checked={settings.autoCloseAuctions} class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <div>
                      <span class="text-sm font-medium text-gray-700">Auto-close auctions</span>
                      <p class="text-xs text-gray-500">Automatically close auctions at their scheduled end date</p>
                    </div>
                  </label>
                  <label class="flex items-center">
                    <input type="checkbox" bind:checked={settings.staggeredLotClosing} class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <div>
                      <span class="text-sm font-medium text-gray-700">Staggered lot closing</span>
                      <p class="text-xs text-gray-500">Close lots at intervals instead of all at once</p>
                    </div>
                  </label>
                  {#if settings.staggeredLotClosing}
                    <div class="ml-6">
                      <label class="block text-sm font-medium text-gray-700 mb-1">Lot Closing Interval (Seconds)</label>
                      <input type="number" bind:value={settings.lotClosingIntervalSeconds} min="0" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      <p class="text-xs text-gray-500 mt-1">Time between closing each lot</p>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Bidding Settings -->
            <div class="border border-gray-200 rounded-lg">
              <button
                type="button"
                onclick={() => toggleSection('biddingSettings')}
                class="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span class="font-medium text-gray-900">Bidding Settings</span>
                <svg class="w-5 h-5 text-gray-500 transform transition-transform {expandedSections.biddingSettings ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {#if expandedSections.biddingSettings}
                <div class="p-4 space-y-3">
                  <label class="flex items-center">
                    <input type="checkbox" bind:checked={settings.requireRegistrationToBid} class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <div>
                      <span class="text-sm font-medium text-gray-700">Require registration to bid</span>
                      <p class="text-xs text-gray-500">Users must register before placing bids</p>
                    </div>
                  </label>
                  <label class="flex items-center">
                    <input type="checkbox" bind:checked={settings.allowAbsenteeBids} class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <div>
                      <span class="text-sm font-medium text-gray-700">Allow absentee bids</span>
                      <p class="text-xs text-gray-500">Users can place bids before auction starts</p>
                    </div>
                  </label>
                  <label class="flex items-center">
                    <input type="checkbox" bind:checked={settings.allowProxyBidding} class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <div>
                      <span class="text-sm font-medium text-gray-700">Allow proxy bidding</span>
                      <p class="text-xs text-gray-500">Automatic bidding up to a maximum amount</p>
                    </div>
                  </label>
                  {#if settings.allowProxyBidding}
                    <div class="ml-6">
                      <label class="block text-sm font-medium text-gray-700 mb-1">Max Proxy Bid Amount</label>
                      <input type="number" bind:value={settings.maxProxyBidAmount} step="0.01" min="0" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      <p class="text-xs text-gray-500 mt-1">Maximum amount for proxy bids (leave empty for unlimited)</p>
                    </div>
                  {/if}
                  <label class="flex items-center">
                    <input type="checkbox" bind:checked={settings.extendBiddingOnLastMinuteBid} class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <div>
                      <span class="text-sm font-medium text-gray-700">Extend bidding on last minute bid</span>
                      <p class="text-xs text-gray-500">Automatically extend auction if bid placed near closing time</p>
                    </div>
                  </label>
                  {#if settings.extendBiddingOnLastMinuteBid}
                    <div class="ml-6">
                      <label class="block text-sm font-medium text-gray-700 mb-1">Bidding Extension (Seconds)</label>
                      <input type="number" bind:value={settings.biddingExtensionSeconds} min="0" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                      <p class="text-xs text-gray-500 mt-1">How long to extend bidding when last-minute bid is placed</p>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>

            <!-- Catalog Settings -->
            <div class="border border-gray-200 rounded-lg">
              <button
                type="button"
                onclick={() => toggleSection('catalog')}
                class="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span class="font-medium text-gray-900">Catalog</span>
                <svg class="w-5 h-5 text-gray-500 transform transition-transform {expandedSections.catalog ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {#if expandedSections.catalog}
                <div class="p-4 space-y-4">
                  <label class="flex items-center">
                    <input type="checkbox" bind:checked={settings.displayStartPriceInCatalog} class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <span class="text-sm font-medium text-gray-700">Display start price in catalog</span>
                  </label>
                  <label class="flex items-center">
                    <input type="checkbox" bind:checked={settings.enableAbsenteeBids} class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <span class="text-sm font-medium text-gray-700">Enable absentee bids</span>
                  </label>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Buyer's Premium (%)</label>
                      <input type="number" bind:value={settings.buyersPremium} step="0.01" min="0" max="100" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Days to allow post auction sale</label>
                      <input type="number" bind:value={settings.daysToAllowPostAuctionSale} min="0" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                </div>
              {/if}
            </div>

            <!-- Live Auction Settings -->
            <div class="border border-gray-200 rounded-lg">
              <button
                type="button"
                onclick={() => toggleSection('liveAuction')}
                class="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span class="font-medium text-gray-900">Live Auction</span>
                <svg class="w-5 h-5 text-gray-500 transform transition-transform {expandedSections.liveAuction ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {#if expandedSections.liveAuction}
                <div class="p-4">
                  <label class="flex items-center">
                    <input type="checkbox" bind:checked={settings.baseLiveAuctionStartPriceOnAbsenteeBids} class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                    <div>
                      <span class="text-sm font-medium text-gray-700">Base live auction start price on absentee bids</span>
                      <p class="text-xs text-gray-500">(Timed Auctions Only)</p>
                    </div>
                  </label>
                </div>
              {/if}
            </div>

            <!-- Automatic Auction Settings -->
            <div class="border border-gray-200 rounded-lg">
              <button
                type="button"
                onclick={() => toggleSection('automaticAuction')}
                class="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span class="font-medium text-gray-900">Automatic Auction</span>
                <svg class="w-5 h-5 text-gray-500 transform transition-transform {expandedSections.automaticAuction ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {#if expandedSections.automaticAuction}
                <div class="p-4 space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Initial timer setting for each lot (in seconds)</label>
                    <input type="number" bind:value={settings.automaticAuctionInitialTimerSeconds} min="1" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Timer reset after a bid is placed (in seconds)</label>
                    <input type="number" bind:value={settings.automaticAuctionTimerResetSeconds} min="1" class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                </div>
              {/if}
            </div>

            <!-- Currency -->
            <div class="border border-gray-200 rounded-lg">
              <button
                type="button"
                onclick={() => toggleSection('currency')}
                class="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span class="font-medium text-gray-900">Currency</span>
                <svg class="w-5 h-5 text-gray-500 transform transition-transform {expandedSections.currency ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {#if expandedSections.currency}
                <div class="p-4">
                  <label class="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select bind:value={settings.currency} class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="ILS">ILS - Israeli Shekel</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                    <option value="AUD">AUD - Australian Dollar</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="CHF">CHF - Swiss Franc</option>
                  </select>
                </div>
              {/if}
            </div>
          </div>
        </form>
      </div>
    {/if}
  </div>
</div>

