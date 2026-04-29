<script lang="ts">
    import { page } from '$app/stores';
    import { fade } from 'svelte/transition';
</script>

<svelte:head>
    <title>{$page.status} — Meng Hub 梦</title>
</svelte:head>

<div class="min-h-screen bg-stars flex flex-col items-center justify-center px-6 text-center relative overflow-hidden" in:fade>

    <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
    </div>

    <div class="relative z-10">
        <p class="text-8xl sm:text-9xl font-black text-white/10 tracking-tighter leading-none mb-2">
            {$page.status}
        </p>

        <div class="text-5xl mb-6">
            {#if $page.status === 404}🌌
            {:else if $page.status === 403}🔒
            {:else if $page.status === 500}⚡
            {:else}✦{/if}
        </div>

        <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
            {#if $page.status === 404}
                Archive Not Found
            {:else if $page.status === 403}
                Access Denied
            {:else if $page.status === 500}
                Something Broke in the Engine Room
            {:else}
                Something Went Wrong
            {/if}
        </h1>

        <p class="text-slate-400 font-serif text-base max-w-sm mx-auto leading-relaxed mb-10">
            {#if $page.error?.message && $page.error.message !== 'Not Found'}
                {$page.error.message}
            {:else if $page.status === 404}
                This lesson or page doesn't exist in the archives.
            {:else if $page.status === 403}
                You don't have permission to access this section.
            {:else}
                The Meng Hub engines encountered an unexpected error. Try refreshing.
            {/if}
        </p>

        <div class="flex flex-wrap justify-center gap-3">
            <a href="/" class="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-900/40">
                ← Return to Cosmos
            </a>
            <a href="/dashboard" class="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm rounded-xl border border-slate-700 transition-all">
                Command Center
            </a>
        </div>

        <p class="text-slate-700 text-xs font-mono mt-10">
            Meng Hub 梦 · Error {$page.status}
        </p>
    </div>
</div>
