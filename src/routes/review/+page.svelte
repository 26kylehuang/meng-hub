<script lang="ts">
    import { enhance } from '$app/forms';
    import { fade, fly } from 'svelte/transition';
    import BlockRenderer from '$lib/BlockRenderer.svelte';

    export let data;
    export let form: any;
    $: ({ pendingBlocks, publishedBlocks } = data);

    $: byLesson = pendingBlocks.reduce((acc: any, block: any) => {
        const lid = block.lessons?.id ?? 'unknown';
        if (!acc[lid]) acc[lid] = { lesson: block.lessons, blocks: [] };
        acc[lid].blocks.push(block);
        return acc;
    }, {});
    $: lessonGroups = Object.values(byLesson) as any[];

    let editingBlock: any = null;
    let editContent = '';
    let editJson = '';
    let aiInstruction = '';
    let isAiEditing = false;
    let aiEditError = '';
    let submitting: string | null = null;
    let activeTab: 'pending' | 'published' = 'pending';
    let routingText = '';
    let isRouting = false;
    let routingResult: any = null;
    let routingError = '';
    let pushbackBlock: any = null;
    let pushbackInstruction = '';
    let isPushingBack = false;

    const typeColor: Record<string, string> = {
        heading_2: 'bg-slate-100 text-slate-700', paragraph: 'bg-blue-100 text-blue-700',
        math: 'bg-purple-100 text-purple-700', tip: 'bg-amber-100 text-amber-700',
        timeline: 'bg-cyan-100 text-cyan-700', table: 'bg-indigo-100 text-indigo-700',
        chart: 'bg-teal-100 text-teal-700', proof: 'bg-slate-800 text-white',
        cloze: 'bg-rose-100 text-rose-700', frq: 'bg-orange-100 text-orange-700',
        quiz: 'bg-emerald-100 text-emerald-700', summary: 'bg-blue-900 text-blue-200',
    };

    function blockSummary(block: any): string {
        if (block.content) return block.content.slice(0, 100);
        const cj = block.content_json;
        if (cj?.question_text) return cj.question_text.slice(0, 100);
        if (cj?.title) return cj.title;
        if (cj?.stimulus) return `FRQ: ${cj.stimulus}`;
        if (cj?.points) return `Summary: ${cj.points[0] ?? ''}`;
        return JSON.stringify(cj)?.slice(0, 100) ?? '—';
    }

    function startEdit(block: any) {
        editingBlock = block;
        editContent = block.content ?? '';
        editJson = block.content_json ? JSON.stringify(block.content_json, null, 2) : '';
        aiInstruction = block.review_instruction ?? '';
        aiEditError = '';
    }

    function cancelEdit() { editingBlock = null; }

    $: previewBlock = editingBlock ? {
        ...editingBlock,
        content: editContent || editingBlock.content,
        content_json: (() => { try { return editJson ? JSON.parse(editJson) : editingBlock.content_json; } catch { return editingBlock.content_json; } })(),
    } : null;

    $: jsonValid = !editJson || (() => { try { JSON.parse(editJson); return true; } catch { return false; } })();

    async function runAiEdit() {
        if (!editingBlock || !aiInstruction.trim()) return;
        isAiEditing = true;
        aiEditError = '';
        try {
            const currentBlock = {
                ...editingBlock,
                content: editContent || editingBlock.content,
                content_json: editJson ? JSON.parse(editJson) : editingBlock.content_json,
            };
            const res = await fetch('/api/ai-edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ block: currentBlock, instruction: aiInstruction }),
            });
            const d = await res.json();
            if (!d.success) { aiEditError = d.error ?? 'AI edit failed'; return; }
            const updated = d.updated;
            editContent = updated.content ?? editContent;
            if (updated.content_json || updated.options || updated.parts || updated.events) {
                editJson = JSON.stringify(updated, null, 2);
            }
        } catch (e: any) {
            aiEditError = e.message;
        } finally {
            isAiEditing = false;
        }
    }

    async function runSmartRoute() {
        if (!routingText.trim()) return;
        isRouting = true;
        routingError = '';
        routingResult = null;
        try {
            const res = await fetch('/api/smart-route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rawText: routingText }),
            });
            const d = await res.json();
            if (!d.success) { routingError = d.error ?? 'Routing failed'; return; }
            routingResult = d.routing;
        } catch (e: any) {
            routingError = e.message;
        } finally {
            isRouting = false;
        }
    }

    const actionColors: Record<string, string> = {
        MERGE_INTO:   'bg-blue-100 text-blue-800 border-blue-300',
        INJECT_AFTER: 'bg-amber-100 text-amber-800 border-amber-300',
        NEW_LESSON:   'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
</script>

<svelte:head><title>Review Queue — Meng Hub 梦</title></svelte:head>

<div class="h-full flex flex-col overflow-hidden bg-dashboard">

    <div class="px-6 py-4 bg-white border-b border-slate-200 shrink-0">
        <div class="flex items-end justify-between gap-4 mb-4">
            <div>
                <p class="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">Admin · AI Review</p>
                <h1 class="text-2xl font-black text-slate-900 tracking-tight">Review Queue</h1>
            </div>
            <div class="flex gap-4 text-center shrink-0">
                <div>
                    <p class="text-2xl font-black {pendingBlocks.length > 0 ? 'text-amber-600' : 'text-emerald-600'}">{pendingBlocks.length}</p>
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">pending</p>
                </div>
                <div>
                    <p class="text-2xl font-black text-slate-400">{publishedBlocks.length}</p>
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">published</p>
                </div>
            </div>
        </div>

        <div class="flex items-center gap-2 text-[11px] font-bold text-slate-500 flex-wrap">
            <span class="px-2 py-1 bg-slate-100 rounded">Forge</span>
            <span>→</span>
            <span class="px-2 py-1 bg-amber-100 text-amber-800 rounded font-black">You review here</span>
            <span>→</span>
            <span class="px-2 py-1 bg-slate-100 rounded">Warren job board</span>
            <span>→</span>
            <span class="px-2 py-1 bg-emerald-100 text-emerald-800 rounded">Published</span>
        </div>

        <div class="flex gap-1 mt-4 border-b border-slate-200">
            {#each [['pending', `⏳ Pending (${pendingBlocks.length})`], ['published', `✅ Published (pushback)`]] as [tab, label]}
                <button on:click={() => activeTab = tab}
                    class="px-4 py-2 text-sm font-bold transition-colors border-b-2 -mb-px
                        {activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'}">
                    {label}
                </button>
            {/each}
        </div>
    </div>

    <div class="flex-1 overflow-y-auto p-6">

        {#if form?.success}
            <div class="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-700" in:fade>
                ✅ {form.action === 'approved' ? 'Approved → Warren job board' :
                    form.action === 'approvedAll' ? 'All approved → Warren job board' :
                    form.action === 'republished' ? 'Re-published with edits' :
                    form.action === 'pushedback' ? 'Block pushed back for AI review' :
                    'Block rejected and deleted.'}
            </div>
        {/if}
        {#if form?.error}
            <div class="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm font-bold text-rose-700">{form.error}</div>
        {/if}

        {#if activeTab === 'pending'}

            <div class="mb-8 bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
                <div class="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
                    <span class="text-xl">🧭</span>
                    <div>
                        <h2 class="font-black text-blue-900 text-sm">Smart Router</h2>
                        <p class="text-xs text-blue-600 font-medium mt-0.5">Paste raw text — AI tells you exactly which lesson it belongs in.</p>
                    </div>
                </div>
                <div class="p-5 space-y-3">
                    <textarea bind:value={routingText} placeholder="Paste the raw text you're about to process…" rows="4"
                        class="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-serif text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                    {#if routingError}<p class="text-sm font-bold text-rose-600">⚠️ {routingError}</p>{/if}
                    {#if routingResult}
                        <div class="p-4 border-2 rounded-xl {actionColors[routingResult.action] ?? 'bg-slate-100 border-slate-300'}" in:fade>
                            <div class="flex items-center gap-3 mb-2">
                                <span class="font-black text-sm">{routingResult.action}</span>
                                <span class="text-xs font-bold opacity-70">{Math.round(routingResult.confidence * 100)}% confident</span>
                            </div>
                            <p class="text-sm font-medium mb-2">{routingResult.reasoning}</p>
                            {#if routingResult.target_lesson_title}<p class="text-xs font-black">→ Target: <span class="font-mono">{routingResult.target_lesson_title}</span></p>{/if}
                            {#if routingResult.suggested_lesson_title}<p class="text-xs font-black">→ New lesson: <span class="font-mono">{routingResult.suggested_lesson_title}</span></p>{/if}
                            {#if routingResult.duplicate_warning}
                                <div class="mt-3 p-3 bg-rose-100 border border-rose-300 rounded-lg text-xs font-bold text-rose-800">⚠️ {routingResult.duplicate_warning}</div>
                            {/if}
                        </div>
                    {/if}
                    <button on:click={runSmartRoute} disabled={!routingText.trim() || isRouting}
                        class="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl transition-all disabled:opacity-50">
                        {isRouting ? '🧭 Routing…' : '🧭 Analyse & Route'}
                    </button>
                </div>
            </div>

            {#if pendingBlocks.length === 0}
                <div class="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
                    <p class="text-4xl mb-4">✅</p>
                    <p class="font-black text-slate-600 text-lg">Queue is clear!</p>
                    <a href="/forge" class="inline-block mt-6 px-6 py-3 bg-slate-900 text-white font-black text-sm rounded-xl hover:bg-slate-800 transition-all">Open AI Forge →</a>
                </div>
            {:else}
                {#each lessonGroups as group (group.lesson?.id)}
                    <div class="mb-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" in:fly={{ y: 10, duration: 200 }}>
                        <div class="px-5 py-4 bg-slate-900 flex items-center justify-between gap-4">
                            <div class="min-w-0">
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                    {group.lesson?.units?.classes?.title ?? '—'} › {group.lesson?.units?.title ?? '—'}
                                </p>
                                <h2 class="font-black text-white truncate">{group.lesson?.title ?? 'Unknown Lesson'}</h2>
                            </div>
                            <div class="flex gap-2 shrink-0">
                                <span class="text-xs font-bold text-slate-400">{group.blocks.length} block{group.blocks.length !== 1 ? 's' : ''}</span>
                                <form method="POST" action="?/approveAll" use:enhance={() => { submitting = 'all-'+group.lesson?.id; return async ({ update }) => { submitting = null; update(); }; }}>
                                    <input type="hidden" name="lesson_id" value={group.lesson?.id}>
                                    <button type="submit" disabled={submitting === 'all-'+group.lesson?.id}
                                        class="text-xs font-black px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all disabled:opacity-50">
                                        ✓ Approve All
                                    </button>
                                </form>
                            </div>
                        </div>
                        <div class="divide-y divide-slate-100">
                            {#each group.blocks as block (block.id)}
                                <div class="p-4" in:fade>
                                    {#if block.review_instruction}
                                        <div class="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-800">
                                            🔄 AI re-edit instruction: "{block.review_instruction}"
                                        </div>
                                    {/if}
                                    <div class="flex items-start gap-3">
                                        <span class="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded shrink-0 {typeColor[block.type] ?? 'bg-slate-100 text-slate-600'}">{block.type}</span>
                                        <p class="flex-1 text-sm text-slate-600 font-serif leading-relaxed line-clamp-2 min-w-0">{blockSummary(block)}</p>
                                        <div class="flex gap-1.5 shrink-0">
                                            <button on:click={() => startEdit(block)} class="text-xs font-bold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">Edit</button>
                                            <form method="POST" action="?/approve" use:enhance={() => { submitting = block.id; return async ({ update }) => { submitting = null; update(); }; }}>
                                                <input type="hidden" name="block_id" value={block.id}>
                                                <button type="submit" disabled={submitting === block.id}
                                                    class="text-xs font-black px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all disabled:opacity-50">✓</button>
                                            </form>
                                            <form method="POST" action="?/reject" use:enhance>
                                                <input type="hidden" name="block_id" value={block.id}>
                                                <button type="submit" class="text-xs font-black px-3 py-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100">✗</button>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}
            {/if}

        {:else}
            <div class="mb-5 p-4 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-600">
                Push a published block back to pending_review with an AI instruction. It re-enters your review queue after the AI edits it.
            </div>
            {#if publishedBlocks.length === 0}
                <p class="text-center text-slate-400 py-10 font-bold text-sm">No published blocks found.</p>
            {:else}
                <div class="space-y-3">
                    {#each publishedBlocks as block (block.id)}
                        <div class="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3" in:fade>
                            <span class="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded shrink-0 {typeColor[block.type] ?? 'bg-slate-100 text-slate-600'}">{block.type}</span>
                            <div class="flex-1 min-w-0">
                                <p class="text-[10px] text-slate-400 font-bold mb-0.5">{block.lessons?.units?.classes?.title} › {block.lessons?.title}</p>
                                <p class="text-sm text-slate-700 font-serif line-clamp-2">{blockSummary(block)}</p>
                            </div>
                            <button on:click={() => { pushbackBlock = block; pushbackInstruction = ''; }}
                                class="text-xs font-black px-3 py-1.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-lg hover:bg-amber-200 transition-colors shrink-0 whitespace-nowrap">
                                🔄 Push Back
                            </button>
                        </div>
                    {/each}
                </div>
            {/if}
        {/if}
    </div>
</div>

{#if editingBlock}
    <div class="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" in:fade={{ duration: 150 }}>
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div class="flex items-center gap-3">
                    <span class="{typeColor[editingBlock.type] ?? 'bg-slate-100 text-slate-600'} text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded">{editingBlock.type}</span>
                    <span class="font-black text-slate-800 text-sm">{editingBlock.lessons?.title}</span>
                </div>
                <button on:click={cancelEdit} class="text-slate-400 hover:text-slate-900 transition-colors text-sm font-bold">✕ Close</button>
            </div>
            <div class="flex-1 overflow-hidden flex">
                <div class="w-1/2 border-r border-slate-100 overflow-y-auto p-5 space-y-4">
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">AI Edit Instruction</p>
                        <div class="flex gap-2">
                            <textarea bind:value={aiInstruction} rows="2" placeholder="e.g. Fix the LaTeX, rewrite option B…"
                                class="flex-1 px-3 py-2 border border-amber-200 bg-amber-50 rounded-xl text-sm font-serif text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"></textarea>
                            <button on:click={runAiEdit} disabled={!aiInstruction.trim() || isAiEditing}
                                class="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white font-black text-xs rounded-xl transition-all disabled:opacity-50 shrink-0 self-start">
                                {isAiEditing ? '✦ Editing…' : '✦ AI Edit'}
                            </button>
                        </div>
                        {#if aiEditError}<p class="text-xs text-rose-600 font-bold mt-1">{aiEditError}</p>{/if}
                    </div>
                    {#if editingBlock.content !== null && editingBlock.content !== undefined}
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Text Content</p>
                            <textarea bind:value={editContent} rows="5"
                                class="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-serif text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"></textarea>
                        </div>
                    {/if}
                    {#if editingBlock.content_json}
                        <div>
                            <div class="flex items-center justify-between mb-1.5">
                                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">JSON Content</p>
                                <span class="text-[10px] font-black {jsonValid ? 'text-emerald-600' : 'text-rose-600'}">{jsonValid ? '✓ Valid' : '⚠ Invalid JSON'}</span>
                            </div>
                            <textarea bind:value={editJson} rows="12" spellcheck="false"
                                class="w-full px-4 py-3 border {jsonValid ? 'border-slate-700' : 'border-rose-400'} rounded-xl text-xs font-mono bg-slate-900 text-green-400 focus:outline-none resize-y"></textarea>
                        </div>
                    {/if}
                </div>
                <div class="w-1/2 overflow-y-auto">
                    <div class="p-2 border-b border-slate-100 bg-slate-50">
                        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Live Preview</p>
                    </div>
                    <div class="px-8 py-6">
                        {#if previewBlock}<BlockRenderer block={previewBlock} />{/if}
                    </div>
                </div>
            </div>
            <div class="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
                <form method="POST" action="?/approve" use:enhance={() => { return async ({ update }) => { editingBlock = null; update(); }; }} class="flex-1">
                    <input type="hidden" name="block_id" value={editingBlock.id}>
                    <input type="hidden" name="content" value={editContent}>
                    <input type="hidden" name="content_json" value={editJson}>
                    <button type="submit" disabled={!jsonValid}
                        class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl transition-all disabled:opacity-50">
                        ✓ Approve & Save → Warren Job Board
                    </button>
                </form>
                <form method="POST" action="?/reject" use:enhance={() => { return async ({ update }) => { editingBlock = null; update(); }; }}>
                    <input type="hidden" name="block_id" value={editingBlock.id}>
                    <button type="submit" class="px-6 py-3 bg-rose-50 text-rose-600 border border-rose-200 font-black text-sm rounded-xl hover:bg-rose-100 transition-colors">✗ Reject</button>
                </form>
            </div>
        </div>
    </div>
{/if}

{#if pushbackBlock}
    <div class="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm" in:fade={{ duration: 150 }}>
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div class="px-6 py-4 border-b border-slate-100">
                <h2 class="font-black text-slate-900">🔄 Push Block Back for AI Re-Edit</h2>
                <p class="text-xs text-slate-500 mt-1 font-serif">Write an instruction telling the AI what to fix. It edits the content, then you review again.</p>
            </div>
            <div class="p-6 space-y-4">
                <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <span class="{typeColor[pushbackBlock.type] ?? 'bg-slate-100 text-slate-600'} text-[10px] font-black uppercase px-2 py-0.5 rounded mr-2">{pushbackBlock.type}</span>
                    <span class="text-sm text-slate-600 font-serif">{blockSummary(pushbackBlock)}</span>
                </div>
                <div>
                    <label class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">AI Edit Instruction *</label>
                    <textarea bind:value={pushbackInstruction} rows="4"
                        placeholder="e.g. Answer key is wrong — option C should be correct. Rewrite explanation accordingly."
                        class="w-full px-4 py-3 border border-amber-200 bg-amber-50 rounded-xl text-sm font-serif text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"></textarea>
                </div>
                <div class="flex gap-3">
                    <form method="POST" action="?/pushback"
                        use:enhance={() => { isPushingBack = true; return async ({ update }) => { isPushingBack = false; pushbackBlock = null; update(); }; }}
                        class="flex-1">
                        <input type="hidden" name="block_id" value={pushbackBlock.id}>
                        <input type="hidden" name="instruction" value={pushbackInstruction}>
                        <button type="submit" disabled={!pushbackInstruction.trim() || isPushingBack}
                            class="w-full py-3 bg-amber-500 hover:bg-amber-400 text-white font-black text-sm rounded-xl transition-all disabled:opacity-50">
                            {isPushingBack ? 'Pushing back…' : '🔄 Push Back for AI Edit'}
                        </button>
                    </form>
                    <button on:click={() => pushbackBlock = null}
                        class="px-5 py-3 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}
