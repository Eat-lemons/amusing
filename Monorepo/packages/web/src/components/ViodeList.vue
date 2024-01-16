<template>
    <div class="chat-area card w-full bg-base-300 shadow-xl px-8 pt-4 overflow-auto">

    </div>
</template>

<script setup lang="ts">


</script>

<style scoped>
.chat-area {
    --tw-bg-opacity: 0.7;
    height: calc(720px - 148px);
}

/* 隐藏滚动条 */
.chat-area::-webkit-scrollbar {
    display: none;
}

.bg-left {
    --tw-bg-opacity: 0.8;
    background-color: hsl(var(--af) / var(--tw-bg-opacity));
}

.max-w-192 {
    max-width: 48rem;
}

.bg-right {
    --tw-bg-opacity: 0.8;
    background-color: hsl(var(--p) / var(--tw-bg-opacity));
    min-height: 10px;
}
</style>