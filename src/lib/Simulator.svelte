<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition';

    export let questions: any[] = [];
    export let quizTimeMinutes: number | null = null;

    let reportingBlockId: string | null = null;
    let reportNote = '';
    let isReporting = false;

    async function submitReport() {
        if (!reportingBlockId) return;
        isReporting = true;
        const session = $page.data.session;
        await supabase.from('user_feedback').insert({
            user_id:    session?.user?.id ?? null,
            block_id:   reportingBlockId,
            lesson_id:  questions.find(q => q.block_id === reportingBlockId)?.lesson_id ?? null,
            issue_type: 'wrong_answer',
            note:       reportNote.trim() || null,
            page_url:   typeof window !== 'undefined' ? window.location.pathname : null,
            resolved:   false,
        });
        isReporting = false;
        reportingBlockId = null;
        reportNote = '';
    }

    let currentIndex = 0;
    let selectedAnswer: number | null = null;
    let mode: 'guided' | 'realistic' = 'guided';

    let sectionTimeLeft = quizTimeMinutes ? quizTimeMinutes * 60 : null;
    let sectionTimerInterval: any = null;

    let showHint = false;
    let showExplanation = false;
    let isSubmitted = false;
    let askingRootCause = false;
    let isFinished = false;
    let correctCount = 0;
    let conceptsToReview: string[] = [];

    let frqAnswers: string[] = [];
    let frqRevealed: boolean[] = [];

    let timeLeft = 90;
    let timerInterval: any = null;

    $: currentQ = questions[currentIndex];
    $: isFRQ = currentQ?.type === 'frq' || !!currentQ?.parts;
    $: isMCQ = !isFRQ;
    $: progress = questions.length ? Math.round(((currentIndex) / questions.length) * 100) : 0;

    function startTimer() {
        clearInterval(timerInterval);
        timeLeft = 90;
        if (mode === 'realistic') {
            timerInterval = setInterval(() => {
                timeLeft--;
                if (timeLeft <= 0) { clearInterval(timerInterval); autoSubmit(); }
            }, 1000);
        }
    }

    function autoSubmit() {
        if (!isSubmitted) { selectedAnswer = -1; submitAnswer(); }
    }

    function toggleMode() {
        mode = mode === 'guided' ? 'realistic' : 'guided';
        resetQuestion();
    }

    function resetQuestion() {
        selectedAnswer = null;
        showHint = false;
        showExplanation = false;
        isSubmitted = false;
        askingRootCause = false;
        frqAnswers  = (currentQ?.parts ?? []).map(() => '');
        frqRevealed = (currentQ?.parts ?? []).map(() => false);
        startTimer();
    }

    function revealFrqPart(i: number) {
        frqRevealed = frqRevealed.map((v, idx) => idx === i ? true : v);
    }

    async function submitFRQ() {
        isSubmitted = true;
        correctCount++;
        clearInterval(timerInterval);

        try {
            const session = $page.data.session;
            if (session && currentQ.block_id) {
                await supabase.from('nemesis_tracker')
                    .upsert(
                        { user_id: session.user.id, block_id: currentQ.block_id, consecutive_fails: 0, last_attempted: new Date().toISOString() },
                        { onConflict: 'user_id,block_id' }
                    );
            }
        } catch { /* non-blocking */ }
    }

    async function submitAnswer() {
        if (selectedAnswer === null) return;
        clearInterval(timerInterval);
        isSubmitted = true;
        const isCorrect = selectedAnswer === currentQ.correct_index;

        if (isCorrect) {
            correctCount++;
        } else {
            conceptsToReview = [...new Set([...conceptsToReview, currentQ.topic ?? 'Unknown concept'])];
        }

        try {
            const session = $page.data.session;
            if (session && currentQ.block_id) {
                if (isCorrect) {
                    await supabase.from('nemesis_tracker')
                        .upsert({ user_id: session.user.id, block_id: currentQ.block_id, consecutive_fails: 0 }, { onConflict: 'user_id,block_id' });
                } else {
                    await supabase.rpc('increment_nemesis_fail', {
                        p_user_id: session.user.id,
                        p_block_id: currentQ.block_id
                    });
                }
            }
        } catch { /* non-blocking */ }

        if (mode === 'guided') {
            if (!isCorrect) askingRootCause = true;
            else showExplanation = true;
        }
    }

    function logRootCause(cause: string) {
        askingRootCause = false;
        showExplanation = true;
    }

    function nextQuestion() {
        if (currentIndex < questions.length - 1) {
            currentIndex++;
            resetQuestion();
        } else {
            clearInterval(timerInterval);
            isFinished = true;
            saveProgress();
        }
    }

    async function saveProgress() {
        try {
            const session = $page.data.session;
            if (!session) return;
            const lessonId = questions[0]?.lesson_id ?? null;
            if (!lessonId) return;
            const score = Math.round((correctCount / questions.length) * 100);
            await supabase.from('user_progress').insert({
                user_id: session.user.id,
                lesson_id: lessonId,
                score,
                completed_at: new Date().toISOString(),
            });
        } catch { /* non-blocking */ }
    }

    import { onMount, onDestroy } from 'svelte';
    onMount(() => {
        startTimer();

        if (sectionTimeLeft !== null) {
            sectionTimerInterval = setInterval(() => {
                sectionTimeLeft!--;
                if (sectionTimeLeft! <= 0) {
                    clearInterval(sectionTimerInterval);
                    isFinished = true;
                    saveProgress();
                }
            }, 1000);
        }

        function handleKey(e: KeyboardEvent) {
            if (isFinished) return;
            const key = e.key.toUpperCase();
            const idx = ['A','B','C','D'].indexOf(key);
            if (idx !== -1 && !isSubmitted) selectedAnswer = idx;
            else if (e.key === 'Enter') {
                if (!isSubmitted && selectedAnswer !== null) submitAnswer();
                else if (isSubmitted && !askingRootCause) nextQuestion();
            }
        }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    });

    onDestroy(() => {
        clearInterval(timerInterval);
        clearInterval(sectionTimerInterval);
    });

    const OPTION_LABELS = ['A', 'B', 'C', 'D'];

    function optionClass(i: number): string {
        if (!isSubmitted) {
            return selectedAnswer === i
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-slate-200 bg-white hover:border-slate-400 text-slate-700';
        }
        if (i === currentQ.correct_index) return 'border-emerald-500 bg-emerald-50 text-emerald-900';
        if (i === selectedAnswer && i !== currentQ.correct_index) return 'border-rose-400 bg-rose-50 text-rose-900';
        return 'border-slate-200 bg-white text-slate-400 opacity-60';
    }
</script>

<div class="flex flex-col h-full bg-white">

    {#if questions.length === 0}
        <div class="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400" in:fade>
            <span class="text-4xl mb-4">🧠</span>
            <p class="font-bold text-slate-600">No questions loaded.</p>
            <p class="text-sm mt-2">Quiz data comes from your Supabase blocks.</p>
        </div>

    {:else if !isFinished}
        <div class="px-6 pt-5 pb-4 border-b border-slate-100 shrink-0">
            <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-black uppercase tracking-widest text-slate-400">
                    Q {currentIndex + 1} of {questions.length}
                </span>
                <div class="flex items-center gap-3">
                    {#if sectionTimeLeft !== null}
                        <span class="text-sm font-black tabular-nums {sectionTimeLeft <= 300 ? 'text-rose-500' : 'text-slate-500'}">
                            ⏱ {Math.floor(sectionTimeLeft / 60)}:{String(sectionTimeLeft % 60).padStart(2, '0')}
                        </span>
                    {:else if mode === 'realistic'}
                        <span class="text-sm font-black tabular-nums {timeLeft <= 15 ? 'text-rose-500' : 'text-slate-500'}">
                            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                        </span>
                    {/if}
                    {#if sectionTimeLeft === null}
                        <button on:click={toggleMode} class="text-xs font-bold px-3 py-1 rounded-full border transition-all {mode === 'realistic' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-300 hover:border-slate-500'}">
                            {mode === 'guided' ? 'Guided' : 'AP Strict'}
                        </button>
                    {/if}
                </div>
            </div>
            <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-blue-500 rounded-full transition-all duration-500" style="width: {progress}%"></div>
            </div>
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-5" in:fade={{ duration: 200 }}>
            {#if currentQ.stimulus}
                <div class="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900 font-serif leading-relaxed italic">
                    "{currentQ.stimulus}"
                </div>
            {/if}

            {#if isFRQ}
                <div class="mb-3 flex items-center gap-2">
                    <span class="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Free Response</span>
                    {#if currentQ.points}<span class="text-[10px] text-slate-400 font-bold">{currentQ.points} pts</span>{/if}
                </div>
                <p class="text-sm font-bold text-slate-800 leading-relaxed mb-4">{currentQ.question_text ?? currentQ.stimulus ?? 'Respond to the following'}</p>
                {#if currentQ.context}
                    <div class="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-serif text-slate-600 italic">{currentQ.context}</div>
                {/if}
                <div class="space-y-3">
                    {#each (currentQ.parts ?? []) as part, i}
                        <div class="border border-slate-200 rounded-xl overflow-hidden">
                            <div class="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                                <span class="w-5 h-5 rounded bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">{String.fromCharCode(65+i)}</span>
                                <p class="text-xs font-semibold text-slate-700 leading-snug">{part.prompt}</p>
                            </div>
                            <div class="p-3">
                                <textarea bind:value={frqAnswers[i]} disabled={isSubmitted} placeholder="Write your response…" rows="3"
                                    class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-serif text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none disabled:bg-slate-50"></textarea>
                                {#if isSubmitted}
                                    {#if !frqRevealed[i]}
                                        <button on:click={() => revealFrqPart(i)} class="mt-2 text-xs font-bold text-blue-600 hover:underline">Show model answer →</button>
                                    {:else}
                                        <div class="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-lg" in:fade>
                                            <p class="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Model Answer</p>
                                            <p class="text-xs text-slate-700 font-serif leading-relaxed">{part.model_answer}</p>
                                            {#if part.scoring_guide}<p class="text-[10px] text-slate-400 font-bold mt-1.5 pt-1.5 border-t border-emerald-100">{part.scoring_guide}</p>{/if}
                                        </div>
                                    {/if}
                                {/if}
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <p class="text-base font-bold text-slate-800 leading-relaxed mb-6">{currentQ.question_text ?? currentQ.question}</p>
                <div class="space-y-3">
                    {#each (currentQ.options ?? currentQ.choices ?? []) as option, i}
                        <button disabled={isSubmitted} on:click={() => selectedAnswer = i}
                            class="w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all font-medium text-sm flex items-start gap-3 {optionClass(i)}">
                            <span class="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-black mt-0.5
                                {isSubmitted && i === currentQ.correct_index ? 'border-emerald-500 bg-emerald-500 text-white' :
                                 isSubmitted && i === selectedAnswer ? 'border-rose-400 bg-rose-400 text-white' :
                                 selectedAnswer === i ? 'border-blue-500 bg-blue-500 text-white' : 'border-current bg-transparent'}">
                                {OPTION_LABELS[i]}
                            </span>
                            <span class="leading-relaxed">{option}</span>
                        </button>
                    {/each}
                </div>
                {#if mode === 'guided' && !isSubmitted && currentQ.hint}
                    <div class="mt-4">
                        {#if !showHint}
                            <button on:click={() => showHint = true} class="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors">Show hint →</button>
                        {:else}
                            <div class="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 font-serif leading-relaxed" in:fade>💡 {currentQ.hint}</div>
                        {/if}
                    </div>
                {/if}
            {/if}

            {#if askingRootCause}
                <div class="mt-6 p-5 bg-rose-50 border border-rose-200 rounded-2xl" in:fade>
                    <p class="text-sm font-black text-rose-800 mb-4 uppercase tracking-wider">Root-Cause Analyzer</p>
                    <p class="text-sm text-rose-700 mb-4 font-medium">Before we explain — why do you think you got this wrong?</p>
                    <div class="space-y-2">
                        {#each ['I misread the question', 'Vocabulary gap', 'Flawed logic / reasoning', "I just didn't know it"] as cause}
                            <button on:click={() => logRootCause(cause)}
                                class="w-full text-left text-sm font-semibold text-rose-800 bg-white border border-rose-200 px-4 py-3 rounded-xl hover:bg-rose-100 transition-colors">
                                {cause}
                            </button>
                        {/each}
                    </div>
                </div>
            {/if}

            {#if showExplanation && currentQ.explanation}
                <div class="mt-5 p-5 bg-slate-50 border border-slate-200 rounded-2xl" in:fade>
                    <p class="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Deep Explanation</p>
                    <p class="text-sm text-slate-700 font-serif leading-relaxed">{currentQ.explanation}</p>
                    {#if currentQ.why_wrong && selectedAnswer !== currentQ.correct_index}
                        <p class="text-sm text-rose-600 font-serif leading-relaxed mt-3 pt-3 border-t border-rose-100">
                            <span class="font-black">Why your answer was wrong:</span> {currentQ.why_wrong}
                        </p>
                    {/if}
                </div>
            {/if}

            {#if mode === 'realistic' && isSubmitted && !showExplanation}
                <button on:click={() => showExplanation = true} class="mt-4 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors">
                    Show explanation
                </button>
            {/if}

            {#if isSubmitted && currentQ?.block_id}
                {#if reportingBlockId === currentQ.block_id}
                    <div class="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl" in:fade>
                        <p class="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">Report Issue</p>
                        <textarea bind:value={reportNote} rows="2" placeholder="Describe what's wrong (optional)…"
                            class="w-full px-3 py-2 text-xs font-serif border border-rose-200 rounded-lg focus:outline-none resize-none bg-white"></textarea>
                        <div class="flex gap-2 mt-2">
                            <button on:click={submitReport} disabled={isReporting}
                                class="flex-1 py-2 bg-rose-600 text-white text-xs font-black rounded-lg hover:bg-rose-500 transition disabled:opacity-50">
                                {isReporting ? 'Sending…' : 'Submit Report'}
                            </button>
                            <button on:click={() => reportingBlockId = null}
                                class="px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition">
                                Cancel
                            </button>
                        </div>
                    </div>
                {:else}
                    <button on:click={() => reportingBlockId = currentQ.block_id}
                        class="mt-3 text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors block">
                        ⚑ Report this question
                    </button>
                {/if}
            {/if}
        </div>

        <div class="px-6 py-4 border-t border-slate-100 shrink-0">
            {#if !isSubmitted}
                {#if isFRQ}
                    <button on:click={submitFRQ}
                        class="w-full py-3 rounded-xl font-black text-sm bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-500/20">
                        Submit Response & See Model Answers
                    </button>
                {:else}
                    <button on:click={submitAnswer} disabled={selectedAnswer === null}
                        class="w-full py-3 rounded-xl font-black text-sm transition-all
                            {selectedAnswer !== null ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}">
                        Submit Answer
                    </button>
                    <p class="text-center text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wider">A · B · C · D keys to select · Enter to submit</p>
                {/if}
            {:else if !askingRootCause}
                <button on:click={nextQuestion}
                    class="w-full py-3 rounded-xl font-black text-sm bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md">
                    {currentIndex < questions.length - 1 ? 'Next Question →' : 'Finish Drill →'}
                </button>
                <p class="text-center text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-wider">Enter to continue</p>
            {/if}
        </div>

    {:else}
        <div class="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center text-center" in:fade>
            <span class="text-5xl mb-5">{correctCount === questions.length ? '🏆' : correctCount / questions.length >= 0.7 ? '📊' : '⚔️'}</span>
            <h2 class="text-2xl font-black text-slate-900 tracking-tight mb-1">Drill Complete</h2>
            <p class="text-slate-400 text-sm mb-6">Results logged to the Nemesis Engine.</p>

            <div class="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-xs shadow-lg mb-6">
                <p class="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Final Score</p>
                <div class="text-6xl font-black text-blue-600 mb-2">{Math.round((correctCount / questions.length) * 100)}%</div>
                <p class="text-sm font-bold text-slate-500">{correctCount} of {questions.length} correct</p>
            </div>

            {#if conceptsToReview.length > 0}
                <div class="w-full max-w-xs text-left mb-6">
                    <h3 class="text-xs font-black uppercase tracking-widest text-rose-500 mb-2">Review These:</h3>
                    <ul class="space-y-2">
                        {#each conceptsToReview as concept}
                            <li class="bg-rose-50 text-rose-700 px-4 py-2.5 rounded-xl text-sm font-bold border border-rose-100">
                                ⚠️ {concept}
                            </li>
                        {/each}
                    </ul>
                </div>
            {/if}

            <button on:click={() => goto('/progress')}
                class="w-full max-w-xs py-3 rounded-xl font-black text-sm bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md">
                Return to Command Center
            </button>
        </div>
    {/if}
</div>
