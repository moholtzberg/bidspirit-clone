<script>
  import { goto } from '$app/navigation';
  
  let formData = $state({
    name: '',
    slug: '',
    description: '',
    domain: '',
    logoUrl: ''
  });
  
  let errors = $state({});
  let loading = $state(false);
  let success = $state(false);
  let errorMessage = $state('');
  
  // Auto-generate slug from name
  function generateSlug(name) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }
  
  $effect(() => {
    if (formData.name && !formData.slug) {
      formData.slug = generateSlug(formData.name);
    }
  });
  
  async function handleSubmit() {
    errors = {};
    errorMessage = '';
    loading = true;
    
    try {
      // Clean up empty strings to null
      const submitData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim() || null,
        domain: formData.domain.trim() || null,
        logoUrl: formData.logoUrl.trim() || null
      };
      
      const response = await fetch('/api/auction-houses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.message) {
          errorMessage = data.message;
        } else {
          errorMessage = 'Failed to create auction house. Please try again.';
        }
        loading = false;
        return;
      }
      
      // Success!
      success = true;
      
      // Redirect after 2 seconds
      setTimeout(() => {
        goto(`/auction-houses/${data.slug}`);
      }, 2000);
      
    } catch (err) {
      console.error('Error submitting form:', err);
      errorMessage = 'An unexpected error occurred. Please try again.';
      loading = false;
    }
  }
  
  function validateSlug(slug) {
    if (!slug) return 'Slug is required';
    if (slug.length < 3) return 'Slug must be at least 3 characters';
    if (slug.length > 50) return 'Slug must be less than 50 characters';
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return 'Slug can only contain lowercase letters, numbers, and hyphens';
    }
    return null;
  }
</script>

<div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-2xl mx-auto">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-gray-900 mb-2">Register Your Auction House</h1>
      <p class="text-lg text-gray-600">
        Join BidSpirit and start hosting your own auctions
      </p>
    </div>
    
    <!-- Success Message -->
    {#if success}
      <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <div class="flex items-center">
          <svg class="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 class="text-lg font-semibold text-green-900">Registration Successful!</h3>
            <p class="text-green-700">Your auction house has been created. Redirecting...</p>
          </div>
        </div>
      </div>
    {/if}
    
    <!-- Error Message -->
    {#if errorMessage}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-red-800">{errorMessage}</p>
        </div>
      </div>
    {/if}
    
    <!-- Form -->
    {#if !success}
      <div class="bg-white shadow-lg rounded-lg p-8">
        <form onsubmit={(e) => {
            e.preventDefault();
            handleSubmit()
        }} class="space-y-6">
          <!-- Auction House Name -->
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
              Auction House Name <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              bind:value={formData.name}
              required
              minlength="3"
              maxlength="100"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Heritage Judaica Auctions"
            />
            {#if errors.name}
              <p class="mt-1 text-sm text-red-600">{errors.name}</p>
            {/if}
          </div>
          
          <!-- Slug -->
          <div>
            <label for="slug" class="block text-sm font-medium text-gray-700 mb-2">
              URL Slug <span class="text-red-500">*</span>
            </label>
            <div class="flex items-center">
              <span class="text-gray-500 mr-2">bidspirit.com/</span>
              <input
                type="text"
                id="slug"
                bind:value={formData.slug}
                required
                minlength="3"
                maxlength="50"
                pattern="[a-z0-9-]+"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="heritage-judaica"
                oninput={() => {
                  formData.slug = formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  const slugError = validateSlug(formData.slug);
                  if (slugError) {
                    errors.slug = slugError;
                  } else {
                    delete errors.slug;
                  }
                }}
              />
            </div>
            <p class="mt-1 text-sm text-gray-500">
              This will be your unique URL identifier. Only lowercase letters, numbers, and hyphens.
            </p>
            {#if errors.slug}
              <p class="mt-1 text-sm text-red-600">{errors.slug}</p>
            {/if}
          </div>
          
          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              bind:value={formData.description}
              rows="4"
              maxlength="500"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tell us about your auction house..."
            ></textarea>
            <p class="mt-1 text-sm text-gray-500">
              {formData.description.length}/500 characters
            </p>
          </div>
          
          <!-- Custom Domain (Optional) -->
          <div>
            <label for="domain" class="block text-sm font-medium text-gray-700 mb-2">
              Custom Domain (Optional)
            </label>
            <input
              type="text"
              id="domain"
              bind:value={formData.domain}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="auctions.yourdomain.com"
            />
            <p class="mt-1 text-sm text-gray-500">
              If you have a custom domain, you can use it for your auction house.
            </p>
          </div>
          
          <!-- Logo URL (Optional) -->
          <div>
            <label for="logoUrl" class="block text-sm font-medium text-gray-700 mb-2">
              Logo URL (Optional)
            </label>
            <input
              type="url"
              id="logoUrl"
              bind:value={formData.logoUrl}
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/logo.png"
            />
            <p class="mt-1 text-sm text-gray-500">
              URL to your auction house logo image.
            </p>
          </div>
          
          <!-- Submit Button -->
          <div class="pt-4">
            <button
              type="submit"
              disabled={loading}
              class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {#if loading}
                <span class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Auction House...
                </span>
              {:else}
                Create Auction House
              {/if}
            </button>
          </div>
          
          <!-- Help Text -->
          <div class="pt-4 border-t border-gray-200">
            <p class="text-sm text-gray-600 text-center">
              Already have an auction house? 
              <a href="/" class="text-blue-600 hover:text-blue-800 font-medium">Go to homepage</a>
            </p>
          </div>
        </form>
      </div>
    {/if}
  </div>
</div>

