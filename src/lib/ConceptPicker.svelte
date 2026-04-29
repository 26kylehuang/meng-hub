<script lang="ts">
    import { fade } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';

    export let classId: string | null = null;
    export let readonly = false;

    const dispatch = createEventDispatcher();

    let query = '';
    let results: any[] = [];
    let isLoading = false;
    let debounce: any;
    let inputEl: HTMLInputElement;

    async function search() {
        if (!query.trim()) { results = []; return; }
        isLoading = true;
        try {
            const params = new URLSearchParams({ q: query, type: 'concepts' });
            if (classId) params.set('class_id', classId);
            const res = await fetch(`/api/search?${params}`);
            const data = await res.json();
            results = data.concepts ?? [];
        } finally {
            isLoading = false;
        }
    }

    function onInput() {
        clearTimeout(debounce);
        debounce = setTimeout(search, 200);
    }

    function insert(concept: any) {
        dispatch('insert', { syntax: `[[${concept.title}|${concept.id}]]`, concept });
        dispatch('select', { concept });
        query = '';
        results = [];
    }
</script>

<div class="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
    <div class="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50">
        <svg class="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input bind:this={inputEl} bind:value={query} on:input={onInput}
            placeholder={readonly ? 'Look up a concept…' : 'Search concepts to insert [[link]]…'}
            class="flex-1 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none bg-transparent font-medium">
        {#if isLoading}
            <svg class="w-3 h-3 text-slate-400 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
        {/if}
    </div>

    {#if results.length > 0}
        <div class="max-h-48 overflow-y-auto divide-y divide-slate-50" in:fade={{ duration: 100 }}>
            {#each results as concept (concept.id)}
                <button on:click={() => insert(concept)}
                    class="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors flex items-start gap-2.5">
                    <span class="text-[10px] font-black shrink-0 mt-0.5 {concept.inCurrentClass ? 'text-blue-500' : 'text-slate-400'}">
                        {concept.inCurrentClass ? '⭐' : '·'}
                    </span>
                    <div class="min-w-0">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-bold text-slate-800">{concept.title}</span>
                            {#if concept.inCurrentClass}
                                <span class="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">This class</span>
                            {/if}
                        </div>
                        {#if concept.preview}
                            <p class="text-xs text-slate-500 font-serif line-clamp-1 mt-0.5">{concept.preview}</p>
                        {/if}
                        <code class="text-[9px] text-slate-300 font-mono">[[{concept.title}|{concept.id.slice(0,8)}…]]</code>
                    </div>
                    <span class="shrink-0 text-xs font-black text-blue-500 ml-auto mt-0.5">
                        {readonly ? 'View →' : 'Insert'}
                    </span>
                </button>
            {/each}
        </div>
    {:else if query.trim() && !isLoading}
        <div class="px-3 py-3 text-xs text-slate-400 font-medium">
            No concepts match — <a href="/concepts" target="_blank" class="text-blue-500 hover:underline">create one →</a>
        </div>
    {:else if !query.trim()}
        <div class="px-3 py-2 text-xs text-slate-400">Type to find a concept to link</div>
    {/if}
</div>
