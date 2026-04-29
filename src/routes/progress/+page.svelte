<script lang="ts">
    import { fade } from 'svelte/transition';
    export let data;
    $: ({ nemesisCount, masteredCount, activeNemesis, history, cleared } = data);

    $: recentThree = history.slice(0, 3).map((h: any) => h.score);
    $: prevThree   = history.slice(3, 6).map((h: any) => h.score);
    $: recentAvg   = recentThree.length ? Math.round(recentThree.reduce((a: number, b: number) => a + b, 0) / recentThree.length) : 0;
    $: prevAvg     = prevThree.length   ? Math.round(prevThree.reduce((a: number, b: number) => a + b, 0) / prevThree.length)   : 0;
    $: trend       = recentThree.length && prevThree.length ? recentAvg - prevAvg : 0;
    $: sparkScores = history.slice(0, 10).reverse().map((h: any) => h.score);
    $: avgScore    = history.length
        ? Math.round(history.reduce((s: number, h: any) => s + h.score, 0) / history.length)
        : 0;

    function scoreColor(score: number) {
        if (score >= 80) return 'text-emerald-600';
        if (score >= 60) return 'text-amber-500';
        return 'text-rose-500';
    }

    function barColor(score: number) {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-amber-400';
        return 'bg-rose-500';
    }

    function timeSince(dateStr: string) {
        const diff = Date.now() - new Date(dateStr).getTime();
        const d = Math.floor(diff / 86400000);
        if (d === 0) return 'Today';
        if (d === 1) return 'Yesterday';
        return `${d}d ago`;
    }
</script>

<div class="h-full overflow-y-auto bg-dashboard" in:fade>
    <div class="max-w-4xl mx-auto px-8 py-12">

        <header class="mb-10">
            <h1 class="text-4xl font-black text-slate-900 tracking-tight">
                Nemesis Engine <span class="text-blue-600 font-serif">梦</span>
            </h1>
            <p class="text-slate-500 font-medium mt-1">Track mastery. Eliminate weaknesses. Repeat.</p>
        </header>

        {#if cleared}
            <div class="mb-8 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-4" in:fade>
                <span class="text-2xl">✨</span>
                <div>
                    <p class="font-black text-emerald-800">Nemesis Queue Cleared!</p>
                    <p class="text-sm text-emerald-600 font-medium">You've conquered all your active weaknesses.</p>
                </div>
            </div>
        {/if}

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
            <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <p class="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Avg. Score</p>
                <div class="flex items-end gap-2">
                    <p class="text-5xl font-black {scoreColor(avgScore)}">{history.length ? avgScore + '%' : '—'}</p>
                    {#if trend !== 0}
                        <p class="text-sm font-black mb-1 {trend > 0 ? 'text-emerald-500' : 'text-rose-500'}">
                            {trend > 0 ? '↑' : '↓'}{Math.abs(trend)}%
                        </p>
                    {/if}
                </div>
                <p class="text-xs text-slate-400 mt-2 font-medium">across {history.length} drill{history.length !== 1 ? 's' : ''}</p>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <p class="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Mastered</p>
                <p class="text-5xl font-black text-blue-600">{masteredCount}</p>
                <p class="text-xs text-slate-400 mt-2 font-medium">concepts with zero recent failures</p>
            </div>

            <div class="bg-white rounded-2xl border {nemesisCount > 0 ? 'border-rose-200' : 'border-slate-200'} p-6 shadow-sm">
                <p class="text-xs font-black uppercase tracking-widest {nemesisCount > 0 ? 'text-rose-400' : 'text-slate-400'} mb-2">Nemesis Queue</p>
                <p class="text-5xl font-black {nemesisCount > 0 ? 'text-rose-600' : 'text-emerald-600'}">{nemesisCount}</p>
                <p class="text-xs text-slate-400 mt-2 font-medium">concepts fighting back</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100">
                    <h2 class="font-black text-slate-800 tracking-tight">Recent Drill Scores</h2>
                </div>

                {#if hi
