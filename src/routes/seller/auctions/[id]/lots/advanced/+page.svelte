<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  let auction = $state(null);
  let lots = $state([]);
  let loading = $state(true);
  let editingCell = $state(null); // { lotId, field, value }
  let selectedLots = $state(new Set());
  let imageUploads = $state({}); // { lotId: [files] }
  let showImageModal = $state(null); // { lotId, images }
  let saving = $state({}); // Track which lots are being saved

  // Color coding rules for problematic lots
  function getLotStatus(lot) {
    const issues = [];
    
    // Check for missing images
    const images = getLotImages(lot);
    if (images.length === 0) {
      issues.push('no-images');
    }
    
    // Check for invalid starting bid
    if (!lot.startingBid || lot.startingBid <= 0) {
      issues.push('invalid-price');
    }
    
    // Check for missing title
    if (!lot.title || lot.title.trim() === '') {
      issues.push('missing-title');
    }
    
    // Check for missing description
    if (!lot.description || lot.description.trim() === '') {
      issues.push('missing-description');
    }
    
    // Check for invalid bid increment
    if (!lot.bidIncrement || lot.bidIncrement <= 0) {
      issues.push('invalid-increment');
    }
    
    return issues;
  }

  function getLotRowClass(lot) {
    const issues = getLotStatus(lot);
    if (issues.length === 0) return 'bg-white';
    if (issues.includes('no-images')) return 'bg-red-50';
    if (issues.includes('invalid-price')) return 'bg-yellow-50';
    if (issues.includes('missing-title')) return 'bg-orange-50';
    return 'bg-yellow-50';
  }

  function getLotImages(lot) {
    if (lot.imageUrls) {
      try {
        const parsed = JSON.parse(lot.imageUrls);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    if (lot.imageUrl) {
      return [lot.imageUrl];
    }
    return [];
  }

  function setLotImages(lot, images) {
    if (images.length === 0) {
      lot.imageUrl = null;
      lot.imageUrls = null;
    } else if (images.length === 1) {
      lot.imageUrl = images[0];
      lot.imageUrls = null;
    } else {
      lot.imageUrl = images[0];
      lot.imageUrls = JSON.stringify(images);
    }
  }

  $effect(() => {
    if ($page.params.id) {
      loadData();
    }
  });

  async function loadData() {
    try {
      loading = true;
      const auctionId = $page.params.id;
      
      const [auctionRes, lotsRes] = await Promise.all([
        fetch(`/api/auctions/${auctionId}`),
        fetch(`/api/lots?auctionId=${auctionId}`)
      ]);
      
      if (!auctionRes.ok) {
        throw new Error('Failed to load auction');
      }
      if (!lotsRes.ok) {
        throw new Error('Failed to load lots');
      }
      
      auction = await auctionRes.json();
      const loadedLots = await lotsRes.json();
      
      console.log('Loaded lots:', loadedLots);
      
      // Parse imageUrls for each lot
      lots = loadedLots.map(lot => ({
        ...lot,
        _images: getLotImages(lot)
      }));
      
      console.log('Processed lots:', lots);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load lots. Please refresh the page.');
    } finally {
      loading = false;
    }
  }

  function startEdit(lotId, field, currentValue) {
    editingCell = { lotId, field, value: currentValue || '' };
  }

  function cancelEdit() {
    editingCell = null;
  }

  async function saveCell(lotId, field, value) {
    try {
      saving[lotId] = true;
      
      // Find the lot and update it
      const lot = lots.find(l => l.id === lotId);
      if (!lot) return;

      // Handle special field types
      let updateValue = value;
      if (field === 'startingBid' || field === 'bidIncrement' || field === 'currentBid') {
        updateValue = parseFloat(value) || 0;
      } else if (field === 'lotNumber') {
        updateValue = parseInt(value) || 1;
      } else if (field === 'endTime') {
        updateValue = value || null;
      }

      // Update local state immediately
      lot[field] = updateValue;

      // Save to server
      const response = await fetch(`/api/lots/${lotId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          [field]: updateValue
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      // Update local lot with server response
      const updated = await response.json();
      const index = lots.findIndex(l => l.id === lotId);
      if (index !== -1) {
        lots[index] = { ...updated, _images: getLotImages(updated) };
      }

      editingCell = null;
    } catch (error) {
      console.error('Error saving cell:', error);
      alert('Failed to save. Please try again.');
    } finally {
      saving[lotId] = false;
    }
  }

  function handleKeydown(event, lotId, field, value) {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveCell(lotId, field, value);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelEdit();
    }
  }

  function toggleLotSelection(lotId) {
    if (selectedLots.has(lotId)) {
      selectedLots.delete(lotId);
    } else {
      selectedLots.add(lotId);
    }
    selectedLots = new Set(selectedLots);
  }

  function toggleSelectAll() {
    if (selectedLots.size === lots.length) {
      selectedLots = new Set();
    } else {
      selectedLots = new Set(lots.map(l => l.id));
    }
  }

  async function handleImageUpload(lotId, event) {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    const lot = lots.find(l => l.id === lotId);
    if (!lot) return;

    // For now, we'll just store the file references
    // In production, you'd upload to a storage service
    imageUploads[lotId] = [...(imageUploads[lotId] || []), ...files];
    
    // Create preview URLs
    const newImages = files.map(file => URL.createObjectURL(file));
    const currentImages = lot._images || [];
    lot._images = [...currentImages, ...newImages];
    
    // Update the lot's image fields
    setLotImages(lot, lot._images);
    
    // Save to server
    await saveCell(lotId, 'imageUrls', lot.imageUrls);
  }

  function removeImage(lotId, imageIndex) {
    const lot = lots.find(l => l.id === lotId);
    if (!lot) return;

    const images = lot._images || [];
    images.splice(imageIndex, 1);
    lot._images = images;
    setLotImages(lot, images);
    
    saveCell(lotId, 'imageUrls', lot.imageUrls);
  }

  function openImageModal(lotId) {
    const lot = lots.find(l => l.id === lotId);
    if (!lot) return;
    showImageModal = { lotId, images: lot._images || [] };
  }

  async function deleteLots() {
    if (selectedLots.size === 0) return;
    if (!confirm(`Delete ${selectedLots.size} lot(s)?`)) return;

    try {
      const deletePromises = Array.from(selectedLots).map(lotId =>
        fetch(`/api/lots/${lotId}`, { method: 'DELETE' })
      );
      await Promise.all(deletePromises);
      selectedLots = new Set();
      await loadData();
    } catch (error) {
      console.error('Error deleting lots:', error);
      alert('Failed to delete lots');
    }
  }

  function addNewLot() {
    const newLotNumber = lots.length > 0 
      ? Math.max(...lots.map(l => l.lotNumber)) + 1 
      : 1;
    
    lots = [...lots, {
      id: `new-${Date.now()}`,
      lotNumber: newLotNumber,
      title: '',
      description: '',
      startingBid: 0,
      bidIncrement: 100,
      currentBid: 0,
      status: 'ACTIVE',
      imageUrl: null,
      imageUrls: null,
      _images: [],
      _isNew: true
    }];
  }
</script>

<svelte:head>
  <title>Advanced Lot Management - {auction?.title || 'Loading...'}</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-6">
  <div class="max-w-[95vw] mx-auto px-4">
    {#if loading}
      <div class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="mt-4 text-gray-600">Loading lots...</p>
      </div>
    {:else if auction}
      <!-- Header -->
      <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Advanced Lot Management</h1>
            <p class="text-gray-600 mt-1">{auction.title}</p>
          </div>
          <div class="flex items-center gap-3">
            <a
              href="/seller/auctions/{auction.id}/lots"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Standard View
            </a>
            <button
              onclick={addNewLot}
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Add Lot
            </button>
            {#if selectedLots.size > 0}
              <button
                onclick={deleteLots}
                class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete Selected ({selectedLots.size})
              </button>
            {/if}
          </div>
        </div>
        
        <!-- Legend -->
        <div class="flex items-center gap-4 text-xs">
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-red-50 border border-red-200"></div>
            <span>Missing Images</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-yellow-50 border border-yellow-200"></div>
            <span>Invalid Price/Increment</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-orange-50 border border-orange-200"></div>
            <span>Missing Title</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-white border border-gray-200"></div>
            <span>Valid</span>
          </div>
        </div>
      </div>

      <!-- Spreadsheet Table -->
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        {#if lots.length === 0}
          <div class="p-12 text-center">
            <p class="text-gray-600 text-lg mb-4">No lots found for this auction.</p>
            <button
              onclick={addNewLot}
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Add First Lot
            </button>
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th class="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={selectedLots.size === lots.length && lots.length > 0}
                    onchange={toggleSelectAll}
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Lot #</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Images</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Title</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px]">Description</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Category</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Start Bid</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Current Bid</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Increment</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">End Time</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each lots as lot (lot.id)}
                <tr class="{getLotRowClass(lot)} hover:bg-gray-50 transition-colors">
                  <!-- Checkbox -->
                  <td class="px-3 py-2 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedLots.has(lot.id)}
                      onchange={() => toggleLotSelection(lot.id)}
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  
                  <!-- Lot Number -->
                  <td class="px-4 py-2 whitespace-nowrap">
                    {#if editingCell?.lotId === lot.id && editingCell?.field === 'lotNumber'}
                      <input
                        type="number"
                        bind:value={editingCell.value}
                        onblur={() => saveCell(lot.id, 'lotNumber', editingCell.value)}
                        onkeydown={(e) => handleKeydown(e, lot.id, 'lotNumber', editingCell.value)}
                        class="w-full px-2 py-1 text-sm border-2 border-blue-500 rounded focus:outline-none"
                        autofocus
                      />
                    {:else}
                      <span
                        ondblclick={() => startEdit(lot.id, 'lotNumber', lot.lotNumber)}
                        class="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                      >
                        {lot.lotNumber}
                      </span>
                    {/if}
                  </td>
                  
                  <!-- Images -->
                  <td class="px-4 py-2 whitespace-nowrap">
                    <div class="flex items-center gap-1">
                      {#each (lot._images || []).slice(0, 3) as image, i}
                        <img
                          src={image}
                          alt="Lot image {i + 1}"
                          class="w-8 h-8 object-cover rounded border border-gray-300 cursor-pointer"
                          onclick={() => openImageModal(lot.id)}
                        />
                      {/each}
                      {#if (lot._images || []).length > 3}
                        <div
                          class="w-8 h-8 bg-gray-200 rounded border border-gray-300 flex items-center justify-center text-xs cursor-pointer"
                          onclick={() => openImageModal(lot.id)}
                        >
                          +{(lot._images || []).length - 3}
                        </div>
                      {/if}
                      <label class="ml-1 cursor-pointer">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onchange={(e) => handleImageUpload(lot.id, e)}
                          class="hidden"
                        />
                        <span class="text-blue-600 hover:text-blue-800 text-xs">+</span>
                      </label>
                    </div>
                  </td>
                  
                  <!-- Title -->
                  <td class="px-4 py-2">
                    {#if editingCell?.lotId === lot.id && editingCell?.field === 'title'}
                      <input
                        type="text"
                        bind:value={editingCell.value}
                        onblur={() => saveCell(lot.id, 'title', editingCell.value)}
                        onkeydown={(e) => handleKeydown(e, lot.id, 'title', editingCell.value)}
                        class="w-full px-2 py-1 text-sm border-2 border-blue-500 rounded focus:outline-none"
                        autofocus
                      />
                    {:else}
                      <span
                        ondblclick={() => startEdit(lot.id, 'title', lot.title)}
                        class="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded block"
                      >
                        {#if lot.title}
                          {lot.title}
                        {:else}
                          <span class="text-gray-400 italic">Double-click to edit</span>
                        {/if}
                      </span>
                    {/if}
                  </td>
                  
                  <!-- Description -->
                  <td class="px-4 py-2">
                    {#if editingCell?.lotId === lot.id && editingCell?.field === 'description'}
                      <textarea
                        bind:value={editingCell.value}
                        onblur={() => saveCell(lot.id, 'description', editingCell.value)}
                        onkeydown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
                        class="w-full px-2 py-1 text-sm border-2 border-blue-500 rounded focus:outline-none"
                        rows="2"
                        autofocus
                      ></textarea>
                    {:else}
                      <span
                        ondblclick={() => startEdit(lot.id, 'description', lot.description)}
                        class="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded block text-sm"
                      >
                        {#if lot.description}
                          {lot.description}
                        {:else}
                          <span class="text-gray-400 italic">Double-click to edit</span>
                        {/if}
                      </span>
                    {/if}
                  </td>
                  
                  <!-- Category -->
                  <td class="px-4 py-2 whitespace-nowrap">
                    {#if editingCell?.lotId === lot.id && editingCell?.field === 'category'}
                      <input
                        type="text"
                        bind:value={editingCell.value}
                        onblur={() => saveCell(lot.id, 'category', editingCell.value)}
                        onkeydown={(e) => handleKeydown(e, lot.id, 'category', editingCell.value)}
                        class="w-full px-2 py-1 text-sm border-2 border-blue-500 rounded focus:outline-none"
                        autofocus
                      />
                    {:else}
                      <span
                        ondblclick={() => startEdit(lot.id, 'category', lot.category)}
                        class="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                      >
                        {#if lot.category}
                          {lot.category}
                        {:else}
                          <span class="text-gray-400 italic">-</span>
                        {/if}
                      </span>
                    {/if}
                  </td>
                  
                  <!-- Starting Bid -->
                  <td class="px-4 py-2 whitespace-nowrap">
                    {#if editingCell?.lotId === lot.id && editingCell?.field === 'startingBid'}
                      <input
                        type="number"
                        step="0.01"
                        bind:value={editingCell.value}
                        onblur={() => saveCell(lot.id, 'startingBid', editingCell.value)}
                        onkeydown={(e) => handleKeydown(e, lot.id, 'startingBid', editingCell.value)}
                        class="w-full px-2 py-1 text-sm border-2 border-blue-500 rounded focus:outline-none"
                        autofocus
                      />
                    {:else}
                      <span
                        ondblclick={() => startEdit(lot.id, 'startingBid', lot.startingBid)}
                        class="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                      >
                        ${lot.startingBid?.toFixed(2) || '0.00'}
                      </span>
                    {/if}
                  </td>
                  
                  <!-- Current Bid -->
                  <td class="px-4 py-2 whitespace-nowrap">
                    <span class="px-2 py-1 rounded font-semibold">
                      ${lot.currentBid?.toFixed(2) || '0.00'}
                    </span>
                  </td>
                  
                  <!-- Bid Increment -->
                  <td class="px-4 py-2 whitespace-nowrap">
                    {#if editingCell?.lotId === lot.id && editingCell?.field === 'bidIncrement'}
                      <input
                        type="number"
                        step="0.01"
                        bind:value={editingCell.value}
                        onblur={() => saveCell(lot.id, 'bidIncrement', editingCell.value)}
                        onkeydown={(e) => handleKeydown(e, lot.id, 'bidIncrement', editingCell.value)}
                        class="w-full px-2 py-1 text-sm border-2 border-blue-500 rounded focus:outline-none"
                        autofocus
                      />
                    {:else}
                      <span
                        ondblclick={() => startEdit(lot.id, 'bidIncrement', lot.bidIncrement)}
                        class="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                      >
                        ${lot.bidIncrement?.toFixed(2) || '0.00'}
                      </span>
                    {/if}
                  </td>
                  
                  <!-- Status -->
                  <td class="px-4 py-2 whitespace-nowrap">
                    {#if editingCell?.lotId === lot.id && editingCell?.field === 'status'}
                      <select
                        bind:value={editingCell.value}
                        onblur={() => saveCell(lot.id, 'status', editingCell.value)}
                        onkeydown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
                        class="w-full px-2 py-1 text-sm border-2 border-blue-500 rounded focus:outline-none"
                        autofocus
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="SOLD">Sold</option>
                        <option value="UNSOLD">Unsold</option>
                        <option value="WITHDRAWN">Withdrawn</option>
                      </select>
                    {:else}
                      <span
                        ondblclick={() => startEdit(lot.id, 'status', lot.status)}
                        class="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded text-xs font-semibold {lot.status === 'ACTIVE' ? 'text-green-600' : lot.status === 'SOLD' ? 'text-blue-600' : 'text-gray-600'}"
                      >
                        {lot.status}
                      </span>
                    {/if}
                  </td>
                  
                  <!-- End Time -->
                  <td class="px-4 py-2 whitespace-nowrap">
                    {#if editingCell?.lotId === lot.id && editingCell?.field === 'endTime'}
                      <input
                        type="datetime-local"
                        bind:value={editingCell.value}
                        onblur={() => saveCell(lot.id, 'endTime', editingCell.value)}
                        onkeydown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
                        class="w-full px-2 py-1 text-sm border-2 border-blue-500 rounded focus:outline-none"
                        autofocus
                      />
                    {:else}
                      <span
                        ondblclick={() => {
                          const endTime = lot.endTime ? new Date(lot.endTime).toISOString().slice(0, 16) : '';
                          startEdit(lot.id, 'endTime', endTime);
                        }}
                        class="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded text-xs"
                      >
                        {#if lot.endTime}
                          {new Date(lot.endTime).toLocaleString()}
                        {:else}
                          <span class="text-gray-400 italic">-</span>
                        {/if}
                      </span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        {/if}
      </div>

      <!-- Image Management Modal -->
      {#if showImageModal}
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-2xl font-bold text-gray-900">Manage Images - Lot {lots.find(l => l.id === showImageModal.lotId)?.lotNumber}</h2>
                <button
                  onclick={() => showImageModal = null}
                  class="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div class="grid grid-cols-4 gap-4 mb-4">
                {#each showImageModal.images as image, index}
                  <div class="relative">
                    <img src={image} alt="Image {index + 1}" class="w-full h-32 object-cover rounded border border-gray-300" />
                    <button
                      onclick={() => removeImage(showImageModal.lotId, index)}
                      class="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                    >
                      ×
                    </button>
                  </div>
                {/each}
              </div>
              
              <label class="block">
                <span class="text-sm font-medium text-gray-700">Add Images</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onchange={(e) => {
                    handleImageUpload(showImageModal.lotId, e);
                    showImageModal = null;
                  }}
                  class="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </label>
            </div>
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>

