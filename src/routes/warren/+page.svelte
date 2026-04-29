<script lang="ts">
    import { enhance } from '$app/forms';
    import { fade } from 'svelte/transition';

    export let data;
    export let form: any;

    $: ({ globalJobs, myJobs, reviewQueue } = data);

    let activeTab: 'board' | 'mine' | 'review' = 'board';

    function jobLabel(job: any): string {
        const cls = job.lessons?.units?.classes?.title ?? '';
        const lesson = job.lessons?.title ?? job.lesson_id?.slice(0, 8) ?? '—';
        return cls ? `${cls} › ${lesson}` : lesson;
    }

    function typeColor(type: string): string {
        const map: Record<string, string> = {
            math: 'bg-purple-100 text-purple-700', paragraph: 'bg-blue-100 text-blue-700',
            video: 'bg-emerald-100 text-emerald-700', timeline: 'bg-amber-100 text-amber-700',
            cloze: 'bg-rose-100 text-rose-700', quiz: 'bg-emerald-100 text-emerald-700',
            frq: 'bg-orange-100 text-orange-700', summary: 'bg-blue-800 text-blue-100',
            tip: 'bg-amber-100 text-amber-700', table: 'bg-indigo-100 text-indigo-700',
        };
        return map[type] ?? 'bg-slate-100 text-slate-600';
    }
</script>

<div class="h-full flex flex-col overflow-hidden bg-dashboard text-slate-800" in:fade>

    <div class="bg-white border-b border-slate-200 px-6 pt-5 shrink-0">
        <div class="flex items-center justify-between mb-4">
            <div>
                <h1 class="text-xl font-black text-slate-900 tracking-tight">Warren Board</h1>
                <p class="text-xs text-slate-400 font-medium mt-0.5">Claim, edit, and publish AI-drafted content</p>
            </div>
            <a href="/concepts" class="text-xs font-black px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors">
                🌐 Zettelkasten →
            </a>
        </div>
        <div class="flex gap-1 border-b border-slate-100 -mb-px">
            {#each [
                ['board', `📋 Job Board (${globalJobs.length})`],
                ['mine',  `🔨 My Tasks (${myJobs.length})`],
                ['review', `🔍 Review Assist (${reviewQueue.length})`],
            ] as [tab, label]}
                <button on:click={() => activeTab = tab}
                    class="px-4 py-2.5 text-sm font-bold transition-colors border-b-2 -mb-px whitespace-nowrap
                        {activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'}">
                    {label}
                </button>
            {/each}
        </div>
    </div>

    {#if form?.error}
        <div class="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-bold">
            {form.error}
        </div>
    {/if}

    <div class="flex-1 overflow-y-auto p-6">

        {#if activeTab === 'board'}
            {#if globalJobs.length === 0}
                <div class="text-center text-slate-400 py-16">
                    <p class="text-2xl mb-3">✅</p>
                    <p class="font-bold text-sm">No unclaimed jobs right now.</p>
                    <p class="text-xs mt-1">Check back after the AI Forge runs and admin approves.</p>
                </div>
            {:else}
                <div class="space-y-3">
                    {#each globalJobs as job (job.id)}
                        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex justify-between items-center gap-4" in:fade>
                            <div class="min-w-0">
                                <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded {typeColor(job.type)}">{job.type}</span>
                                    <span class="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Ready</span>
                                </div>
                                <h3 class="font-bold text-slate-800 text-sm truncate">{jobLabel(job)}</h3>
                                <p class="text-xs text-slate-400 mt-0.5 font-mono">{job.id.slice(0, 8)}…</p>
                            </div>
                            <form method="POST" action="?/claim" use:enhance class="shrink-0">
                                <input type="hidden" name="block_id" value={job.id}>
                                <button type="submit" class="bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm whitespace-nowrap">
                                    Claim Task
                                </button>
                            </form>
                        </div>
                    {/each}
                </div>
            {/if}

        {:else if activeTab === 'mine'}
            {#if myJobs.length === 0}
                <div class="text-center text-slate-400 py-16">
                    <p class="font-bold text-sm">No active tasks.</p>
                    <p class="text-xs mt-1">Claim a task from the Job Board to get started.</p>
                </div>
            {:else}
                <div class="space-y-3">
                    {#each myJobs as job (job.id)}
                        <div class="bg-white border-2 border-amber-200 rounded-2xl p-4 shadow-sm relative overflow-hidden" in:fade>
                            <div class="absolute top-0 left-0 w-full h-1 bg-amber-400 rounded-t-2xl"></div>
                            <div class="flex items-center gap-2 mb-2 mt-1 flex-wrap">
                                <span class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded {typeColor(job.type)}">{job.type}</span>
                                {#if job.status === 'in_review'}
                                    <span class="text-[10px] font-black uppercase tracking-widest bg-purple-100 text-purple-700 px-2 py-0.5 rounded">In Review</span>
                                {/if}
                            </div>
                            <h3 class="font-bold text-slate-800 text-sm mb-0.5">{jobLabel(job)}</h3>
                            {#if job.due_date}
                                <p class="text-xs text-amber-600 font-bold mb-3">Due {new Date(job.due_date).toLocaleDateString()}</p>
                            {/if}
                            <div class="flex gap-2 mt-3">
                                <a href="/warren/block?id={job.id}"
                                    class="flex-1 text-center bg-blue-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-blue-500 transition-colors">
                                    ✏️ Edit & Publish
                                </a>
                                <form method="POST" action="?/drop" use:enhance>
                                    <input type="hidden" name="block_id" value={job.id}>
                                    <button type="submit" class="bg-rose-50 text-rose-600 text-xs font-bold px-3 py-2.5 rounded-xl hover:bg-rose-100 transition-colors border border-rose-200">
                                        Drop
                                    </button>
                                </form>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}

        {:else}
            <div class="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-800">
                🔍 These blocks are awaiting admin approval. You can pre-edit them to save admin review time.
            </div>

            {#if reviewQueue.length === 0}
                <div class="text-center text-slate-400 py-16">
                    <p class="font-bold text-sm">Review queue is empty.</p>
                </div>
            {:else}
                <div class="space-y-3">
                    {#each reviewQueue as job (job.id)}
                        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm" in:fade>
                            {#if job.review_instruction}
                                <div class="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-800">
                                    🔄 Admin re-edit note: "{job.review_instruction}"
                                </div>
                            {/if}
                            <div class="flex items-center justify-between gap-4">
                                <div class="min-w-0">
                                    <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                                        <span class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded {typeColor(job.type)}">{job.type}</span>
                                        <span class="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Pending Review</span>
                                    </div>
                                    <h3 class="font-bold text-slate-800 text-sm truncate">{jobLabel(job)}</h3>
                                </div>
                                <a href="/warren/block?id={job.id}"
                                    class="shrink-0 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all whitespace-nowrap">
                                    ✏️ Pre-Edit
                                </a>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        {/if}
    </div>
</div>
