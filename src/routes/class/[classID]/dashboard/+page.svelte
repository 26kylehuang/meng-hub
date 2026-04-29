<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    export let data;
    $: ({ classDetails, thisWeeksFocus, allUnits, totalLessons, completedCount } = data);

    $: totalUnits = allUnits.length;
    $: completionPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
</script>

<div class="h-full overflow-y-auto bg-slate-900" in:fade>

    <div class="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800">
        <div class="absolute inset-0 pointer-events-none">
            <div class="absolute top-0 right-0 w-96 h-96 {classDetails.is_ap ? 'bg-rose-600/10' : 'bg-blue-600/10'} rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4"></div>
        </div>

        <div class="relative z-10 px-8 lg:px-16 py-12 lg:py-16">
            <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <div class="flex items-center gap-3 mb-4">
                        <span class="px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border
                            {classDetails.is_ap
                                ? 'bg-rose-600/20 text-rose-400 border-rose-500/30'
                                : 'bg-blue-600/20 text-blue-400 border-blue-500/30'}">
                            {classDetails.is_ap ? 'AP Archive' : 'Core Archive'}
                        </span>
                        <span class="text-xs font-bold text-slate-500">{totalUnits} units · {totalLessons} lessons</span>
                    </div>
                    <h1 class="text-4xl lg:text-5xl font-black tracking-tight text-white mb-3 leading-tight">
                        {classDetails.title}
                    </h1>
                    {#if classDetails.description}
                        <p class="text-slate-400 font-serif text-base lg:text-lg max-w-2xl leading-relaxed mb-4">
                            {classDetails.description}
                        </p>
                    {/if}
                    <div class="flex items-center gap-3 max-w-xs mt-2">
                        <div class="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div class="h-full rounded-full transition-all duration-500 {completionPct === 100 ? 'bg-emerald-500' : 'bg-blue-500'}"
                                style="width: {completionPct}%"></div>
                        </div>
                        <span class="text-xs font-black text-slate-500 shrink-0">{completedCount}/{totalLessons}</span>
                    </div>
                </div>

                <div class="flex gap-3 shrink-0">
                    <a href="/quiz/build"
                        class="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-900/40 whitespace-nowrap">
                        ⚡ Build Quiz
                    </a>
                    <a href="/progress"
                        class="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm rounded-xl border border-slate-700 transition-all whitespace-nowrap">
                        📊 My Progress
                    </a>
                </div>
            </div>
        </div>
    </div>

    <div class="px-8 lg:px-16 py-10">

        {#if thisWeeksFocus.length > 0}
            <section class="mb-12" in:fly={{ y: 10, duration: 300 }}>
                <h2 class="text-xs font-black text-amber-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block"></span>
                    This Week's Focus
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {#each thisWeeksFocus as lesson}
                        <a href="/class/{lesson.id}"
                            class="group block bg-slate-800/60 backdrop-blur-sm border border-amber-500/20 rounded-2xl p-5
                                hover:bg-slate-800 hover:border-amber-400/50 hover:-translate-y-0.5 transition-all">
                            <span class="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded inline-block mb-3">Priority</span>
                            <h3 class="text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">{lesson.title}</h3>
                            <p class="text-xs text-slate-500 mt-2 font-medium">Lesson {lesson.sequence_order}</p>
                        </a>
                    {/each}
                </div>
            </section>
        {/if}

        <section in:fly={{ y: 10, duration: 300, delay: 100 }}>
            <h2 class="text-xs font-black text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2">
                <span>📚</span> Course Index
            </h2>

            <div class="space-y-3">
                {#each allUnits as unit}
                    <div class="bg-slate-800/40 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-colors">
                        <div class="px-5 py-4 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <span class="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-black text-slate-400 shrink-0">
                                    {unit.sequence_order}
                                </span>
                                <h3 class="font-bold text-slate-200 text-sm">{unit.title}</h3>
                            </div>
                            <span class="text-xs text-slate-600 font-medium">{unit.lessons?.length ?? 0} lessons</span>
                        </div>

                        <div class="px-3 pb-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {#each (unit.lessons ?? []) as lesson}
                                <a href="/class/{lesson.id}"
                                    class="group flex items-center gap-3 p-3 bg-slate-900/60 rounded-xl border
                                        {lesson.is_completed
                                            ? 'border-emerald-500/30 hover:border-emerald-400/50'
                                            : 'border-slate-800 hover:border-blue-500/40'}
                                        hover:bg-slate-800 transition-all">
                                    <span class="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 transition-all
                                        {lesson.is_completed
                                            ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                                            : 'bg-slate-800 border border-slate-700 text-slate-500 group-hover:bg-blue-600/20 group-hover:border-blue-500/50 group-hover:text-blue-400'}">
                                        {lesson.is_completed ? '✓' : lesson.sequence_order}
                                    </span>
                                    <span class="text-xs font-medium leading-snug line-clamp-2 transition-colors
                                        {lesson.is_completed ? 'text-emerald-300/70' : 'text-slate-400 group-hover:text-slate-200'}">
                                        {lesson.title}
                                    </span>
                                </a>
                            {/each}
                        </div>
                    </div>
                {/each}

                {#if allUnits.length === 0}
                    <div class="text-center py-16 border-2 border-dashed border-slate-800 rounded-2xl text-slate-600">
                        <p class="font-bold text-sm">No content yet.</p>
                        <p class="text-xs mt-1">Use the AI Forge to populate this class.</p>
                    </div>
                {/if}
            </div>
        </section>
    </div>
</div>
