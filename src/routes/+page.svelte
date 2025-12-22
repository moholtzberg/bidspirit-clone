<script>
  import Modal from '$lib/components/Modal.svelte';
  import VideosSection from '$lib/components/VideosSection.svelte';
  import ScreenshotsSection from '$lib/components/ScreenshotsSection.svelte';
  import IntegrationsSection from '$lib/components/IntegrationsSection.svelte'; 
  import FeaturesSection from '$lib/components/FeaturesSection.svelte';

  let isModalOpen = $state(false);
</script>

<!-- Footer -->
<footer class="bg-gray-800 text-white py-8">
  <div class="container mx-auto px-4 text-center">
    <p class="">&copy; 2024 DealerEdge. All rights reserved.</p>
    <div class="mt-4 flex justify-center space-x-6">
      <a href="#" class="hover:text-gray-400 transition-colors">Privacy Policy</a>
      <a href="#" class="hover:text-gray-400 transition-colors">Terms of Service</a>
      <a href="#" class="hover:text-gray-400 transition-colors">Sitemap</a>
    </div>
    <div class="mt-4 flex justify-center space-x-6">
      <!-- Social Media Links with Emojis -->
      <a href="#" class="text-2xl hover:text-gray-400 transition-colors" aria-label="LinkedIn">🔗</a>
      <a href="#" class="text-2xl hover:text-gray-400 transition-colors" aria-label="Twitter">🐦</a>
      <a href="#" class="text-2xl hover:text-gray-400 transition-colors" aria-label="Facebook">💼</a>
      <a href="#" class="text-2xl hover:text-gray-400 transition-colors" aria-label="Instagram">📸</a>
    </div>
  </div>
</footer>

<!-- Modal Component -->
<Modal isOpen={isModalOpen} on:close={() => isModalOpen = false} />
