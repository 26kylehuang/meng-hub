<script lang="ts">
    import Simulator from '$lib/Simulator.svelte';
    import { fade } from 'svelte/transition';

    export let data;
    $: ({ questions } = data);
</script>

<div class="h-full flex flex-col bg-slate-900 overflow-hidden" in:fade>

    <div class="px-8 py-5 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div>
            <span class="text-xs font-black text-rose-400 uppercase tracking-widest block mb-1">Nemesis Engine</span>
            <h1 class="text-xl font-black text-white tracking-tight">⚔️ Conquer Your Weaknesses</h1>
        </div>
        <a href="/progress" class="text-xs font-bold text-slate-400 hover:text-white transition-colors px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700">
            ← Retreat
        </a>
    </div>

    <div class="px-8 py-3 bg-rose-950/50 border-b border-rose-900/50 shrink-0">
        <p class="text-xs text-rose-300 font-medium">
            {questions.length} questions pulled from your hardest misses, sorted by failure count.
            Results will update your Nemesis queue automatically.
        </p>
    </div>

    <div class="flex-1 overflow-hidden bg-white">
        <Simulator {questions} />
    </div>
</div>
