<script lang="ts">
    import { enhance } from '$app/forms';
    import { fade } from 'svelte/transition';

    export let data;
    export let form: any;

    $: ({ feedback, metrics, lowScoreLessons } = data);
    let expanded: 'feedback' | 'stats' | 'content' = 'feedback';

    const issueLabels: Record<string, { label: string, color: string }> = {
        wrong_answer:          { label: 'Wrong Answer',    color: 'bg-rose-100 text-rose-700' },
        confusing_explanation: { label: 'Confusing Logic', color: 'bg-amber-100 text-amber-700' },
        typo:                  { label: 'Typo / Format',   color: 'bg-slate-100 text-slate-600' },
        factual_error:         { label: 'Factual Error',   color: 'bg-red-100 text-red-800' },
        broken_math:           { label: 'Broken Math',     color: 'bg-purple-100 text-purple-700' },
        other:                 { label: 'Other',           color: 'bg-slate-100 text-slate-600' },
    };

    function breadcrumb(row: any): string {
        const cls = row.lessons?.units?.classes?.title ?? '';
        const les = row.lessons?.title ?? row.lesson_id?.slice(0, 8) ?? '—';
        return [cls, les].filter(Boolean).join(' › ');
    }

    function timeSince(dateStr: string): string {
        const diff = Date.now() - new Date(dateStr).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 60) return `${m}m ago`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    }
</script>

<div class="h-full bg-slate-900 p-6 flex gap-4 overflow-hidden">

    <!-- PANEL 1: Feedback Inbox -->
    <button on:click={() => expanded = 'feedback'}
        class="transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] rounded-3xl shadow-xl border border-white/10 flex flex-col overflow-hidden bg-slate-800/60 backdrop-blur-sm text-left
            {expanded === 'feedback' ? 'flex-[3]' : 'w-20 shrink-0 opacity-60 hover:opacity-100'}">

        <div class="p-5 bg-rose-900/30 border-b border-rose-800/40 flex items-center gap-3 shrink-0 whitespace-nowrap">
            <span class="text-2xl shrink-0">📥</span>
            {#if expanded === 'feedback'}
                <div class="flex items-start justify-between gap-2 flex-1" in:fade>
                    <div>
                        <h2 class="text-lg font-black text-rose-300 tracking-tight">Feedback Inbox</h2>
                        <p class="text-xs text-rose-400 font-bold">{feedback.length} unresolved</p>
                    </div>
                    {#if feedback.length > 1}
                        <form method="POST" action="?/resolveAll" use:enhance class="shrink-0">
                            <button type="submit" class="text-[10px] font-black px-2.5 py-1.5 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors">
                                Clear All ✓
                            </button>
                        </form>
                    {/if}
                </div>
            {/if}
        </div>

        {#if expanded === 'feedback'}
            <div class="flex-1 overflow-y-auto p-5 space-y-3" in:fade>
                {#if feedback.length === 0}
                    <div class="text-center py-16 text-slate-400">
                        <p class="text-2xl mb-3">✅</p>
                        <p class="font-bold text-sm">Inbox clear!</p>
                    </div>
                {:else}
                    {#each feedback as row (row.id)}
                        <div class="bg-slate-900/50 border border-rose-900/40 rounded-2xl p-4 flex justify-between items-start gap-4" in:fade>
                            <div class="min-w-0">
                                <div class="flex items-center gap-2 mb-2 flex-wrap">
                                    {#if issueLabels[row.issue_type]}
                                        <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded {issueLabels[row.issue_type].color}">
                                            {issueLabels[row.issue_type].label}
                                        </span>
                                    {/if}
                                    <span class="text-[10px] text-slate-400 font-mono">{row.block_id?.slice(0, 8)}…</span>
                                </div>
                                <p class="font-bold text-slate-200 text-sm truncate">{breadcrumb(row)}</p>
                                <p class="text-xs text-slate-500 mt-0.5">
                                    {row.profiles?.full_name ?? row.profiles?.email ?? 'Anonymous'} · {timeSince(row.created_at)}
                                    {#if row.page_url}<span class="ml-1 font-mono text-slate-600">· {row.page_url}</span>{/if}
                                </p>
                                {#if row.note}
                                    <p class="text-xs text-amber-200 font-serif mt-1.5 p-2 bg-amber-900/30 border border-amber-700/40 rounded-lg leading-snug">
                                        "{row.note}"
                                    </p>
                                {/if}
                            </div>
                            <div class="flex flex-col gap-2 shrink-0">
                                <a href="/class/{row.lesson_id}"
                                    class="text-xs font-bold px-4 py-2 bg-slate-700 text-white rounded-xl hover:bg-blue-600 transition-colors text-center">
                                    View Block
                                </a>
                                <form method="POST" action="?/resolve" use:enhance>
                                    <input type="hidden" name="feedback_id" value={row.id}>
                                    <button type="submit"
                                        class="w-full text-xs font-bold px-4 py-2 bg-emerald-900/40 text-emerald-300 border border-emerald-700/40 rounded-xl hover:bg-emerald-800/40 transition-colors">
                                        Resolve ✓
                                    </button>
                                </form>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        {/if}
    </button>

    <!-- PANEL 2: Platform Metrics -->
    <button on:click={() => expanded = 'stats'}
        class="transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] rounded-3xl shadow-xl border border-white/10 flex flex-col overflow-hidden bg-slate-800/60 backdrop-blur-sm text-left
            {expanded === 'stats' ? 'flex-[3]' : 'w-20 shrink-0 opacity-60 hover:opacity-100'}">

        <div class="p-5 bg-blue-900/30 border-b border-blue-800/40 flex items-center gap-3 shrink-0 whitespace-nowrap">
            <span class="text-2xl shrink-0">📈</span>
            {#if expanded === 'stats'}
                <h2 class="text-lg font-black text-blue-300 tracking-tight" in:fade>Platform Metrics</h2>
            {/if}
        </div>

        {#if expanded === 'stats'}
            <div class="flex-1 overflow-y-auto p-6" in:fade>
                <div class="grid grid-cols-2 gap-4 mb-8">
                    {#each [
                        { label: 'Total Users',    value: metrics.totalUsers,    color: 'text-blue-400' },
                        { label: 'Total Blocks',   value: metrics.totalBlocks,   color: 'text-slate-200' },
                        { label: 'Pending Review', value: metrics.pendingReview, color: 'text-amber-400' },
                        { label: 'Warren Drafts',  value: metrics.draftBlocks,   color: 'text-purple-400' },
                        { label: 'Quizzes Taken',  value: metrics.totalQuizzes,  color: 'text-emerald-400' },
                    ] as stat}
                        <div class="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-5">
                            <p class="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                            <p class="text-4xl font-black {stat.color}">{stat.value ?? 0}</p>
                        </div>
                    {/each}
                </div>

                {#if lowScoreLessons.length > 0}
                    <div class="p-5 bg-amber-900/30 border border-amber-700/40 rounded-2xl">
                        <div class="flex items-center gap-3 mb-4">
                            <span class="text-xl">⚠️</span>
                            <div>
                                <h3 class="font-black text-amber-300">Low-Score Anomalies</h3>
                                <p class="text-xs text-amber-500 font-medium">Lessons with recent scores below 60%</p>
                            </div>
                        </div>
                        <div class="space-y-2">
                            {#each lowScoreLessons as row}
                                <a href="/class/{row.lesson_id}"
                                    class="flex items-center justify-between p-3 bg-slate-800/60 border border-amber-700/30 rounded-xl hover:border-amber-500/50 transition-colors">
                                    <span class="text-sm font-bold text-slate-200 truncate">{row.lessons?.title ?? 'Unknown'}</span>
                                    <span class="text-sm font-black text-rose-400 ml-2">{row.score}%</span>
                                </a>
                            {/each}
                        </div>
                    </div>
                {:else}
                    <div class="p-5 bg-emerald-900/30 border border-emerald-700/40 rounded-2xl text-center">
                        <p class="font-black text-emerald-300">No anomalies detected.</p>
                        <p class="text-xs text-emerald-400 font-medium mt-1">All recent quiz scores are above 60%.</p>
                    </div>
                {/if}
            </div>
        {/if}
    </button>

    <!-- PANEL 3: Engine Room -->
    <button on:click={() => expanded = 'content'}
        class="transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] rounded-3xl shadow-xl border border-white/10 flex flex-col overflow-hidden bg-slate-800/60 backdrop-blur-sm text-left
            {expanded === 'content' ? 'flex-[3]' : 'w-20 shrink-0 opacity-60 hover:opacity-100'}">

        <div class="p-5 bg-emerald-900/30 border-b border-emerald-800/40 flex items-center gap-3 shrink-0 whitespace-nowrap">
            <span class="text-2xl shrink-0">⚙️</span>
            {#if expanded === 'content'}
                <h2 class="text-lg font-black text-emerald-300 tracking-tight" in:fade>AI Forge Menu</h2>
            {/if}
        </div>

        {#if expanded === 'content'}
            <div class="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center text-center" in:fade>
                <span class="text-5xl mb-5 block">⚒️</span>
                <h3 class="text-2xl font-black text-white tracking-tight mb-2">The Engine Room</h3>
                <p class="text-slate-400 mb-8 font-medium max-w-sm leading-relaxed">
                    Access 3-Loop OpenRouter pipelines, process curved PDFs, and manage Zettelkasten logic.
                </p>
                <div class="space-y-3 w-full max-w-xs">
                    <a href="/review" class="block bg-amber-500 text-white font-black px-8 py-4 rounded-xl shadow-lg hover:bg-amber-400 hover:-translate-y-0.5 transition-all">
                        🔍 Review Queue →
                    </a>
                    <a href="/forge" class="block bg-slate-900 text-white font-black px-8 py-4 rounded-xl shadow-lg hover:bg-slate-800 hover:-translate-y-0.5 transition-all border border-slate-700">
                        Enter Content Forge →
                    </a>
                    <a href="/warren" class="block bg-slate-700 text-slate-200 font-bold px-8 py-3 rounded-xl border border-slate-600 hover:bg-slate-600 transition-colors">
                        View Warren Job Board
                    </a>
                </div>
                {#if metrics?.draftBlocks > 0}
                    <div class="mt-8 inline-flex items-center gap-2 bg-amber-900/30 border border-amber-700/40 text-amber-300 text-sm font-bold px-4 py-2 rounded-full">
                        <span class="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                        {metrics.draftBlocks} draft block{metrics.draftBlocks !== 1 ? 's' : ''} awaiting Warren review
                    </div>
                {/if}
            </div>
        {/if}
    </button>
</div>
