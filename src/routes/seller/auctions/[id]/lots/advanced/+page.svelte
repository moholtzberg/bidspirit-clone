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
  let availableCategories = $state([]);
  let availableTags = $state([]);
  let showCategoryDropdown = $state({}); // { lotId: boolean }
  let showTagDropdown = $state({}); // { lotId: boolean }
  let categoryInputs = $state({}); // { lotId: string }
  let tagInputs = $state({}); // { lotId: string }
  let draggedLot = $state(null);
  let reordering = $state(false);
  let expandedImageRows = $state(new Set()); // Track which lots have expanded image management

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
    // Use new images array if available
    if (lot.images && Array.isArray(lot.images)) {
      return lot.images.map(img => img.url || img);
    }
    
    // Fallback to legacy fields
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

  let currentAuctionId = $state(null);
  
  onMount(() => {
    if ($page.params.id) {
      currentAuctionId = $page.params.id;
      loadData();
    }
  });
  
  // Only reload if the auction ID actually changes
  $effect(() => {
    if ($page.params.id && $page.params.id !== currentAuctionId) {
      currentAuctionId = $page.params.id;
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
      
      // Parse images for each lot
      lots = loadedLots.map(lot => ({
        ...lot,
        _images: getLotImages(lot),
        images: lot.images || [],
        _tags: lot.tags ? (typeof lot.tags === 'string' ? JSON.parse(lot.tags) : lot.tags) : []
      }));
      
      // Initialize positions if not set
      if (lots.length > 0 && lots.some(lot => !lot.position || lot.position === 0)) {
        await initializePositions();
      }
      
      // Load categories and tags
      await loadCategoriesAndTags();
      
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
    // Initialize category input if editing category
    if (field === 'category') {
      const lot = lots.find(l => l.id === lotId);
      categoryInputs[lotId] = lot?.category || '';
    }
    // Initialize tag input if editing tags
    if (field === 'tags') {
      const lot = lots.find(l => l.id === lotId);
      tagInputs[lotId] = '';
    }
  }

  function cancelEdit() {
    editingCell = null;
  }
  
  async function initializePositions() {
    // Set positions based on current order (1, 2, 3, ...)
    const updates = lots.map((lot, index) => {
      return fetch(`/api/lots/${lot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ position: index + 1 })
      });
    });
    await Promise.all(updates);
  }
  
  async function reorderLots() {
    if (reordering) return;
    reordering = true;
    
    try {
      const lotIds = lots.map(lot => lot.id);
      const response = await fetch('/api/lots/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auctionId: $page.params.id,
          lotIds: lotIds
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reorder lots');
      }
      
      // Reload data to get updated positions
      await loadData();
    } catch (error) {
      console.error('Error reordering lots:', error);
      alert('Failed to reorder lots. Please try again.');
    } finally {
      reordering = false;
    }
  }
  
  function handleDragStart(lot) {
    draggedLot = lot;
  }
  
  function handleDragOver(event, targetLot) {
    event.preventDefault();
    if (!draggedLot || draggedLot.id === targetLot.id) return;
    
    const draggedIndex = lots.findIndex(l => l.id === draggedLot.id);
    const targetIndex = lots.findIndex(l => l.id === targetLot.id);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Reorder in local state
    const newLots = [...lots];
    const [removed] = newLots.splice(draggedIndex, 1);
    newLots.splice(targetIndex, 0, removed);
    lots = newLots;
    
    // Update dragged lot reference
    draggedLot = removed;
  }
  
  function handleDragEnd() {
    if (draggedLot) {
      reorderLots();
      draggedLot = null;
    }
  }
  
  function moveLotUp(index) {
    if (index === 0) return;
    const newLots = [...lots];
    [newLots[index - 1], newLots[index]] = [newLots[index], newLots[index - 1]];
    lots = newLots;
    reorderLots();
  }
  
  function moveLotDown(index) {
    if (index === lots.length - 1) return;
    const newLots = [...lots];
    [newLots[index], newLots[index + 1]] = [newLots[index + 1], newLots[index]];
    lots = newLots;
    reorderLots();
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
      } else if (field === 'tags') {
        // Tags come as JSON string from editingCell, parse to array for API
        if (typeof value === 'string') {
          try {
            updateValue = JSON.parse(value);
            // Also update the local _tags array
            lot._tags = updateValue || [];
          } catch {
            updateValue = null;
            lot._tags = [];
          }
        } else if (Array.isArray(value)) {
          updateValue = value;
          lot._tags = value;
        } else {
          updateValue = null;
          lot._tags = [];
        }
      }

      // Update local state immediately
      if (field === 'category') {
        lot.category = updateValue;
      } else if (field !== 'tags') {
        lot[field] = updateValue;
      }

      // Check if this is a new lot that needs to be created
      const isNewLot = lot._isNew || lotId.startsWith('new-');
      
      if (isNewLot) {
        // Create new lot with POST
        const lotData = {
          auctionId: $page.params.id,
          lotNumber: lot.lotNumber || 1,
          title: lot.title || '',
          description: lot.description || '',
          category: lot.category || '',
          tags: lot._tags && lot._tags.length > 0 ? lot._tags : null,
          startingBid: lot.startingBid || 0,
          bidIncrement: lot.bidIncrement || 100,
          currentBid: lot.currentBid || 0,
          status: lot.status || 'ACTIVE',
          endTime: lot.endTime || null,
          imageUrl: lot.imageUrl || null,
          imageUrls: lot.imageUrls || null
        };

        const response = await fetch('/api/lots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(lotData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create lot');
        }

        // Update local lot with server response (which has the real ID)
        const created = await response.json();
        const index = lots.findIndex(l => l.id === lotId);
        if (index !== -1) {
          // Replace the temporary lot with the created one
          lots[index] = { 
            ...created, 
            _images: getLotImages(created),
            _tags: created.tags ? (typeof created.tags === 'string' ? JSON.parse(created.tags) : created.tags) : []
          };
        }

        editingCell = null;
      } else {
        // Update existing lot with PATCH
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
          lots[index] = { 
            ...updated, 
            _images: getLotImages(updated),
            _tags: updated.tags ? (typeof updated.tags === 'string' ? JSON.parse(updated.tags) : updated.tags) : []
          };
        }

        editingCell = null;
      }
    } catch (error) {
      console.error('Error saving cell:', error);
      alert(`Failed to save: ${error.message || 'Please try again.'}`);
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

    try {
      // Check if this is a new lot that needs to be created first
      const isNewLot = lot._isNew || lotId.startsWith('new-');
      let actualLotId = lotId;
      
      if (isNewLot) {
        // Create the lot first
        const lotData = {
          auctionId: $page.params.id,
          lotNumber: lot.lotNumber || 1,
          title: lot.title || '',
          description: lot.description || '',
          category: lot.category || '',
          tags: lot._tags && lot._tags.length > 0 ? lot._tags : null,
          startingBid: lot.startingBid || 0,
          bidIncrement: lot.bidIncrement || 100,
          currentBid: lot.currentBid || 0,
          status: lot.status || 'ACTIVE',
          endTime: lot.endTime || null,
          imageUrl: lot.imageUrl || null,
          imageUrls: lot.imageUrls || null
        };

        const createResponse = await fetch('/api/lots', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(lotData)
        });

        if (!createResponse.ok) {
          const error = await createResponse.json();
          throw new Error(error.error || 'Failed to create lot');
        }

        const created = await createResponse.json();
        actualLotId = created.id;
        
        // Update local lot with server response
        const index = lots.findIndex(l => l.id === lotId);
        if (index !== -1) {
          lots[index] = { ...created, _images: getLotImages(created), _tags: created.tags ? (typeof created.tags === 'string' ? JSON.parse(created.tags) : created.tags) : [] };
        }
      }

      // Upload files to cloud storage
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('lotId', actualLotId);

      const uploadResponse = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload images');
      }

      const { images: uploadedImages } = await uploadResponse.json();
      
      // Create image records in database
      const imageResponse = await fetch(`/api/lots/${actualLotId}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          images: uploadedImages.map((img, index) => ({
            url: img.url,
            key: img.key,
            displayOrder: index,
            isPrimary: index === 0 && (!lot.images || lot.images.length === 0)
          }))
        })
      });

      if (!imageResponse.ok) {
        throw new Error('Failed to save image records');
      }

      // Reload lot data to get updated images
      await loadData();
      
      // Clear the file input
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images. Please try again.');
    }
  }

  async function removeImage(lotId, imageId) {
    try {
      const response = await fetch(`/api/lots/${lotId}/images?imageId=${imageId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      // Reload lot data to get updated images
      await loadData();
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Failed to delete image. Please try again.');
    }
  }

  function openImageModal(lotId) {
    const lot = lots.find(l => l.id === lotId);
    if (!lot) return;
    showImageModal = { lotId, images: lot._images || [] };
  }
  
  function toggleImageRow(lotId) {
    if (expandedImageRows.has(lotId)) {
      expandedImageRows.delete(lotId);
    } else {
      expandedImageRows.add(lotId);
    }
    expandedImageRows = new Set(expandedImageRows); // Trigger reactivity
  }

  async function loadCategoriesAndTags() {
    try {
      if (!auction?.auctionHouseId) return;
      
      const [categoriesRes, tagsRes] = await Promise.all([
        fetch(`/api/categories?auctionHouseId=${auction.auctionHouseId}`),
        fetch(`/api/tags?auctionHouseId=${auction.auctionHouseId}`)
      ]);
      
      if (categoriesRes.ok) {
        availableCategories = await categoriesRes.json();
      }
      if (tagsRes.ok) {
        availableTags = await tagsRes.json();
      }
    } catch (error) {
      console.error('Error loading categories and tags:', error);
    }
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
      category: '',
      tags: null,
      _tags: [],
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
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    checked={selectedLots.size === lots.length && lots.length > 0}
                    onchange={toggleSelectAll}
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th class="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Pos</th>
                <th class="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">Lot #</th>
                <th class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Images</th>
                <th class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">Title & Description</th>
                <th class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Category</th>
                <th class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Start Bid</th>
                <th class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Current Bid</th>
                <th class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Increment</th>
                <th class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Status</th>
                <th class="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">End Time</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              {#each lots as lot, index (lot.id)}
                <tr 
                  class="{getLotRowClass(lot)} hover:bg-gray-50 transition-colors cursor-move"
                  draggable="true"
                  ondragstart={() => handleDragStart(lot)}
                  ondragover={(e) => handleDragOver(e, lot)}
                  ondragend={handleDragEnd}
                >
                  <!-- Checkbox -->
                  <td class="px-2 py-1 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedLots.has(lot.id)}
                      onchange={() => toggleLotSelection(lot.id)}
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      onclick={(e) => e.stopPropagation()}
                    />
                  </td>
                  
                  <!-- Position -->
                  <td class="px-1 py-1 whitespace-nowrap">
                    <div class="flex items-center gap-0.5">
                      <span class="text-xs font-semibold text-blue-600">{lot.position || index + 1}</span>
                      <div class="flex flex-col">
                        <button
                          onclick={(e) => { e.stopPropagation(); moveLotUp(index); }}
                          disabled={index === 0 || reordering}
                          class="text-[10px] leading-none text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onclick={(e) => { e.stopPropagation(); moveLotDown(index); }}
                          disabled={index === lots.length - 1 || reordering}
                          class="text-[10px] leading-none text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  </td>
                  
                  <!-- Lot Number -->
                  <td class="px-1 py-1 whitespace-nowrap">
                    {#if editingCell?.lotId === lot.id && editingCell?.field === 'lotNumber'}
                      <input
                        type="number"
                        bind:value={editingCell.value}
                        onblur={() => saveCell(lot.id, 'lotNumber', editingCell.value)}
                        onkeydown={(e) => handleKeydown(e, lot.id, 'lotNumber', editingCell.value)}
                        class="w-full px-0.5 py-0.5 text-xs border-2 border-blue-500 rounded focus:outline-none"
                        autofocus
                      />
                    {:else}
                      <span
                        ondblclick={() => startEdit(lot.id, 'lotNumber', lot.lotNumber)}
                        class="cursor-pointer hover:bg-blue-50 px-0.5 py-0.5 rounded text-xs"
                      >
                        {lot.lotNumber}
                      </span>
                    {/if}
                  </td>
                  
                  <!-- Images -->
                  <td class="px-2 py-1">
                    <div class="relative">
                      <div class="grid grid-cols-2 gap-1 w-20">
                        {#each (lot._images || []).slice(0, 2) as image, i}
                          <img
                            src={image}
                            alt="Lot image {i + 1}"
                            class="w-10 h-10 object-cover rounded border border-gray-300 cursor-pointer hover:opacity-75"
                            onclick={() => toggleImageRow(lot.id)}
                          />
                        {/each}
                        {#if (lot._images || []).length === 0}
                          <div class="w-10 h-10 bg-gray-100 rounded border border-gray-300 flex items-center justify-center text-xs text-gray-400">
                            -
                          </div>
                        {/if}
                      </div>
                      {#if (lot._images || []).length > 4}
                        <div class="absolute top-0 right-0 w-10 h-10 bg-gray-800 bg-opacity-75 rounded border border-gray-300 flex items-center justify-center text-xs text-white cursor-pointer hover:bg-opacity-90 group">
                          +{(lot._images || []).length - 4}
                          <!-- Hover tooltip showing additional images -->
                          <div class="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
                            <div class="bg-white rounded-lg shadow-xl border border-gray-200 p-2 max-w-xs">
                              <div class="grid grid-cols-4 gap-1">
                                {#each (lot._images || []).slice(4) as image, i}
                                  <img
                                    src={image}
                                    alt="Lot image {i + 5}"
                                    class="w-12 h-12 object-cover rounded border border-gray-300"
                                  />
                                {/each}
                              </div>
                            </div>
                          </div>
                        </div>
                      {/if}
                      <!-- <button
                        onclick={() => toggleImageRow(lot.id)}
                        class="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                        title="Manage images"
                      >
                        
                      </button> -->
                    </div>
                  </td>
                  
                  <!-- Title & Description -->
                  <td class="px-2 py-1">
                    <div class="space-y-0.5">
                      <!-- Title -->
                      <div>
                        {#if editingCell?.lotId === lot.id && editingCell?.field === 'title'}
                          <input
                            type="text"
                            bind:value={editingCell.value}
                            onblur={() => saveCell(lot.id, 'title', editingCell.value)}
                            onkeydown={(e) => handleKeydown(e, lot.id, 'title', editingCell.value)}
                            class="w-full px-1 py-0.5 text-xs border-2 border-blue-500 rounded focus:outline-none"
                            autofocus
                          />
                        {:else}
                          <span
                            ondblclick={() => startEdit(lot.id, 'title', lot.title)}
                            class="cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded block text-xs font-medium"
                          >
                            {#if lot.title}
                              {lot.title}
                            {:else}
                              <span class="text-gray-400 italic">Double-click to edit</span>
                            {/if}
                          </span>
                        {/if}
                      </div>
                      <!-- Description -->
                      <div>
                        {#if editingCell?.lotId === lot.id && editingCell?.field === 'description'}
                          <textarea
                            bind:value={editingCell.value}
                            onblur={() => saveCell(lot.id, 'description', editingCell.value)}
                            onkeydown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
                            class="w-full px-1 py-1 text-xs border-2 border-blue-500 rounded focus:outline-none"
                            rows="2"
                            autofocus
                          ></textarea>
                        {:else}
                          <span
                            ondblclick={() => startEdit(lot.id, 'description', lot.description)}
                            class="cursor-pointer hover:bg-blue-50 px-1 py-1 rounded block text-xs text-gray-500"
                          >
                            {#if lot.description}
                              {lot.description}
                            {:else}
                              <span class="text-gray-400 italic">Double-click to edit</span>
                            {/if}
                          </span>
                        {/if}
                      </div>
                    </div>
                  </td>
                  
                  <!-- Category with Tags below -->
                  <td class="px-2 py-1">
                    <div class="space-y-1">
                      <!-- Category -->
                      <div>
                        {#if editingCell?.lotId === lot.id && editingCell?.field === 'category'}
                          <div class="relative">
                            <input
                              type="text"
                              value={categoryInputs[lot.id] || lot.category || ''}
                              oninput={(e) => {
                                categoryInputs[lot.id] = e.target.value;
                                editingCell.value = e.target.value;
                                showCategoryDropdown[lot.id] = e.target.value.length > 0;
                              }}
                              onfocus={() => showCategoryDropdown[lot.id] = (categoryInputs[lot.id] || lot.category || '').length > 0}
                              onblur={() => setTimeout(() => showCategoryDropdown[lot.id] = false, 200)}
                              onkeydown={(e) => handleKeydown(e, lot.id, 'category', editingCell.value)}
                              class="w-full px-1 py-0.5 text-xs border-2 border-blue-500 rounded focus:outline-none"
                              autofocus
                            />
                            {#if showCategoryDropdown[lot.id] && availableCategories.length > 0}
                              <div class="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                                {#each availableCategories.filter(c => c.toLowerCase().includes((categoryInputs[lot.id] || lot.category || '').toLowerCase())) as cat}
                                  <button
                                    type="button"
                                    onclick={() => {
                                      categoryInputs[lot.id] = cat;
                                      editingCell.value = cat;
                                      showCategoryDropdown[lot.id] = false;
                                    }}
                                    class="w-full text-left px-2 py-1 hover:bg-blue-50 text-xs"
                                  >
                                    {cat}
                                  </button>
                                {/each}
                                {#if categoryInputs[lot.id] && !availableCategories.some(c => c.toLowerCase() === (categoryInputs[lot.id] || '').toLowerCase())}
                                  <button
                                    type="button"
                                    onclick={() => {
                                      editingCell.value = categoryInputs[lot.id];
                                      showCategoryDropdown[lot.id] = false;
                                    }}
                                    class="w-full text-left px-2 py-1 hover:bg-green-50 text-xs text-green-600 font-semibold"
                                  >
                                    + Create "{categoryInputs[lot.id]}"
                                  </button>
                                {/if}
                              </div>
                            {/if}
                          </div>
                        {:else}
                          <span
                            ondblclick={() => {
                              categoryInputs[lot.id] = lot.category || '';
                              startEdit(lot.id, 'category', lot.category || '');
                            }}
                            class="cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded text-xs"
                          >
                            {#if lot.category}
                              {lot.category}
                            {:else}
                              <span class="text-gray-400 italic">-</span>
                            {/if}
                          </span>
                        {/if}
                      </div>
                      
                      <!-- Tags -->
                      <div>
                        {#if editingCell?.lotId === lot.id && editingCell?.field === 'tags'}
                          <div class="space-y-1">
                            <div class="flex flex-wrap gap-0.5 mb-0.5">
                              {#each (lot._tags || []) as tag, index}
                                <span class="inline-flex items-center px-1 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                                  {tag}
                                  <button
                                    type="button"
                                    onclick={() => {
                                      const tags = [...(lot._tags || [])];
                                      tags.splice(index, 1);
                                      lot._tags = tags;
                                      editingCell.value = JSON.stringify(tags);
                                      saveCell(lot.id, 'tags', JSON.stringify(tags));
                                    }}
                                    class="ml-0.5 text-blue-600 hover:text-blue-800 text-xs"
                                  >
                                    ×
                                  </button>
                                </span>
                              {/each}
                            </div>
                            <div class="relative">
                              <input
                                type="text"
                                value={tagInputs[lot.id] || ''}
                                oninput={(e) => {
                                  tagInputs[lot.id] = e.target.value;
                                  showTagDropdown[lot.id] = e.target.value.length > 0;
                                }}
                                onfocus={() => showTagDropdown[lot.id] = (tagInputs[lot.id] || '').length > 0}
                                onblur={() => {
                                  setTimeout(() => {
                                    showTagDropdown[lot.id] = false;
                                    if (editingCell?.lotId === lot.id && editingCell?.field === 'tags') {
                                      saveCell(lot.id, 'tags', editingCell.value);
                                    }
                                  }, 200);
                                }}
                                onkeydown={(e) => {
                                  if (e.key === 'Enter' && tagInputs[lot.id]?.trim()) {
                                    e.preventDefault();
                                    const tags = [...(lot._tags || [])];
                                    if (!tags.includes(tagInputs[lot.id].trim())) {
                                      tags.push(tagInputs[lot.id].trim());
                                    }
                                    lot._tags = tags;
                                    editingCell.value = JSON.stringify(tags);
                                    tagInputs[lot.id] = '';
                                    showTagDropdown[lot.id] = false;
                                    saveCell(lot.id, 'tags', JSON.stringify(tags));
                                  } else if (e.key === 'Escape') {
                                    cancelEdit();
                                  }
                                }}
                                placeholder="Add tag..."
                                class="w-full px-1 py-0.5 text-xs border-2 border-blue-500 rounded focus:outline-none"
                                autofocus
                              />
                              {#if showTagDropdown[lot.id] && availableTags.length > 0}
                                <div class="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                                  {#each availableTags.filter(t => t.toLowerCase().includes((tagInputs[lot.id] || '').toLowerCase()) && !(lot._tags || []).includes(t)) as tag}
                                    <button
                                      type="button"
                                      onclick={() => {
                                        const tags = [...(lot._tags || [])];
                                        if (!tags.includes(tag)) {
                                          tags.push(tag);
                                        }
                                        lot._tags = tags;
                                        editingCell.value = JSON.stringify(tags);
                                        tagInputs[lot.id] = '';
                                        showTagDropdown[lot.id] = false;
                                        saveCell(lot.id, 'tags', JSON.stringify(tags));
                                      }}
                                      class="w-full text-left px-2 py-1 hover:bg-blue-50 text-xs"
                                    >
                                      {tag}
                                    </button>
                                  {/each}
                                </div>
                              {/if}
                            </div>
                          </div>
                        {:else}
                          <div
                            ondblclick={() => {
                              tagInputs[lot.id] = '';
                              startEdit(lot.id, 'tags', JSON.stringify(lot._tags || []));
                            }}
                            class="cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded min-h-[18px]"
                          >
                            {#if lot._tags && lot._tags.length > 0}
                              <div class="flex flex-wrap gap-0.5">
                                {#each lot._tags.slice(0, 3) as tag}
                                  <span class="inline-flex items-center px-1 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                                    {tag}
                                  </span>
                                {/each}
                                {#if lot._tags.length > 3}
                                  <span class="inline-flex items-center px-1 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                    +{lot._tags.length - 3}
                                  </span>
                                {/if}
                              </div>
                            {:else}
                              <span class="text-gray-400 italic text-xs">Double-click to add tags</span>
                            {/if}
                          </div>
                        {/if}
                      </div>
                    </div>
                  </td>
                  
                  <!-- Starting Bid -->
                  <td class="px-2 py-1 whitespace-nowrap">
                    {#if editingCell?.lotId === lot.id && editingCell?.field === 'startingBid'}
                      <input
                        type="number"
                        step="0.01"
                        bind:value={editingCell.value}
                        onblur={() => saveCell(lot.id, 'startingBid', editingCell.value)}
                        onkeydown={(e) => handleKeydown(e, lot.id, 'startingBid', editingCell.value)}
                        class="w-full px-1 py-0.5 text-xs border-2 border-blue-500 rounded focus:outline-none"
                        autofocus
                      />
                    {:else}
                      <span
                        ondblclick={() => startEdit(lot.id, 'startingBid', lot.startingBid)}
                        class="cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded text-xs"
                      >
                        ${lot.startingBid?.toFixed(2) || '0.00'}
                      </span>
                    {/if}
                  </td>
                  
                  <!-- Current Bid -->
                  <td class="px-2 py-1 whitespace-nowrap">
                    <span class="px-1 py-0.5 rounded text-xs font-semibold">
                      ${lot.currentBid?.toFixed(2) || '0.00'}
                    </span>
                  </td>
                  
                  <!-- Bid Increment -->
                  <td class="px-2 py-1 whitespace-nowrap">
                    {#if editingCell?.lotId === lot.id && editingCell?.field === 'bidIncrement'}
                      <input
                        type="number"
                        step="0.01"
                        bind:value={editingCell.value}
                        onblur={() => saveCell(lot.id, 'bidIncrement', editingCell.value)}
                        onkeydown={(e) => handleKeydown(e, lot.id, 'bidIncrement', editingCell.value)}
                        class="w-full px-1 py-0.5 text-xs border-2 border-blue-500 rounded focus:outline-none"
                        autofocus
                      />
                    {:else}
                      <span
                        ondblclick={() => startEdit(lot.id, 'bidIncrement', lot.bidIncrement)}
                        class="cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded text-xs"
                      >
                        ${lot.bidIncrement?.toFixed(2) || '0.00'}
                      </span>
                    {/if}
                  </td>
                  
                  <!-- Status -->
                  <td class="px-2 py-1 whitespace-nowrap">
                    {#if editingCell?.lotId === lot.id && editingCell?.field === 'status'}
                      <select
                        bind:value={editingCell.value}
                        onblur={() => saveCell(lot.id, 'status', editingCell.value)}
                        onkeydown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
                        class="w-full px-1 py-0.5 text-xs border-2 border-blue-500 rounded focus:outline-none"
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
                  <td class="px-2 py-1 whitespace-nowrap">
                    {#if editingCell?.lotId === lot.id && editingCell?.field === 'endTime'}
                      <input
                        type="datetime-local"
                        bind:value={editingCell.value}
                        onblur={() => saveCell(lot.id, 'endTime', editingCell.value)}
                        onkeydown={(e) => { if (e.key === 'Escape') cancelEdit(); }}
                        class="w-full px-1 py-0.5 text-xs border-2 border-blue-500 rounded focus:outline-none"
                        autofocus
                      />
                    {:else}
                      <span
                        ondblclick={() => {
                          const endTime = lot.endTime ? new Date(lot.endTime).toISOString().slice(0, 16) : '';
                          startEdit(lot.id, 'endTime', endTime);
                        }}
                        class="cursor-pointer hover:bg-blue-50 px-1 py-0.5 rounded text-xs"
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
                
                <!-- Expandable Image Management Row -->
                {#if expandedImageRows.has(lot.id)}
                  <tr class="bg-gray-50">
                    <td colspan="11" class="px-4 py-4">
                      <div class="bg-white rounded-lg border border-gray-200 p-4">
                        <div class="flex items-center justify-between mb-4">
                          <h3 class="text-lg font-semibold text-gray-900">Image Management - Lot #{lot.lotNumber}</h3>
                          <button
                            onclick={() => toggleImageRow(lot.id)}
                            class="text-gray-500 hover:text-gray-700 text-sm"
                          >
                            Collapse
                          </button>
                        </div>
                        
                        <!-- Current Images Grid -->
                        {#if (lot._images || []).length > 0}
                          <div class="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 mb-4">
                            {#each (lot._images || []) as image, index}
                              {@const imageObj = lot.images?.[index] || (typeof image === 'string' ? { url: image } : image)}
                              {@const imageId = imageObj.id || null}
                              <div class="relative group">
                                <img 
                                  src={imageObj.url || image} 
                                  alt="Image {index + 1}" 
                                  class="w-full h-24 object-cover rounded border border-gray-300"
                                />
                                {#if imageId}
                                  <button
                                    onclick={() => removeImage(lot.id, imageId)}
                                    class="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete image"
                                  >
                                    ×
                                  </button>
                                {/if}
                                <div class="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                                  {index + 1}
                                </div>
                              </div>
                            {/each}
                          </div>
                        {:else}
                          <div class="text-center py-8 text-gray-400">
                            <p>No images uploaded yet</p>
                          </div>
                        {/if}
                        
                        <!-- Upload New Images -->
                        <div class="border-t border-gray-200 pt-4">
                          <label class="block mb-2">
                            <span class="text-sm font-medium text-gray-700">Add Images</span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onchange={(e) => handleImageUpload(lot.id, e)}
                              class="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                          </label>
                          <p class="text-xs text-gray-500 mt-1">Select multiple images to upload</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                {/if}
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
                  {@const lot = lots.find(l => l.id === showImageModal.lotId)}
                  {@const imageObj = lot?.images?.[index] || (typeof image === 'string' ? { url: image } : image)}
                  {@const imageId = imageObj.id || (imageObj.url ? null : imageObj)}
                  <div class="relative">
                    <img src={imageObj.url || image} alt="Image {index + 1}" class="w-full h-32 object-cover rounded border border-gray-300" />
                    {#if imageId}
                      <button
                        onclick={() => removeImage(showImageModal.lotId, imageId)}
                        class="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                      >
                        ×
                      </button>
                    {/if}
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

