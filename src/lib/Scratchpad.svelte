<script lang="ts">
    import { page } from '$app/stores';
    import { supabase } from '$lib/supabase';
    import { onMount, onDestroy } from 'svelte';
    import { fly } from 'svelte/transition';

    export let isOpen = false;

    let noteContent = '';
    let saveStatus: 'saved' | 'saving' | 'local' | 'offline' | 'error' = 'saved';
    let timeoutId: any;
    let userId: string | null = null;
    let isOffline = false;
    let charCount = 0;

    $: charCount = noteContent.length;
    $: contextName = $page.url.pathname.startsWith('/class/') ? 'Lesson Notes' : 'Personal Pad';

    const statusLabel: Record<string, string> = {
        saved:   'Synced to cloud',
        saving:  'Saving...',
        local:   'Saved locally',
        offline: 'Offline — saved locally',
        error:   'Sync failed — saved locally',
    };

    const statusColor: Record<string, string> = {
        saved:   'text-emerald-500',
        saving:  'text-blue-400',
        local:   'text-amber-400',
        offline: 'text-amber-400',
        error:   'text-rose-400',
    };

    onMount(async () => {
        const localDraft = localStorage.getItem('meng_draft_notes');
        if (localDraft) noteContent = localDraft;

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            userId = session.user.id;
            const { data } = await supabase
                .from('scratchpads')
                .select('content')
                .eq('user_id', userId)
                .single();
            if (data?.content && !localDraft) noteContent = data.content;
        }

        const goOffline = () => { isOffline = true; saveStatus = 'offline'; };
        const goOnline  = () => { isOffline = false; handleInput(); };
        window.addEventListener('offline', goOffline);
        window.addEventListener('online',  goOnline);
        return () => {
            window.removeEventListener('offline', goOffline);
            window.removeEventListener('online',  goOnline);
        };
    });

    onDestroy(() => clearTimeout(timeoutId));

    function handleInput() {
        saveStatus = 'saving';
        localStorage.setItem('meng_draft_notes', noteContent);
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
            if (isOffline) { saveStatus = 'offline'; return; }
            if (!userId)   { saveStatus = 'local';   return; }
            const { error } = await supabase
                .from('scratchpads')
                .upsert(
                    { user_id: userId, content: noteContent, last_updated: new Date().toISOString() },
                    { onConflict: 'user_id' }
                );
            saveStatus = error ? 'error' : 'saved';
        }, 1500);
    }

    function clearNotes() {
        if (!confirm('Clear all notes? This cannot be undone.')) return;
        noteContent = '';
        handleInput();
    }
</script>

{#if !isOpen}
    <button on:click={() => isOpen = true}
        class="fixed right-0 bottom-10 bg-slate-900 text-white pl-3 pr-2 py-3 rounded-l-2xl shadow-xl z-40 flex flex-col items-center gap-1.5 hover:bg-slate-800 transition-colors group"
        title="Open Scratchpad">
        <span class="text-base">📝</span>
        <span class="text-[9px] font-black uppercase tracking-widest [writing-mode:vertical-rl] text-slate-400 group-hover:text-white transition-colors">Notes</span>
    </button>
{/if}

{#if isOpen}
    <div class="fixed top-0 right-0 h-full w-[380px] bg-white shadow-2xl border-l border-slate-200 z-50 flex flex-col"
        transition:fly={{ x: 380, duration: 250 }}>

        <div class="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
            <div>
                <h2 class="font-black text-slate-800 tracking-tight text-sm">{contextName}</h2>
                <p class="text-[10px] font-black uppercase tracking-widest mt-0.5 {statusColor[saveStatus]}">
                    {statusLabel[saveStatus]}
                </p>
            </div>
            <div class="flex items-center gap-2">
                <button on:click={clearNotes}
                    class="text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors px-2 py-1 rounded hover:bg-rose-50">
                    Clear
                </button>
                <button on:click={() => isOpen = false}
                    class="text-slate-400 hover:text-slate-900 transition-colors p-1.5 rounded hover:bg-slate-200">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        </div>

        <textarea bind:value={noteContent} on:input={handleInput}
            placeholder="Start typing your notes…"
            class="flex-1 w-full px-6 py-5 text-slate-700 leading-relaxed resize-none focus:outline-none font-serif text-base bg-white"
            spellcheck="true"></textarea>

        <div class="px-5 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
            <span class="text-[10px] text-slate-400 font-mono">{charCount.toLocaleString()} chars</span>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Meng Hub <span class="font-serif">梦</span></span>
        </div>
    </div>
{/if}
