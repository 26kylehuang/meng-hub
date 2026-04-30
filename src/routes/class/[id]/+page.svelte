<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import BlockRenderer from '$lib/BlockRenderer.svelte';
    import Simulator from '$lib/Simulator.svelte';
    import Scratchpad from '$lib/Scratchpad.svelte';
    import ConceptPicker from '$lib/ConceptPicker.svelte';
    import { supabase } from '$lib/supabase';

    export let data;
    $: ({ lesson, blocks, quizSourceBlocks, navUnits } = data);

    const QUIZ_META: Record<string, { label: string, icon: string, color: string, description: string }> = {
        lesson:       { label: 'Lesson Notes',     icon: '📖', color: 'blue',   description: 'Reading & practice' },
        lesson_quiz:  { label: 'Lesson Check',     icon: '✏️',  color: 'blue',  description: `~${lesson?.quiz_time_minutes ?? 8} min · ${lesson?.quiz_question_count ?? 5} questions` },
        chapter_quiz: { label: 'Chapter Quiz',     icon: '📋', color: 'amber',  description: `~${lesson?.quiz_time_minutes ?? 20} min · ${lesson?.quiz_question_count ?? 15} questions` },
        unit_quiz:    { label: 'Unit Exam',         icon: '🎯', color: 'rose',  description: `~${lesson?.quiz_time_minutes ?? 45} min · ${lesson?.quiz_question_count ?? 30} questions` },
        ap_exam:      { label: 'AP Practice Exam',  icon: '🏆', color: 'purple',description: 'Full exam simulation · Timed' },
    };

    $: lessonType = lesson?.lesson_type ?? 'lesson';
    $: isAssessment = lessonType !== 'lesson';
    $: meta = QUIZ_META[lessonType] ?? QUIZ_META.lesson;
    $: classId = lesson?.units?.classes?.id ?? null;

    $: quizQuestions = (quizSourceBlocks ?? [])
        .filter((b: any) => b.content_json?.question_text || b.content_json?.parts)
        .map((b: any) => ({ ...b.content_json, block_id: b.id, lesson_id: lesson?.id }));

    $: displayQuestions = lessonType === 'ap_exam'
        ? quizQuestions.slice(0, lesson?.quiz_question_count ?? 55)
        : lessonType === 'unit_quiz'
        ? quizQuestions.slice(0, lesson?.quiz_question_count ?? 30)
        : lessonType === 'chapter_quiz'
        ? quizQuestions.slice(0, lesson?.quiz_question_count ?? 15)
        : quizQuestions.slice(0, lesson?.quiz_question_count ?? 999);

    let quizMode = false;
    let quizLaunched = false;
    let scratchpadOpen = false;
    let conceptSearchOpen = false;
    let spotlightContent: any = null;
    let readingProgress = 0;
    let centerPane: HTMLElement;
    let isCompleted = false;
    let markingComplete = false;
    let expandedUnits: Set<string> = new Set();

    $: if (lesson && navUnits) {
        const parentUnit = navUnits.find((u: any) => u.lessons?.some((l: any) => l.id === lesson.id));
        if (parentUnit) expandedUnits = new Set([parentUnit.id]);
    }

    $: if (isAssessment && !quizLaunched) { quizMode = true; quizLaunched = true; }

    function toggleUnit(unitId: string) {
        const next = new Set(expandedUnits);
        next.has(unitId) ? next.delete(unitId) : next.add(unitId);
        expandedUnits = next;
    }

    $: estimatedMinutes = Math.max(1, Math.ceil(
        (blocks ?? []).reduce((w: number, b: any) => {
            return w + (b.content ?? JSON.stringify(b.content_json) ?? '').split(/\s+/).length;
        }, 0) / 200
    ));

    $: flatLessons = (navUnits ?? []).flatMap((u: any) => u.lessons ?? []);
    $: currentIdx  = flatLessons.findIndex((l: any) => l.id === lesson?.id);
    $: prevLesson  = currentIdx > 0 ? flatLessons[currentIdx - 1] : null;
    $: nextLesson  = currentIdx < flatLessons.length - 1 ? flatLessons[currentIdx + 1] : null;

    function toggleQuiz() { quizMode = !quizMode; }

    function onScroll() {
        if (!centerPane) return;
        const { scrollTop, scrollHeight, clientHeight } = centerPane;
        readingProgress = scrollHeight <= clientHeight
            ? 100
            : Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
    }

    function onKeydown(e: KeyboardEvent) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        if (e.key === 'ArrowRight' && nextLesson) window.location.href = `/class/${nextLesson.id}`;
        if (e.key === 'ArrowLeft'  && prevLesson) window.location.href = `/class/${prevLesson.id}`;
    }

    async function checkCompletion() {
        const session = $page.data.session;
        if (!session || !lesson?.id) return;
        const { data: row } = await supabase.from('lesson_completions')
            .select('id').eq('user_id', session.user.id).eq('lesson_id', lesson.id).single();
        isCompleted = !!row;
    }

    async function markComplete() {
        const session = $page.data.session;
        if (!session || !lesson?.id || isCompleted) return;
        markingComplete = true;
        await supabase.from('lesson_completions').upsert(
            { user_id: session.user.id, lesson_id: lesson.id, completed_at: new Date().toISOString() },
            { onConflict: 'user_id,lesson_id' }
        );
        isCompleted = true;
        markingComplete = false;
    }

    onMount(() => {
        checkCompletion();
        window.addEventListener('keydown', onKeydown);
        return () => window.removeEventListener('keydown', onKeydown);
    });

    const tierBg: Record<string, string> = {
        lesson_quiz: 'bg-blue-900', chapter_quiz: 'bg-amber-900',
        unit_quiz: 'bg-rose-900', ap_exam: 'bg-purple-900',
    };
    const tierBorder: Record<string, string> = {
        lesson_quiz: 'border-blue-700', chapter_quiz: 'border-amber-700',
        unit_quiz: 'border-rose-700', ap_exam: 'border-purple-700',
    };
</script>

<div class="flex h-full w-full overflow-hidden">

    <nav class="hidden xl:flex w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex-col overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-800 shrink-0">
            <a href="/class/{lesson?.units?.classes?.id}/dashboard"
                class="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors block mb-1">
                ← {lesson?.units?.classes?.title ?? 'Back'}
            </a>
            <p class="text-xs font-bold text-slate-400 truncate">{lesson?.units?.title ?? ''}</p>
        </div>

        <div class="flex-1 overflow-y-auto scrollbar-hide py-3">
            {#each (navUnits ?? []) as unit (unit.id)}
                <div class="mb-1">
                    <button on:click={() => toggleUnit(unit.id)}
                        class="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-800 transition-colors group">
                        <span class="text-xs font-black text-slate-400 group-hover:text-slate-200 uppercase tracking-wider truncate pr-2">{unit.title}</span>
                        <span class="text-slate-600 group-hover:text-slate-400 shrink-0 transition-transform {expandedUnits.has(unit.id) ? 'rotate-90' : ''}">›</span>
                    </button>
                    {#if expandedUnits.has(unit.id)}
                        <div in:fade={{ duration: 150 }}>
                            {#each (unit.lessons ?? []) as l (l.id)}
                                {@const isQuizType = l.lesson_type !== 'lesson'}
                                <a href="/class/{l.id}"
                                    class="flex items-center gap-2 pl-5 pr-4 py-2 text-xs font-medium transition-colors
                                        {l.id === lesson?.id
                                            ? 'bg-blue-600/20 text-blue-300 border-r-2 border-blue-500'
                                            : 'text-slate-500 hover:bg-slate-800 hover:text-slate-200'}">
                                    <span class="shrink-0 text-[10px] font-black flex items-center justify-center w-5">
                                        {l.lesson_type === 'ap_exam' ? '🏆' :
                                         l.lesson_type === 'unit_quiz' ? '🎯' :
                                         l.lesson_type === 'chapter_quiz' ? '📋' :
                                         l.lesson_type === 'lesson_quiz' ? '✏️' : l.sequence_order}
                                    </span>
                                    <span class="truncate leading-tight {isQuizType ? 'font-bold' : ''}">{l.title}</span>
                                </a>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>

        <div class="px-4 py-3 border-t border-slate-800 shrink-0 flex justify-between text-[10px] font-bold text-slate-600">
            <span class="{prevLesson ? 'text-slate-400' : 'opacity-30'}">← Prev</span>
            <span class="text-slate-700">arrow keys</span>
            <span class="{nextLesson ? 'text-slate-400' : 'opacity-30'}">Next →</span>
        </div>
    </nav>

    <div bind:this={centerPane} on:scroll={onScroll}
        class="flex-1 overflow-y-auto scrollbar-hide relative transition-all duration-500 bg-archive
            {quizMode && !isAssessment ? 'blur-md pointer-events-none select-none opacity-40' : ''}">

        <div class="fixed top-0 left-0 right-0 h-0.5 bg-slate-200 z-30 xl:left-64">
            <div class="h-full transition-all duration-150 {
                lessonType === 'ap_exam' ? 'bg-purple-500' :
                lessonType === 'unit_quiz' ? 'bg-rose-500' :
                lessonType === 'chapter_quiz' ? 'bg-amber-500' :
                'bg-blue-500'}" style="width: {readingProgress}%"></div>
        </div>

        <div class="max-w-3xl mx-auto py-12 px-8 sm:px-12 lg:py-16 lg:px-16">

            {#if isAssessment}
                <div class="mb-8 p-5 rounded-2xl border {tierBg[lessonType]} {tierBorder[lessonType]}" in:fly={{ y: -10 }}>
                    <div class="flex items-center gap-3 mb-2">
                        <span class="text-3xl">{meta.icon}</span>
                        <div>
                            <p class="font-black text-white text-lg">{meta.label}</p>
                            <p class="text-sm font-medium opacity-70 text-white">{meta.description}</p>
                        </div>
                    </div>
                    <p class="text-sm text-white/70 font-serif">
                        {lessonType === 'ap_exam' ? 'Full-length AP practice exam. No hints. Timed.' :
                         lessonType === 'unit_quiz' ? 'Covers all lessons in this unit.' :
                         lessonType === 'chapter_quiz' ? 'Covers all lessons in this chapter. Review your notes first.' :
                         'Quick check on the lesson you just read. 5-10 questions.'}
                    </p>
                    {#if !quizMode}
                        <button on:click={() => quizMode = true}
                            class="mt-4 px-6 py-3 bg-white text-slate-900 font-black text-sm rounded-xl hover:bg-slate-100 transition-all">
                            Begin {meta.label} →
                        </button>
                    {/if}
                </div>
            {/if}

            {#if !isAssessment}
                <header class="mb-12">
                    <h4 class="text-blue-600 font-bold uppercase tracking-widest text-[10px] mb-3">
                        {lesson?.units?.classes?.title ?? ''} / {lesson?.units?.title ?? ''}
                    </h4>
                    <h1 class="text-4xl lg:text-5xl font-black text-slate-900 font-serif leading-tight tracking-tight mb-4">
                        {lesson?.title ?? 'Loading...'}
                    </h1>
                    <div class="flex items-center gap-4 text-xs font-bold text-slate-400">
                        <span>📖 ~{estimatedMinutes} min read</span>
                        <span>·</span>
                        <span>{(blocks ?? []).length} blocks</span>
                        {#if quizQuestions.length > 0}<span>·</span><span>🧠 {quizQuestions.length} practice questions</span>{/if}
                        {#if isCompleted}<span>·</span><span class="text-emerald-500">✓ Completed</span>{/if}
                    </div>
                </header>
            {/if}

            <div class="space-y-2 text-lg">
                {#if !blocks || blocks.length === 0}
                    {#if !isAssessment}
                        <div class="p-8 text-center border-2 border-dashed border-slate-300 rounded-xl text-slate-400">
                            <p class="font-bold">No blocks forged for this lesson yet.</p>
                            <p class="text-sm mt-1">Use the AI Forge to populate this document.</p>
                        </div>
                    {/if}
                {:else}
                    {#each blocks as block}
                        <BlockRenderer {block} bind:spotlightContent />
                    {/each}
                {/if}
            </div>

            {#if !isAssessment && blocks && blocks.length > 0}
                <div class="mt-24 border-t border-slate-200 pt-12 pb-24 space-y-6">
                    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                        {#if !isCompleted}
                            <button on:click={markComplete} disabled={markingComplete}
                                class="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-all hover:-translate-y-0.5 shadow-md shadow-emerald-200 disabled:opacity-50">
                                {markingComplete ? 'Saving…' : '✓ Mark as Read'}
                            </button>
                        {:else}
                            <div class="px-8 py-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-black rounded-xl">✓ Lesson Complete</div>
                        {/if}
                        <button on:click={toggleQuiz}
                            class="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all hover:-translate-y-0.5 shadow-md shadow-blue-200">
                            🔥 Practice Quiz
                        </button>
                    </div>

                    <div class="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
                        {#if prevLesson}
                            <a href="/class/{prevLesson.id}" class="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors group">
                                <span class="group-hover:-translate-x-1 transition-transform">←</span>
                                <div>
                                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Previous</p>
                                    <p class="text-slate-700 truncate max-w-[180px]">{prevLesson.title}</p>
                                </div>
                            </a>
                        {:else}<div></div>{/if}
                        {#if nextLesson}
                            <a href="/class/{nextLesson.id}" class="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors group text-right ml-auto">
                                <div>
                                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Up</p>
                                    <p class="text-slate-700 truncate max-w-[180px] flex items-center gap-1">
                                        {#if nextLesson.lesson_type !== 'lesson'}<span>{QUIZ_META[nextLesson.lesson_type]?.icon ?? ''}</span>{/if}
                                        {nextLesson.title}
                                    </p>
                                </div>
                                <span class="group-hover:translate-x-1 transition-transform">→</span>
                            </a>
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
    </div>

    <aside class="hidden lg:flex w-[360px] xl:w-[400px] bg-slate-50 border-l border-slate-200 flex-col z-10 shrink-0">

        {#if quizMode || isAssessment}
            <div class="flex-1 flex flex-col h-full" in:fade>
                <div class="p-4 border-b border-slate-800 text-white flex justify-between items-center shrink-0
                    {tierBg[lessonType] ?? 'bg-slate-900'}">
                    <div>
                        <h2 class="font-black tracking-tight">{meta.icon} {meta.label}</h2>
                        <p class="text-[10px] opacity-60 font-bold mt-0.5">{displayQuestions.length} questions{lesson?.quiz_time_minutes ? ` · ${lesson.quiz_time_minutes} min` : ''}</p>
                    </div>
                    {#if !isAssessment}
                        <button on:click={toggleQuiz}
                            class="text-white/60 hover:text-white text-xs font-bold px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded transition-colors">
                            Yield Notes
                        </button>
                    {/if}
                </div>
                <div class="flex-1 overflow-hidden">
                    {#if displayQuestions.length > 0}
                        <Simulator questions={displayQuestions} quizTimeMinutes={isAssessment ? (lesson?.quiz_time_minutes ?? null) : null} />
                    {:else}
                        <div class="p-8 flex flex-col items-center justify-center h-full text-center text-slate-400">
                            <span class="text-3xl mb-3">🧠</span>
                            <p class="font-bold text-slate-600 text-sm">No questions yet for this {meta.label}.</p>
                            <p class="text-xs mt-2">The AI Forge generates these from your lesson content.</p>
                        </div>
                    {/if}
                </div>
            </div>

        {:else}
            <div class="flex-1 flex flex-col h-full">
                <div class="px-5 py-3 border-b border-slate-200 bg-white shrink-0">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-[10px] font-black tracking-widest uppercase text-slate-400">
                            {spotlightContent ? spotlightContent.type : 'Spotlight'}
                        </h3>
                        <span class="text-[10px] font-black text-slate-300">{readingProgress}%</span>
                    </div>
                    <div class="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div class="h-full bg-blue-500 transition-all duration-300 rounded-full" style="width: {readingProgress}%"></div>
                    </div>
                </div>

                <div class="flex-1 p-5 overflow-y-auto">
                    {#if spotlightContent}
                        <div class="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm" in:fade>
                            <div class="flex items-center gap-2 mb-3">
                                <span class="text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-50 px-2 py-0.5 rounded">{spotlightContent.type}</span>
                                <h4 class="font-black text-slate-800 text-sm truncate">{spotlightContent.title}</h4>
                            </div>
                            {#if spotlightContent.type === 'video' && spotlightContent.block?.url}
                                <div class="aspect-video rounded-xl overflow-hidden"><iframe src={spotlightContent.block.url} title="Video" class="w-full h-full" allowfullscreen></iframe></div>
                            {:else if spotlightContent.type === 'image' && spotlightContent.block?.url}
                                <img src={spotlightContent.block.url} alt={spotlightContent.title} class="w-full rounded-xl border border-slate-100">
                            {:else if spotlightContent.type === 'timeline'}
                                <div class="space-y-2 max-h-80 overflow-y-auto">
                                    {#each (spotlightContent.block?.events ?? []) as event}
                                        <div class="flex gap-3 p-2.5 bg-slate-50 rounded-lg">
                                            <span class="text-[10px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded shrink-0 h-fit">{event.year}</span>
                                            <div><p class="text-xs font-bold text-slate-800">{event.title}</p><p class="text-[11px] text-slate-500 font-serif mt-0.5">{event.desc ?? event.description ?? ''}</p></div>
                                        </div>
                                    {/each}
                                </div>
                            {:else if spotlightContent.type === 'table' || spotlightContent.type === 'chart'}
                                <div class="overflow-x-auto rounded-lg border border-slate-200">
                                    <table class="w-full text-xs">
                                        {#if spotlightContent.block?.headers}<thead class="bg-slate-800 text-white"><tr>{#each spotlightContent.block.headers as h}<th class="px-3 py-2 text-left font-black">{h}</th>{/each}</tr></thead>{/if}
                                        <tbody class="divide-y divide-slate-100">{#each (spotlightContent.block?.rows ?? []) as row, ri}<tr class="{ri%2===0?'bg-white':'bg-slate-50'}">{#each row as cell}<td class="px-3 py-2 text-slate-700">{cell}</td>{/each}</tr>{/each}</tbody>
                                    </table>
                                </div>
                            {:else if spotlightContent.type === 'proof'}
                                <div class="space-y-2 bg-slate-900 rounded-xl p-4">
                                    {#each (spotlightContent.block?.steps ?? []) as step, i}
                                        <div class="flex gap-2 text-xs"><span class="text-blue-400 font-black shrink-0">{i+1}.</span><div><p class="text-slate-200 font-mono">{step.statement}</p>{#if step.reason}<p class="text-slate-500 italic">∵ {step.reason}</p>{/if}</div></div>
                                    {/each}
                                    {#if spotlightContent.block?.conclusion}<p class="text-emerald-400 font-bold text-xs pt-2 border-t border-slate-700">∴ {spotlightContent.block.conclusion}</p>{/if}
                                </div>
                            {:else}
                                <p class="text-sm text-slate-600 font-serif leading-relaxed">{spotlightContent.text ?? ''}</p>
                            {/if}
                        </div>
                    {:else}
                        <div class="h-full flex flex-col items-center justify-center text-slate-300 space-y-3">
                            <span class="text-3xl opacity-50">✨</span>
                            <p class="text-center text-sm font-bold px-6 leading-relaxed">Scroll past a visual or hover a concept link to illuminate this space.</p>
                            <p class="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">← → arrow keys to navigate lessons</p>
                        </div>
                    {/if}
                </div>

                <div class="p-5 bg-white border-t border-slate-200 shrink-0 space-y-2">
                    <button on:click={toggleQuiz}
                        class="w-full bg-slate-900 flex justify-between items-center text-white px-5 py-3 rounded-xl shadow-md hover:bg-slate-800 transition-all group">
                        <span class="font-black tracking-tight text-sm">Launch Practice Quiz</span>
                        <span class="group-hover:translate-x-1 transition-transform font-bold">→</span>
                    </button>
                    <button on:click={() => conceptSearchOpen = !conceptSearchOpen}
                        class="w-full flex items-center justify-between text-slate-500 hover:text-slate-800 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all text-xs font-bold border border-slate-200">
                        <span>🌐 Look up a concept</span>
                        <span>{conceptSearchOpen ? '↑' : '↓'}</span>
                    </button>
                    {#if conceptSearchOpen}
                        <div in:fade={{ duration: 150 }}>
                            <ConceptPicker {classId} readonly
                                on:insert={() => {}}
                                on:select={e => {
                                    const c = e.detail.concept;
                                    const preview = (c.content_json ?? []).find((b) => b.type === 'paragraph')?.content ?? '';
                                    spotlightContent = { type: 'concept', title: c.title, text: preview };
                                    conceptSearchOpen = false;
                                }} />
                        </div>
                    {/if}
                    <button on:click={() => scratchpadOpen = !scratchpadOpen}
                        class="w-full flex items-center justify-between text-slate-500 hover:text-slate-800 px-4 py-2 rounded-xl hover:bg-slate-50 transition-all text-xs font-bold border border-slate-200">
                        <span>📝 Personal Notes</span>
                        <span>{scratchpadOpen ? 'Close' : 'Open'}</span>
                    </button>
                </div>
            </div>
        {/if}
    </aside>

    <Scratchpad bind:isOpen={scratchpadOpen} />

    <div class="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white border-t border-slate-200 flex items-center justify-around px-2 py-2 safe-area-pb">
        {#if prevLesson}
            <a href="/class/{prevLesson.id}" class="flex flex-col items-center gap-0.5 px-4 py-2 text-slate-400 hover:text-slate-700 transition-colors">
                <span class="text-lg">←</span>
                <span class="text-[9px] font-bold uppercase tracking-wider">Prev</span>
            </a>
        {:else}
            <div class="px-4 py-2 opacity-20 flex flex-col items-center gap-0.5">
                <span class="text-lg">←</span>
                <span class="text-[9px] font-bold uppercase tracking-wider">Prev</span>
            </div>
        {/if}
        <button on:click={toggleQuiz}
            class="flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-all {quizMode ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}">
            <span class="text-lg">🧠</span>
            <span class="text-[9px] font-bold uppercase tracking-wider">Quiz</span>
        </button>
        <button on:click={() => conceptSearchOpen = !conceptSearchOpen}
            class="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-50 transition-all">
            <span class="text-lg">🌐</span>
            <span class="text-[9px] font-bold uppercase tracking-wider">Concepts</span>
        </button>
        <button on:click={() => scratchpadOpen = !scratchpadOpen}
            class="flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-50 transition-all">
            <span class="text-lg">📝</span>
            <span class="text-[9px] font-bold uppercase tracking-wider">Notes</span>
        </button>
        {#if nextLesson}
            <a href="/class/{nextLesson.id}" class="flex flex-col items-center gap-0.5 px-4 py-2 text-slate-400 hover:text-slate-700 transition-colors">
                <span class="text-lg">→</span>
                <span class="text-[9px] font-bold uppercase tracking-wider">Next</span>
            </a>
        {:else}
            <div class="px-4 py-2 opacity-20 flex flex-col items-center gap-0.5">
                <span class="text-lg">→</span>
                <span class="text-[9px] font-bold uppercase tracking-wider">Next</span>
            </div>
        {/if}
    </div>

    <div class="h-20 lg:hidden"></div>
</div>
