<script>
  import { onMount } from 'svelte';
  
  let results = $state(null);
  let loading = $state(false);
  let error = $state(null);
  
  async function runTests() {
    loading = true;
    error = null;
    results = null;
    
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      results = data;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  onMount(() => {
    runTests();
  });
  
  function getStatusColor(status) {
    switch (status) {
      case 'passed':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }
</script>

<div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-4xl mx-auto">
    <div class="bg-white shadow-lg rounded-lg p-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">Database Connection Test</h1>
      
      <div class="mb-6">
        <button
          onclick={runTests}
          disabled={loading}
          class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {#if loading}
            <span class="flex items-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Running Tests...
            </span>
          {:else}
            Run Tests
          {/if}
        </button>
      </div>
      
      {#if error}
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p class="text-red-800 font-semibold">Error:</p>
          <p class="text-red-600">{error}</p>
        </div>
      {/if}
      
      {#if results}
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900">Test Results</h2>
            {#if results.summary}
              <div class="flex gap-4 text-sm">
                <span class="text-green-600 font-semibold">✓ Passed: {results.summary.passed}</span>
                <span class="text-red-600 font-semibold">✗ Failed: {results.summary.failed}</span>
                {#if results.summary.warnings > 0}
                  <span class="text-yellow-600 font-semibold">⚠ Warnings: {results.summary.warnings}</span>
                {/if}
              </div>
            {/if}
          </div>
          
          <div class="space-y-3">
            {#each results.tests as test}
              <div class="border rounded-lg p-4 {getStatusColor(test.status)}">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="font-semibold">{test.name}</span>
                    <span class="text-sm opacity-75">{test.status}</span>
                  </div>
                </div>
                {#if test.message}
                  <p class="mt-2 text-sm opacity-90">{test.message}</p>
                {/if}
              </div>
            {/each}
          </div>
        </div>
        
        {#if results.errors && results.errors.length > 0}
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 class="text-lg font-semibold text-red-900 mb-2">Errors:</h3>
            {#each results.errors as err}
              <div class="mb-2">
                <p class="text-red-800 font-medium">{err.message}</p>
                {#if err.stack}
                  <pre class="text-xs text-red-600 mt-1 overflow-auto">{err.stack}</pre>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      {/if}
      
      <div class="mt-8 pt-6 border-t border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">How to Test:</h3>
        <div class="space-y-2 text-sm text-gray-600">
          <p>1. Click "Run Tests" button above</p>
          <p>2. Or visit: <code class="bg-gray-100 px-2 py-1 rounded">/api/test-db</code> directly in your browser</p>
          <p>3. The test will:</p>
          <ul class="list-disc list-inside ml-4 space-y-1">
            <li>Test database connection</li>
            <li>Create test records (AuctionHouse, User, Auction, Lot, Bid)</li>
            <li>Test read operations</li>
            <li>Test list/pagination</li>
            <li>Test relations</li>
            <li>Clean up test data</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>

