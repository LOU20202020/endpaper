<template>
    <div
        aria-label="Endpaper"
        class="flex h-full items-center gap-2 font-extrabold text-[var(--color-text-primary)]"
    >
        <img aria-hidden="true" class="aspect-square h-full object-contain" :src="brandVisual" />
        <span v-if="!iconOnly" class="hidden text-sm tracking-wide xl:inline">Endpaper</span>
    </div>
</template>

<script setup lang="ts">
import brandVisual from '@modrinth/assets/branding/endpaper.png'

defineProps<{
    iconOnly?: boolean
}>()
</script>
