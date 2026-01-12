<script>
  let {
    title = '',
    isCollapsed = $bindable(true),
    bgColor = 'bg-gray-50',
    borderColor = 'border-gray-200',
    hoverColor = 'hover:bg-gray-100'
  } = $props();
</script>

<div class="{bgColor} rounded border {borderColor}">
  <button
    type="button"
    onclick={() => isCollapsed = !isCollapsed}
    class="w-full flex items-center justify-between p-1 text-sm font-semibold text-gray-900 {hoverColor} transition-colors"
  >
    <span>{title}</span>
    <svg
      class="w-4 h-4 transform transition-transform {isCollapsed ? '' : 'rotate-180'}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
  </button>
  {#if !isCollapsed}
    <div class="p-3">
      <slot />
    </div>
  {/if}
</div>

