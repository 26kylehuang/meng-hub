<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    export let data;
    $: ({ concepts } = data);

    let localConcepts = [...concepts];
    let search = '';

    onMount(() => {
        const highlightId = $page.url.searchParams.get('highlight');
        if (highlightId) {
            const found = localConcepts.find((c: any) => c.id === highlightId);
            if (found) {
                search = found.title;
                setTimeout(() => startEdit(found), 150);
            }
        }
    });

    let editingConcept: any = null;
    let isNew = false;
    let editTitle = '';
    let editDefinition = '';
    let editConnection = '';
    let editExample = '';
    let isSaving = false;
    let saveError = '';
    let extractText = '';
    let extractLesson = '';
    let isExtracting = false;
    let extractResult: any = null;
    let extractError = '';
    let showExtractor = false;

    $: filtered = localConcepts.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase())
    );

    function startEdit(concept: any) {
        editingConcept = concept;
        isNew = false;
        editTitle = concept.title;
        const blocks = concept.content_json ?? [];
        editDefinition = blocks.find((b: any) => b.type === 'paragraph')?.content ?? '';
        editConnection = blocks.find((b: any) => b.type === 'tip')?.content ?? '';
        const exBlock = blocks.filter((b: any) => b.type === 'paragraph');
        editExample = exBlock[1]?.content?.replace('Example: ', '') ?? '';
        saveError = '';
    }

    function startNew() {
        editingConcept = { id: null };
        isNew = true;
        editTitle = '';
        editDefinition = '';
        editConnection = '';
        editExample = '';
        saveError = '';
    }

    function cancelEdit() { editingConcept = null; }

    function buildContentJson() {
        const blocks: any[] = [{ type: 'paragraph', content: editDefinition }];
        if (editConnection) blocks.push({ type: 'tip', title: 'Connection', content: editConnection });
        if (editExample)   blocks.push({ type: 'paragraph', content: `Example: ${editExample}` });
        return blocks;
    }

    async function saveConcept() {
        if (!editTitle.trim() || !editDefinition.trim()) { saveError = 'Title and definition required.'; return; }
        isSaving = true;
        saveError = '';
        try {
            const res = await fetch('/api/concepts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: isNew ? null : editingConcept.id,
                    title: editTitle.trim(),
                    content_json: buildContentJson(),
                }),
            });
            const d = await res.json();
            if (!d.success) { saveError = d.error ?? 'Save failed'; return; }
            if (isNew) {
                localConcepts = [...localConcepts, d.concept].sort((a, b) => a.title.localeCompare(b.title));
            } else {
                localConcepts = localConcepts.map(c => c.id === d.concept.id ? d.concept : c);
            }
            editingConcept = null;
        } catch (e: any) {
            saveError = e.message;
        } finally {
            isSaving = false;
        }
    }

    async function deleteConcept(id: string) {
        if (!confirm('Delete this concept? Any [[links]] pointing to it will stop resolving.')) return;
        await fetch(`/api/concepts?id=${id}`, { method: 'DELETE' });
        localConcepts = localConcepts.filter(c => c.id !== id);
    }

    async function extractConcepts() {
        if (!extractText.trim()) return;
        isExtracting = true;
        extractError = '';
        extractResult = null;
        try {
            const res = await fetch('/api/extract-concepts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: extractText, lessonTitle: extractLesson }),
            });
            const d = await res.json();
            if (!d.success) { extractError = d.error ?? 'Extraction failed'; return; }
            extractResult = d;
            for (const c of (d.saved ?? [])) {
                if (!localConcepts.find((x: any) => x.id === c.id)) {
                    localConcepts = [...localConcepts, c].sort((a, b) => a.title.localeCompare(b.title));
                }
            }
        } catch (e: any) {
            extractError = e.message;
        } finally {
            isExtracting = false;
        }
    }

    function getDefinition(concept: any): string {
        return (concept.content_json ?? []).find((b: any) => b.type === 'paragraph')?.content?.slice(0, 120) ?? '';
    }

    function copyLink(concept: any) {
        navigator.clipboard.writeText(`[[${concept.title}|${concept.id}]]`);
    }
</script>

<svelte:head><title>Zettelkasten — Meng Hub 梦</title></svelte:head>

<div class="h-full flex flex-col overflow-hidden bg-dashboard">

    <div class="px-6 py-4 bg-white border-b border-slate-200 shrink-0">
        <div class="flex items-center justify-between gap-4 mb-3">
            <div>
                <p class="text-xs font-black text-blue-500 uppercase tracking-widest mb-0.5">Warren · Admin</p>
                <h1 class="text-2xl font-black text-slate-900 tracking-tight">
                    Zettelkasten <span class="font-serif text-blue-500">梦</span>
                </h1>
                <p class="text-sm text-slate-500 font-medium mt-0.5">
                    {localConcepts.length} concepts · hover links in notes use these definitions
                </p>
            </div>
            <div class="flex gap-2">
                <button on:click={() => showExtractor = !showExtractor}
                    class="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl transition-all">
                    ✦ AI Extract
                </button>
                <button on:click={startNew}
                    class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-sm rounded-xl transition-all">
                    + New Concept
                </button>
            </div>
        </div>
        <input type="text" bind:value={search} placeholder="Search concepts…"
            class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
    </div>

    {#if showExtractor}
        <div class="px-6 py-5 bg-blue-50 border-b border-blue-100 shrink-0" in:fly={{ y: -10, duration: 200 }}>
            <div class="max-w-3xl">
                <h2 class="font-black text-blue-900 text-sm mb-3">✦ AI Concept Extractor</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <input type="text" bind:value={extractLesson} placeholder="Lesson title (optional)"
                        class="px-3 py-2.5 border border-blue-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <textarea bind:value={extractText} placeholder="Paste the raw text…" rows="2"
                        class="md:col-span-2 px-3 py-2 border border-blue-200 bg-white rounded-xl text-sm font-serif focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                </div>
                {#if extractError}<p class="text-sm font-bold text-rose-600 mb-2">⚠️ {extractError}</p>{/if}
                {#if extractResult}
                    <div class="mb-3 p-3 bg-white border border-blue-200 rounded-xl text-sm" in:fade>
                        <span class="font-black text-emerald-700">✅ {extractResult.saved?.length ?? 0} new concepts saved.</span>
                        {#if extractResult.skipped_existing?.length}
                            <span class="text-slate-500 ml-2">Skipped {extractResult.skipped_existing.length} existing.</span>
                        {/if}
                    </div>
                {/if}
                <button on:click={extractConcepts} disabled={!extractText.trim() || isExtracting}
                    class="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl transition-all disabled:opacity-50">
                    {isExtracting ? '✦ Extracting…' : '✦ Extract & Save All'}
                </button>
            </div>
        </div>
    {/if}

    <div class="flex-1 overflow-y-auto">
        {#if filtered.length === 0}
            <div class="text-center py-20 text-slate-400">
                <p class="text-3xl mb-3">🌐</p>
                <p class="font-bold text-sm">{search ? 'No concepts match.' : 'No concepts yet.'}</p>
                <p class="text-xs mt-1">{search ? 'Try a different search.' : 'Use AI Extract or create one manually.'}</p>
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {#each filtered as concept (concept.id)}
                    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col" in:fade>
                        <div class="flex items-start justify-between gap-2 mb-3">
                            <h3 class="font-black text-slate-900 text-base leading-tight">{concept.title}</h3>
                            <button on:click={() => copyLink(concept)} title="Copy [[link]] syntax"
                                class="text-[10px] font-black text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors shrink-0">
                                [[ ]]
                            </button>
                        </div>
                        <p class="text-sm text-slate-600 font-serif leading-relaxed flex-1 line-clamp-3">
                            {getDefinition(concept)}
                        </p>
                        <div class="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                            <button on:click={() => startEdit(concept)}
                                class="flex-1 text-xs font-bold py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
                                Edit
                            </button>
                            <button on:click={() => deleteConcept(concept.id)}
                                class="text-xs font-bold px-3 py-2 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100">
                                ✗
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

{#if editingConcept}
    <div class="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" in:fade={{ duration: 150 }}>
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 class="font-black text-slate-900">{isNew ? 'New Concept' : `Edit: ${editingConcept.title}`}</h2>
                <button on:click={cancelEdit} class="text-slate-400 hover:text-slate-700 font-bold text-sm">✕</button>
            </div>
            <div class="p-6 space-y-4">
                {#if saveError}<p class="text-sm font-bold text-rose-600">{saveError}</p>{/if}
                <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Term / Title *</label>
                    <input type="text" bind:value={editTitle} placeholder="e.g. Treaty of Versailles"
                        class="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {#if editTitle}
                        <p class="text-[10px] text-blue-500 font-mono mt-1">Link syntax: [[{editTitle}|uuid]]</p>
                    {/if}
                </div>
                <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Definition *</label>
                    <textarea bind:value={editDefinition} rows="3" placeholder="What it is, why it matters…"
                        class="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-serif text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                </div>
                <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Connection</label>
                    <textarea bind:value={editConnection} rows="2" placeholder="How this connects to other concepts…"
                        class="w-full px-4 py-3 border border-amber-100 bg-amber-50 rounded-xl text-amber-900 font-serif text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"></textarea>
                </div>
                <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Example</label>
                    <input type="text" bind:value={editExample} placeholder="A concrete example…"
                        class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-serif text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
            </div>
            <div class="px-6 py-4 border-t border-slate-100 flex gap-3">
                <button on:click={saveConcept} disabled={isSaving || !editTitle.trim() || !editDefinition.trim()}
                    class="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl transition-all disabled:opacity-50">
                    {isSaving ? 'Saving…' : isNew ? 'Create Concept' : 'Save Changes'}
                </button>
                <button on:click={cancelEdit}
                    class="px-6 py-3 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors">
                    Cancel
                </button>
            </div>
        </div>
    </div>
{/if}
