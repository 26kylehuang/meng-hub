<script lang="ts">
    import { enhance } from '$app/forms';
    import { fade } from 'svelte/transition';
    import BlockRenderer from '$lib/BlockRenderer.svelte';
    import ConceptPicker from '$lib/ConceptPicker.svelte';

    export let data;
    export let form: any;
    $: ({ block } = data);

    $: classId = block.lessons?.units?.class_id ?? null;

    let content     = block.content ?? '';
    let contentJson = block.content_json ? JSON.stringify(block.content_json, null, 2) : '';
    let warrenNotes = block.warren_notes ?? '';
    let isSubmitting = false;
    let aiInstruction = '';
    let isAiEditing = false;
    let aiEditError = '';
    let showConceptPicker = false;
    let textareaEl: HTMLTextAreaElement;

    function insertConceptLink(e: CustomEvent) {
        const { syntax } = e.detail;
        if (!textareaEl) { content += syntax; return; }
        const start = textareaEl.selectionStart;
        const end   = textareaEl.selectionEnd;
        content = content.slice(0, start) + syntax + content.slice(end);
        setTimeout(() => {
            textareaEl.focus();
            textareaEl.selectionStart = textareaEl.selectionEnd = start + syntax.length;
        }, 0);
    }

    $: previewBlock = {
        ...block,
        content: content || block.content,
        content_json: (() => { try { return contentJson ? JSON.parse(contentJson) : block.content_json; } catch { return block.content_json; } })(),
    };

    $: jsonValid = !contentJson || (() => { try { JSON.parse(contentJson); return true; } catch { return false; } })();

    async function runAiEdit() {
        if (!aiInstruction.trim()) return;
        isAiEditing = true;
        aiEditError = '';
        try {
            const currentBlock = {
                ...block,
                content: content || block.content,
                content_json: contentJson ? JSON.parse(contentJson) : block.content_json,
            };
            const res = await fetch('/api/ai-edit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ block: currentBlock, instruction: aiInstruction }),
            });
            const d = await res.json();
            if (!d.success) { aiEditError = d.error ?? 'Failed'; return; }
            const updated = d.updated;
            if (updated.content !== undefined) content = updated.content;
            if (updated.content_json || updated.options || updated.parts || updated.events || updated.steps) {
                contentJson = JSON.stringify(updated, null, 2);
            }
            aiInstruction = '';
        } catch (e: any) {
            aiEditError = e.message;
        } finally {
            isAiEditing = false;
        }
    }

    const typeColor: Record<string, string> = {
        quiz: 'bg-emerald-100 text-emerald-700', frq: 'bg-orange-100 text-orange-700',
        summary: 'bg-blue-900 text-blue-200', paragraph: 'bg-blue-100 text-blue-700',
        math: 'bg-purple-100 text-purple-700', tip: 'bg-amber-100 text-amber-700',
        cloze: 'bg-rose-100 text-rose-700',
    };
</script>

<div class="h-full flex flex-col overflow-hidden bg-slate-50">

    <div class="px-6 py-4 bg-white border-b border-slate-200 shrink-0 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
            <a href="/warren" class="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors shrink-0">← Board</a>
            <span class="text-slate-300">|</span>
            <span class="{typeColor[block.type] ?? 'bg-slate-100 text-slate-600'} text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded shrink-0">
                {block.type}
            </span>
            <div class="min-w-0">
                <p class="text-xs font-bold text-slate-500 truncate">{block.lessons?.units?.classes?.title} › {block.lessons?.title}</p>
            </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
            {#if form?.saved}<span class="text-xs font-bold text-emerald-600" in:fade>✓ Saved</span>{/if}
            {#if form?.error}<span class="text-xs font-bold text-rose-600">{form.error}</span>{/if}
        </div>
    </div>

    <div class="flex-1 overflow-hidden flex">

        <div class="w-1/2 border-r border-slate-200 overflow-y-auto flex flex-col">
            <div class="p-6 flex-1 space-y-5">

                <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">AI Edit</p>
                    <div class="flex gap-2">
                        <textarea bind:value={aiInstruction} rows="2"
                            placeholder="e.g. Fix the LaTeX, rewrite option B, answer key is wrong C should be correct…"
                            class="flex-1 px-3 py-2 border border-amber-200 bg-amber-50 rounded-xl text-sm font-serif text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"></textarea>
                        <button on:click={runAiEdit} disabled={!aiInstruction.trim() || isAiEditing}
                            class="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-white font-black text-xs rounded-xl transition-all disabled:opacity-50 shrink-0 self-start">
                            {isAiEditing ? '…' : '✦ AI'}
                        </button>
                    </div>
                    {#if aiEditError}<p class="text-xs text-rose-600 font-bold mt-1">{aiEditError}</p>{/if}
                </div>

                <div>
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Fact-Check Notes</p>
                    <textarea bind:value={warrenNotes} rows="3" placeholder="What you checked, changed, or flagged…"
                        class="w-full px-4 py-3 border border-amber-200 bg-amber-50 rounded-xl text-sm text-amber-900 font-serif focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"></textarea>
                </div>

                {#if block.content !== null && block.content !== undefined}
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Text Content</p>
                            <button on:click={() => showConceptPicker = !showConceptPicker}
                                class="text-[10px] font-black px-2 py-1 rounded transition-colors
                                    {showConceptPicker ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}">
                                🌐 {showConceptPicker ? 'Hide' : 'Insert [[link]]'}
                            </button>
                        </div>
                        {#if showConceptPicker}
                            <div class="mb-2"><ConceptPicker {classId} on:insert={insertConceptLink} /></div>
                        {/if}
                        <textarea bind:this={textareaEl} bind:value={content} rows="6"
                            class="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-serif text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y leading-relaxed"></textarea>
                    </div>
                {/if}

                {#if block.content_json}
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Structured JSON</p>
                            <span class="text-[10px] font-black {jsonValid ? 'text-emerald-600' : 'text-rose-600'}">
                                {jsonValid ? '✓ Valid JSON' : '⚠️ Invalid JSON'}
                            </span>
                        </div>
                        <textarea bind:value={contentJson} rows="14" spellcheck="false"
                            class="w-full px-4 py-3 border {jsonValid ? 'border-slate-700' : 'border-rose-400'} rounded-xl text-xs font-mono bg-slate-900 text-green-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"></textarea>
                    </div>
                {/if}
            </div>

            <div class="p-5 border-t border-slate-200 bg-white flex gap-3">
                <form method="POST" action="?/save"
                    use:enhance={() => { isSubmitting = true; return async ({ update }) => { isSubmitting = false; update(); }; }}
                    class="flex-1">
                    <input type="hidden" name="block_id" value={block.id}>
                    <input type="hidden" name="content" value={content}>
                    <input type="hidden" name="content_json" value={contentJson}>
                    <input type="hidden" name="warren_notes" value={warrenNotes}>
                    <button type="submit" disabled={isSubmitting}
                        class="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-black text-sm rounded-xl transition-all disabled:opacity-50">
                        💾 Save Draft
                    </button>
                </form>
                <form method="POST" action="?/publish"
                    use:enhance={() => { isSubmitting = true; return async ({ update }) => { isSubmitting = false; update(); }; }}>
                    <input type="hidden" name="block_id" value={block.id}>
                    <input type="hidden" name="content" value={content}>
                    <input type="hidden" name="content_json" value={contentJson}>
                    <input type="hidden" name="warren_notes" value={warrenNotes}>
                    <button type="submit" disabled={isSubmitting || !jsonValid}
                        class="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl transition-all disabled:opacity-50 whitespace-nowrap">
                        🚀 Publish
                    </button>
                </form>
            </div>
        </div>

        <div class="w-1/2 overflow-y-auto">
            <div class="p-3 border-b border-slate-200 bg-slate-100">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Live Preview</p>
            </div>
            <div class="px-10 py-8">
                <BlockRenderer block={previewBlock} />
            </div>
        </div>
    </div>
</div>
