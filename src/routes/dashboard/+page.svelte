<script lang="ts">
    import { fade } from 'svelte/transition';
    export let data;
    $: ({ session, nemesisCount, masteredCount, lessonsCompleted, recentProgress, apClasses, coreClasses } = data);

    const allClasses = [...(apClasses ?? []), ...(coreClasses ?? [])];
    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 18) return 'Good afternoon';
        return 'Good evening';
    })();
    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
</script>

<div class="h-full overflow-y-auto bg-dashboard" in:fade>
    <div class="max-w-5xl mx-auto px-8 py-12">

        <header class="mb-12">
            <p class="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">{greeting} · {todayStr}</p>
            <h1 class="text-4xl font-black text-slate-900 tracking-tight">
                {session?.user?.email?.split('@')[0] ?? 'Scholar'} <span class="text-blue-600 font-serif">梦</span>
            </h1>
            <p class="text-slate-500 mt-2 font-medium">Your command center. Track, drill, conquer.</p>
            <a href="/tutorial" class="inline-block mt-3 text-xs font-bold text-blue-600 hover:underline">
                📖 View tutorial →
            </a>
        </header>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">

            <a href="/progress" class="group block rounded-2xl p-6 transition-all hover:-translate-y-0.5
                {nemesisCount > 0
                    ? 'bg-rose-950 border border-rose-800 shadow-lg shadow-rose-900/30 animate-pulse-glow-rose'
                    : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'}">
                <p class="text-xs font-black uppercase tracking-widest mb-2 {nemesisCount > 0 ? 'text-rose-400' : 'text-slate-400'}">Nemesis Queue</p>
                <p class="text-5xl font-black {nemesisCount > 0 ? 'text-rose-400' : 'text-emerald-600'}">{nemesisCount}</p>
                <p class="text-sm mt-2 font-medium {nemesisCount > 0 ? 'text-rose-300/70' : 'text-slate-500'}">
                    {nemesisCount > 0 ? 'concepts still unmastered' : 'queue clear — excellent work'}
                </p>
                {#if nemesisCount > 0}
                    <span class="mt-4 inline-block text-xs font-black text-rose-400 group-hover:underline">⚔️ Conquer now →</span>
                {/if}
            </a>

            <div class="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-lg shadow-blue-900/20">
                <p class="text-xs font-black uppercase tracking-widest text-blue-200 mb-2">Lessons Read</p>
                <p class="text-5xl font-black text-white">{lessonsCompleted}</p>
                <p class="text-sm text-blue-200/70 mt-2 font-medium">
                    {masteredCount > 0 ? `${masteredCount} concept${masteredCount !== 1 ? 's' : ''} mastered` : 'lessons marked complete'}
                </p>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <p class="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Archives Available</p>
                <p class="text-5xl font-black text-slate-800">{allClasses.length}</p>
                <p class="text-sm text-slate-500 mt-2 font-medium">classes across AP and Core subjects</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

            <section class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 class="font-black text-slate-800 tracking-tight">Recent Drills</h2>
                    <a href="/progress" class="text-xs font-bold text-blue-600 hover:underline">View all →</a>
                </div>
                <div class="divide-y divide-slate-100">
                    {#if recentProgress.length === 0}
                        <div class="px-6 py-8 text-center text-slate-400">
                            <p class="font-bold text-sm">No quiz history yet.</p>
                            <p class="text-xs mt-1">Open a lesson and take a practice quiz to start tracking.</p>
                        </div>
                    {:else}
                        {#each recentProgress as row}
                            <a href="/class/{row.lesson_id}" class="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                                <div>
                                    <p class="text-sm font-bold text-slate-800">{row.lessons?.title ?? 'Lesson'}</p>
                                    <p class="text-xs text-slate-400 mt-0.5">{new Date(row.completed_at).toLocaleDateString()}</p>
                                </div>
                                <span class="text-lg font-black {row.score >= 80 ? 'text-emerald-600' : row.score >= 60 ? 'text-amber-500' : 'text-rose-500'}">
                                    {row.score}%
                                </span>
                            </a>
                        {/each}
                    {/if}
                </div>
            </section>

            <section class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100">
                    <h2 class="font-black text-slate-800 tracking-tight">Your Archives</h2>
                </div>
                <div class="divide-y divide-slate-100">
                    {#if allClasses.length === 0}
                        <div class="px-6 py-8 text-center text-slate-400">
                            <p class="font-bold text-sm">No classes found.</p>
                            <p class="text-xs mt-1">Admins: add classes in Supabase.</p>
                        </div>
                    {:else}
                        {#each allClasses as cls}
                            <a href="/class/{cls.id}/dashboard" class="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group">
                                <div class="flex items-center gap-3">
                                    <span class="text-xs font-black px-2 py-0.5 rounded {cls.is_ap ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}">
                                        {cls.is_ap ? 'AP' : 'Core'}
                                    </span>
                                    <span class="text-sm font-bold text-slate-700">{cls.title}</span>
                                </div>
                                <span class="text-slate-300 group-hover:text-slate-500 transition-colors font-bold text-sm">→</span>
                            </a>
                        {/each}
                    {/if}
                </div>
            </section>
        </div>

        {#if nemesisCount > 0}
            <div class="mt-8 bg-rose-950 border border-rose-800 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 animate-pulse-glow-rose" in:fade>
                <div>
                    <p class="text-xs font-black uppercase tracking-widest text-rose-400 mb-1">Nemesis Engine</p>
                    <h3 class="text-2xl font-black text-white tracking-tight">
                        {nemesisCount} concept{nemesisCount !== 1 ? 's' : ''} fighting back.
                    </h3>
                    <p class="text-rose-300 text-sm mt-1 font-medium">
                        These are your hardest repeated misses — prioritized by fail count.
                    </p>
                </div>
                <a href="/quiz/nemesis-mode"
                    class="shrink-0 bg-rose-600 hover:bg-rose-500 text-white font-black px-8 py-4 rounded-xl shadow-lg shadow-rose-900/50 hover:-translate-y-0.5 transition-all whitespace-nowrap">
                    ⚔️ Conquer Now
                </a>
            </div>
        {/if}

    </div>
</div>
