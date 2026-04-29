<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    $: role = $page.data.userRole ?? 'student';

    const studentSteps = [
        {
            icon: '🌌',
            title: 'Welcome to Meng Hub 梦',
            subtitle: 'The Dream Archive',
            body: `Meng Hub replaces your textbook. Everything is here: structured notes, interactive visuals, practice quizzes, and a memory system that tracks exactly what you struggle with.\n\nThis tour takes 3 minutes and will make everything click.`,
            tip: null,
        },
        {
            icon: '📖',
            title: 'The Three-Pane Reading View',
            subtitle: 'Zero wasted space',
            body: `Every lesson opens in three columns:\n\n① LEFT — Chapter navigation. See all lessons and quizzes in the unit.\n\n② CENTER — Your notes. Scroll through block-based content: text, math, timelines, videos, tables, and proofs.\n\n③ RIGHT — The Spotlight. When you scroll past a video or diagram, it pins there. When you hover a concept link, the definition appears here.`,
            tip: '💡 Use ← → arrow keys to jump between lessons without lifting your hands from the keyboard.',
        },
        {
            icon: '🌐',
            title: 'Zettelkasten Concept Links',
            subtitle: 'The most important feature',
            body: `Throughout your notes, you'll see terms underlined with a dashed blue line.\n\nHover over any of them. A definition card pops up immediately. The same definition also appears in the right-side Spotlight.\n\nYou can also search concepts using the "🌐 Look up a concept" button — it auto-filters to your current class first.`,
            tip: '💡 If a term is missing, use the right-click feedback menu to report it.',
        },
        {
            icon: '✏️',
            title: 'Practice Quizzes After Every Lesson',
            subtitle: 'Active recall, not passive reading',
            body: `At the end of every lesson, click Practice Quiz — the notes blur out to force memory retrieval.\n\n① GUIDED — Shows hints. If you get it wrong, the Root-Cause Analyzer asks why you failed, then shows a deep explanation.\n\n② AP STRICT — No hints. Timed. Explanations locked until you finish. Real exam pressure.\n\nSwitch modes with the toggle in the top-right corner.`,
            tip: '💡 Press A, B, C, or D to select. Press Enter to submit.',
        },
        {
            icon: '📋',
            title: 'Quiz Tiers',
            subtitle: 'Lesson → Chapter → Unit → AP Exam',
            body: `✏️ Lesson Check — 5-10 questions, ~8 min.\n📋 Chapter Quiz — 15 questions, ~20 min.\n🎯 Unit Exam — 30 questions, ~45 min.\n🏆 AP Practice Exam — 55 MCQ + FRQs, full time limit.\n\nThese appear in the left nav as you progress through lessons.`,
            tip: '💡 Chapter and unit quizzes pull questions from all lessons they cover.',
        },
        {
            icon: '⚔️',
            title: 'The Nemesis Engine',
            subtitle: 'Your personal weakness tracker',
            body: `Every wrong answer is logged. Every right answer resets the count.\n\nYour Nemesis Queue shows your hardest repeated misses. The Nemesis Engine page shows each with red dots for fail count.\n\nClick "⚔️ Conquer Now" to drill exclusively from your failures, sorted worst to least bad.`,
            tip: '💡 Check your Nemesis queue before every study session.',
        },
        {
            icon: '📝',
            title: 'Your Personal Scratchpad',
            subtitle: 'Private notes, always synced',
            body: `The "📝 Personal Notes" button opens a private drawer.\n\nAuto-saves to your account every 1.5 seconds and to local storage instantly — nothing is lost offline.\n\nCompletely private — nobody else can read them.`,
            tip: '💡 Use the Scratchpad for summaries, memory tricks, or questions to ask later.',
        },
        {
            icon: '🔍',
            title: 'Search Everything',
            subtitle: '⌘K from anywhere',
            body: `Press ⌘K (Mac) or Ctrl+K (Windows) from anywhere to open Search.\n\nSearches concepts and lessons. Your current class is shown first with a ⭐.`,
            tip: '💡 Right-click any block to report an error directly to the admin inbox.',
        },
        {
            icon: '🎉',
            title: "You're Ready",
            subtitle: "Let's start learning",
            body: `Recommended flow:\n\n1. Open a lesson from the class dashboard\n2. Read through the notes, hovering concept links\n3. Mark it as read ✓\n4. Take the lesson quiz (guided mode to start)\n5. After a few lessons, do the chapter quiz\n6. Check your Nemesis queue regularly`,
            tip: null,
        },
    ];

    const warrenSteps = [
        {
            icon: '🔨',
            title: 'Welcome, Warren',
            subtitle: 'Your role in the Meng Hub ecosystem',
            body: `As a Warren, you are the human quality gate between AI output and students. The AI is fast but makes mistakes. You catch them.\n\nYour job is not to write content — the AI does that. Your job is to fact-check, fix errors, verify quiz answer keys, and ensure accuracy before students see it.`,
            tip: null,
        },
        {
            icon: '🔁',
            title: 'The Full Pipeline',
            subtitle: 'Where you fit in',
            body: `1. Admin uploads a PDF in the AI Forge\n2. Loop 1 (Gemini) reads the scan, fixes OCR\n3. Loop 2 (Claude) structures text into blocks\n4. Loop 3 (GPT-4o) audits LaTeX and quiz explanations\n5. Blocks land as "pending_review" — admin sees these\n6. Admin reviews at /review, approves → blocks become "draft"\n7. ← YOU ARE HERE → Warren Job Board shows draft blocks\n8. You fact-check, fix, then publish\n9. Students see it`,
            tip: '💡 The "Review Assist" tab lets you pre-edit pending blocks before admin approval.',
        },
        {
            icon: '📋',
            title: 'The Warren Job Board',
            subtitle: '/warren — your home base',
            body: `📋 JOB BOARD — Available blocks to claim.\n🔨 MY TASKS — Your claimed blocks. Click "✏️ Edit & Publish" to open the editor.\n🔍 REVIEW ASSIST — Blocks awaiting admin approval you can pre-edit.`,
            tip: "💡 Don't claim more than you can finish. Use \"Drop\" to release a block.",
        },
        {
            icon: '✏️',
            title: 'The Block Editor',
            subtitle: 'Your main workspace',
            body: `Split-screen editor:\n\nLEFT: AI Edit instruction box, Fact-Check Notes, text editor, JSON editor with live validation.\n\nRIGHT: Live preview — exactly what the student sees, updating as you type.\n\nBottom: "💾 Save Draft" or "🚀 Publish".`,
            tip: '💡 Red JSON editor = invalid JSON = cannot publish until fixed.',
        },
        {
            icon: '🌐',
            title: 'Inserting Concept Links',
            subtitle: 'The Zettelkasten is your responsibility',
            body: `Click "🌐 Insert [[link]]" above the text editor. Search for a concept — current class shown first (⭐). Click to insert [[Title|uuid]] at cursor.\n\nIf a concept doesn't exist, the search shows "create one →" linking to /concepts.`,
            tip: '💡 After publishing, use ⌘K to verify the link resolves correctly.',
        },
        {
            icon: '⚠️',
            title: 'What to Actually Check',
            subtitle: 'Your specific responsibilities',
            body: `Every block: factual accuracy, LaTeX rendering.\n\nQuiz blocks: Is correct_index actually correct? Is the explanation thorough for right AND wrong options?\n\nTimeline: Are dates accurate?\n\nFRQ: Is the model answer good? Does scoring guide reflect AP rubric?\n\nSummary: Are concept questions deep (cause/effect, connections) not simple recall?`,
            tip: '💡 Flag uncertainty in Fact-Check Notes rather than publishing something uncertain.',
        },
        {
            icon: '🎉',
            title: "You're Ready to Contribute",
            subtitle: 'Students are counting on you',
            body: `• Go to /warren to see jobs\n• Claim → Edit & Publish is the main flow\n• Use AI Edit for quick fixes\n• Insert [[concept links]] in text blocks\n• Write fact-check notes for everything you verify\n• When stuck, drop the block — don't guess\n\nThank you for being part of this.`,
            tip: null,
        },
    ];

    $: steps = role === 'warren' ? warrenSteps : studentSteps;
    let currentStep = 0;
    $: step = steps[currentStep];
    $: isLast = currentStep === steps.length - 1;

    function next() {
        if (!isLast) currentStep++;
        else goto('/');
    }
    function prev() { if (currentStep > 0) currentStep--; }
    function skip() { goto('/'); }
</script>

<svelte:head>
    <title>Tutorial — Meng Hub 梦</title>
</svelte:head>

<div class="min-h-screen bg-stars flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">

    <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"></div>
    </div>

    <div class="flex gap-2 mb-8 relative z-10">
        {#each steps as _, i}
            <button on:click={() => currentStep = i}
                class="transition-all duration-300 rounded-full {i === currentStep ? 'w-8 h-2 bg-blue-400' : i < currentStep ? 'w-2 h-2 bg-blue-600' : 'w-2 h-2 bg-slate-700'}">
            </button>
        {/each}
    </div>

    {#key currentStep}
        <div class="w-full max-w-2xl relative z-10 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            in:fly={{ y: 20, duration: 300 }} out:fade={{ duration: 150 }}>

            <div class="px-8 pt-10 pb-6 text-center border-b border-white/10">
                <span class="text-5xl block mb-4">{step.icon}</span>
                <p class="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">{step.subtitle}</p>
                <h1 class="text-2xl font-black text-white tracking-tight">{step.title}</h1>
            </div>

            <div class="px-8 py-7">
                <div class="text-slate-300 font-serif text-base leading-relaxed space-y-4">
                    {#each step.body.split('\n\n') as para}
                        <p class="whitespace-pre-line">{para}</p>
                    {/each}
                </div>
                {#if step.tip}
                    <div class="mt-6 p-4 bg-amber-900/30 border border-amber-700/40 rounded-xl">
                        <p class="text-sm text-amber-300 font-serif leading-relaxed">{step.tip}</p>
                    </div>
                {/if}
            </div>

            <div class="px-8 pb-8 flex items-center justify-between">
                <div class="flex gap-3">
                    {#if currentStep > 0}
                        <button on:click={prev} class="text-sm font-bold text-slate-500 hover:text-slate-300 transition-colors">← Back</button>
                    {:else}
                        <button on:click={skip} class="text-sm font-bold text-slate-600 hover:text-slate-400 transition-colors">Skip tutorial</button>
                    {/if}
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-xs font-bold text-slate-600">{currentStep + 1} / {steps.length}</span>
                    <button on:click={next}
                        class="px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-900/50">
                        {isLast ? (role === 'warren' ? 'Start Contributing →' : 'Start Learning →') : 'Next →'}
                    </button>
                </div>
            </div>
        </div>
    {/key}

    <p class="mt-6 text-xs text-slate-600 font-medium relative z-10 capitalize">
        {role} tutorial · {steps.length} steps
    </p>
</div>
