<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { page } from '$app/stores';
    import { fade } from 'svelte/transition';

    export let blockId: string;
    export let lessonId: string;

    let showMenu = false;
    let menuX = 0;
    let menuY = 0;
    let flipUp = false;
    let flipLeft = false;
    let isSubmitting = false;
    let selectedType = '';
    let noteText = '';
    let showNoteField = false;
    let alreadyReported = false;
    let toast: { message: string; ok: boolean } | null = null;
    let toastTimer: any;

    function wasReported(): boolean {
        try {
            const reported = JSON.parse(localStorage.getItem('mh_reported') ?? '{}');
            return !!reported[blockId];
        } catch { return false; }
    }

    function markReported() {
        try {
            const reported = JSON.parse(localStorage.getItem('mh_reported') ?? '{}');
            reported[blockId] = Date.now();
            localStorage.setItem('mh_reported', JSON.stringify(reported));
        } catch {}
    }

    function handleContextMenu(event: MouseEvent) {
        event.preventDefault();
        alreadyReported = wasReported();
        selectedType = '';
        noteText = '';
        showNoteField = false;
        flipLeft = event.clientX > window.innerWidth * 0.65;
        flipUp   = event.clientY > window.innerHeight * 0.65;
        menuX = event.clientX;
        menuY = event.clientY;
        showMenu = true;
    }

    function showToast(message: string, ok: boolean) {
        toast = { message, ok };
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast = null, 4000);
    }

    function selectType(type: string) {
        selectedType = type;
        showNoteField = true;
    }

    async function submitFeedback() {
        if (!selectedType) return;
        isSubmitting = true;
        showMenu = false;

        const session = $page.data.session;
        const { error } = await supabase.from('user_feedback').insert({
            user_id:    session?.user?.id ?? null,
            block_id:   blockId,
            lesson_id:  lessonId,
            issue_type: selectedType,
            note:       noteText.trim() || null,
            page_url:   typeof window !== 'undefined' ? window.location.pathname : null,
            resolved:   false,
        });

        if (error) {
            showToast('Failed to send — please try again.', false);
        } else {
            markReported();
            showToast('Reported to admins. Thank you! 🙏', true);
        }
        isSubmitting = false;
        selectedType = '';
        noteText = '';
    }

    const issueTypes = [
        { type: 'wrong_answer',          label: 'Wrong Answer Key',      icon: '❌', desc: 'The correct answer is marked incorrectly' },
        { type: 'confusing_explanation', label: 'Confusing Explanation',  icon: '🤔', desc: 'The reasoning is unclear or misleading' },
        { type: 'typo',                  label: 'Typo / Formatting',     icon: '✏️',  desc: 'Spelling, grammar, or display error' },
        { type: 'factual_error',         label: 'Factual Error',         icon: '📚', desc: 'The content is historically or factually wrong' },
        { type: 'broken_math',           label: 'Broken Math/Formula',   icon: '🔢', desc: 'LaTeX or equation is not rendering' },
        { type: 'other',                 label: 'Other Issue',           icon: '💬', desc: 'Something else needs attention' },
    ];
</script>

<div on:contextmenu={handleContextMenu} class="relative w-full">
    <slot />
    {#if wasReported()}
        <div class="absolute top-0 right-0 w-2 h-2 rounded-full bg-amber-400 opacity-50" title="You've reported this block"></div>
    {/if}
</div>

{#if showMenu}
    <div class="fixed inset-0 z-40" on:click={() => showMenu = false} role="presentation"></div>
    <div class="fixed z-50 bg-white border border-slate-200 shadow-2xl rounded-2xl w-72 overflow-hidden"
        style="
            {flipUp ? 'bottom' : 'top'}: {flipUp ? window.innerHeight - menuY : menuY}px;
            {flipLeft ? 'right' : 'left'}: {flipLeft ? window.innerWidth - menuX : menuX}px;
        "
        in:fade={{ duration: 100 }}>

        <div class="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div>
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Report Issue</span>
                {#if alreadyReported}
                    <span class="text-[9px] text-amber-600 font-bold">You've reported this before</span>
                {/if}
            </div>
            <code class="text-[8px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {blockId.slice(0, 6)}
            </code>
        </div>

        {#if !showNoteField}
            <div class="py-1">
                {#each issueTypes as item}
                    <button on:click={() => selectType(item.type)}
                        class="w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-slate-50 transition-colors group">
                        <span class="text-base shrink-0 mt-0.5">{item.icon}</span>
                        <div class="min-w-0">
                            <p class="text-sm font-bold text-slate-700 group-hover:text-slate-900">{item.label}</p>
                            <p class="text-[10px] text-slate-400 mt-0.5 leading-tight">{item.desc}</p>
                        </div>
                    </button>
                {/each}
            </div>
        {:else}
            <div class="p-4">
                <div class="flex items-center gap-2 mb-3">
                    <span class="text-base">{issueTypes.find(i => i.type === selectedType)?.icon}</span>
                    <p class="text-sm font-bold text-slate-800">{issueTypes.find(i => i.type === selectedType)?.label}</p>
                    <button on:click={() => showNoteField = false}
                        class="ml-auto text-[10px] text-slate-400 hover:text-slate-700">← Back</button>
                </div>
                <textarea bind:value={noteText}
                    placeholder="Describe the issue (optional but helpful)…"
                    rows="4"
                    class="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-serif text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"></textarea>
                <button on:click={submitFeedback} disabled={isSubmitting}
                    class="w-full mt-3 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl transition-all disabled:opacity-50">
                    {isSubmitting ? 'Sending…' : 'Submit Report'}
                </button>
            </div>
        {/if}
    </div>
{/if}

{#if toast}
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl text-sm font-bold shadow-xl max-w-sm text-center
        {toast.ok ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}"
        in:fade out:fade>
        {toast.message}
    </div>
{/if}
