<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { onMount, onDestroy } from 'svelte';

    export let open = false;

    $: classId = $page.data?.lesson?.units?.classes?.id
        ?? $page.data?.classDetails?.id
        ?? null;

    let query = '';
    let results: any = { concepts: [], lessons: [] };
    let isLoading = false;
    let selectedIndex = 0;
    let inputEl: HTMLInputElement;
    let debounce: any;

    $: allItems = [
        ...results.concepts.map((c: any) => ({ ...c, _type: 'concept' })),
        ...results.lessons.map((l: any) => ({ ...l, _type: 'lesson' })),
    ];

    $: if (open && inputEl) setTimeout(() => inputEl?.focus(), 50);

    async function search() {
        if (!query.trim()) { results = { concepts: [], lessons: [] }; return; }
        isLoading = true;
        try {
            const params = new URLSearchParams({ q: query, type: 'all' });
            if (classId) params.set('class_id', classId);
            const res = await fetch(`/api/search?${params}`);
            results = await res.json();
            selectedIndex = 0;
        } finally {
            isLoading = false;
        }
    }

    function onInput() {
        clearTimeout(debounce);
        debounce = setTimeout(search, 200);
    }

    function close() {
        open = false;
        query = '';
        results = { concepts: [], lessons: [] };
    }

    function selectItem(item: any) {
        if (item._type === 'lesson') goto(`/class/${item.id}`);
        else goto(`/concepts?highlight=${item.id}`);
        close();
    }

    function onKeydown(e: KeyboardEvent) {
        if (!open) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); open = true; }
            return;
        }
        if (e.key === 'Escape') { close(); return; }
        if (e.key === 'ArrowDown') { e.preventDefault(); selectedIndex = Math.min(selectedIndex + 1, allItems.length - 1); }
        if (e.key === 'ArrowUp')   { e.preventDefault(); selectedIndex = Math.max(selectedIndex - 1, 0); }
        if (e.key === 'Enter' && allItems[selectedIndex]) selectItem(allItems[selectedIndex]);
    }

    onMount(() => window.addEventListener('keydown', onKeydown));
    onDestroy(() => window.removeEventListener('keydown', onKeydown));
</script>

{#if open}
    <div class="fixed inset-0 bg-slate-900/60 z-[100] backdrop-blur-sm" on:click={close} in:fade={{ duration: 100 }}></div>

    <div class="fixed top-[15vh] left-1/2 -translate-x-1/2 w-full max-w-xl z-[101] px-4" in:fly={{ y: -20, duration: 200 }}>
        <div class="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">

            <div class="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                {#if isLoading}
                    <svg class="w-4 h-4 text-slate-400 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                {:else}
                    <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                {/if}
                <input bind:this={inputEl} bind:value={query} on:input={onInput}
                    placeholder={classId ? 'Search concepts & lessons…' : 'Search all archives…'}
                    class="flex-1 text-slate-800 font-medium text-base placeholder:text-slate-400 focus:outline-none bg-transparent">
                <kbd class="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200">Esc</kbd>
            </div>

            <div class="max-h-[60vh] overflow-y-auto">
                {#if !query.trim()}
                    <div class="px-5 py-8 text-center text-slate-400">
                        <p class="text-sm font-medium">Type to search concepts and lessons</p>
                        {#if classId}
                            <p class="text-xs mt-1 text-blue-500 font-bold">📍 This class shown first</p>
                        {/if}
                        <div class="flex justify-center gap-6 mt-4 text-xs text-slate-400">
                            <span><kbd class="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">↑↓</kbd> navigate</span>
                            <span><kbd class="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">↵</kbd> open</span>
                            <span><kbd class="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 font-mono">Esc</kbd> close</span>
                        </div>
                    </div>

                {:else if allItems.length === 0 && !isLoading}
                    <div class="px-5 py-8 text-center text-slate-400">
                        <p class="text-sm font-medium">No results for "<span class="text-slate-600">{query}</span>"</p>
                    </div>

                {:else}
                    {#if results.concepts.length > 0}
                        <div class="px-4 pt-3 pb-1">
                            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Concepts <span class="font-normal">· hover links in notes</span></p>
                        </div>
                        {#each results.concepts as concept, i}
                            {@const isSelected = selectedIndex === i}
                            <button on:click={() => selectItem({ ...concept, _type: 'concept' })}
                                on:mouseenter={() => selectedIndex = i}
                                class="w-full text-left px-4 py-3 flex items-start gap-3 transition-colors {isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}">
                                <div class="w-7 h-7 rounded-lg shrink-0 mt-0.5 flex items-center justify-center text-xs font-black {concept.inCurrentClass ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}">
                                    {concept.inCurrentClass ? '⭐' : '🌐'}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2">
                                        <p class="font-bold text-slate-800 text-sm">{concept.title}</p>
                                        {#if concept.inCurrentClass}
                                            <span class="text-[9px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">This class</span>
                                        {/if}
                                    </div>
                                    {#if concept.preview}
                                        <p class="text-xs text-slate-500 font-serif mt-0.5 line-clamp-1">{concept.preview}</p>
                                    {/if}
                                </div>
                                <code class="text-[9px] font-mono text-slate-300 shrink-0 mt-1">concept</code>
                            </button>
                        {/each}
                    {/if}

                    {#if results.lessons.length > 0}
                        <div class="px-4 pt-3 pb-1 {results.concepts.length > 0 ? 'border-t border-slate-100 mt-1' : ''}">
                            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Lessons</p>
                        </div>
                        {#each results.lessons as lesson, i}
                            {@const idx = results.concepts.length + i}
                            {@const isSelected = selectedIndex === idx}
                            <button on:click={() => selectItem({ ...lesson, _type: 'lesson' })}
                                on:mouseenter={() => selectedIndex = idx}
                                class="w-full text-left px-4 py-3 flex items-center gap-3 transition-colors {isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}">
                                <div class="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-black {lesson.inCurrentClass ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}">
                                    {lesson.inCurrentClass ? '📖' : '📄'}
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2">
                                        <p class="font-bold text-slate-800 text-sm truncate">{lesson.title}</p>
                                        {#if lesson.inCurrentClass}
                                            <span class="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">This class</span>
                                        {/if}
                                    </div>
                                    <p class="text-xs text-slate-400 truncate">{lesson.units?.classes?.title ?? ''} › {lesson.units?.title ?? ''}</p>
                                </div>
                                <code class="text-[9px] font-mono text-slate-300 shrink-0">lesson</code>
                            </button>
                        {/each}
                    {/if}
                {/if}
            </div>
        </div>
    </div>
{/if}
