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

                {#if history.length === 0}
                    <div class="px-6 py-12 text-center text-slate-400">
                        <p class="font-bold text-sm">No drills yet.</p>
                        <p class="text-xs mt-1">Open a lesson and take a practice quiz.</p>
                    </div>
                {:else}
                    <div class="px-6 pt-6 pb-2 flex items-end gap-1.5 h-28">
                        {#each sparkScores as score}
                            <div class="flex-1 flex flex-col items-center gap-1">
                                <div class="w-full rounded-t {barColor(score)}" style="height: {Math.max(4, (score / 100) * 72)}px"></div>
                            </div>
                        {/each}
                    </div>
                    <div class="px-6 pb-1 flex gap-1.5">
                        {#each sparkScores as score}
                            <div class="flex-1 text-center text-[9px] font-bold text-slate-400">{score}%</div>
                        {/each}
                    </div>
                    <div class="divide-y divide-slate-100 mt-2">
                        {#each history.slice(0, 8) as row (row.id)}
                            <a href="/class/{row.lesson_id}" class="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors">
                                <div class="min-w-0">
                                    <p class="text-sm font-bold text-slate-800 truncate">{row.lessons?.title ?? 'Lesson'}</p>
                                    <p class="text-xs text-slate-400">{timeSince(row.completed_at)}</p>
                                </div>
                                <span class="text-base font-black ml-4 {scoreColor(row.score)}">{row.score}%</span>
                            </a>
                        {/each}
                    </div>
                {/if}
            </div>

            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 class="font-black text-slate-800 tracking-tight">Active Nemeses</h2>
                    {#if nemesisCount > 0}
                        <a href="/quiz/nemesis-mode" class="text-xs font-black text-white bg-rose-600 hover:bg-rose-500 px-4 py-1.5 rounded-lg transition-colors">
                            ⚔️ Drill Now
                        </a>
                    {/if}
                </div>

                {#if activeNemesis.length === 0}
                    <div class="px-6 py-12 text-center text-slate-400">
                        <span class="text-3xl block mb-3">✨</span>
                        <p class="font-bold text-sm">Queue is clear!</p>
                        <p class="text-xs mt-1">Take more quizzes to track your weak spots.</p>
                    </div>
                {:else}
                    <div class="divide-y divide-slate-100">
                        {#each activeNemesis as row (row.block_id)}
                            <div class="flex items-center justify-between px-6 py-3">
                                <div class="min-w-0">
                                    <p class="text-sm font-bold text-slate-800 truncate">{row.blocks?.lessons?.title ?? 'Unknown Lesson'}</p>
                                    <p class="text-xs text-slate-400 mt-0.5">{row.blocks?.content_json?.topic ?? 'General concept'}</p>
                                </div>
                                <div class="ml-4 shrink-0 flex items-center gap-1.5">
                                    {#each Array(Math.min(row.consecutive_fails, 5)) as _}
                                        <span class="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                                    {/each}
                                    <span class="text-xs font-black text-rose-600 ml-1">{row.consecutive_fails}✗</span>
                                </div>
                            </div>
                        {/each}
                    </div>

                    {#if nemesisCount > 0}
                        <div class="p-5 bg-rose-50 border-t border-rose-100">
                            <a href="/quiz/nemesis-mode"
                                class="block w-full py-3 rounded-xl font-black text-sm text-center bg-rose-600 text-white hover:bg-rose-500 hover:-translate-y-0.5 transition-all shadow-md shadow-rose-200">
                                ⚔️ Conquer Your Nemesis ({nemesisCount} question{nemesisCount !== 1 ? 's' : ''})
                            </a>
                        </div>
                    {/if}
                {/if}
            </div>
        </div>
    </div>
</div>
