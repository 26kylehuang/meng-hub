<script lang="ts">
    import { fade } from 'svelte/transition';
    export let data;
    $: ({ lessons, concepts } = data);

    $: conceptLookup = concepts.length > 0
        ? `\n\nKNOWN CONCEPTS (use exact UUIDs for [[links]]):\n` +
          concepts.map((c: any) => `- [[${c.title}|${c.id}]]`).join('\n')
        : '';

    const MODELS = {
        loop1: 'google/gemini-pro-1.5',
        loop2: 'anthropic/claude-3.5-sonnet',
        loop3: 'openai/gpt-4o',
    };

    const SYSTEM_PROMPTS = {
        loop1: `You are an academic transcriber. Fix any curved spine distortion, OCR errors, and broken math formulas in the raw scanned text. Output clean text as JSON: {"text": "..."}`,
        loop2: `You are the Meng Hub Archivist. Convert academic text into structured content blocks. Output ONLY: {"blocks": [...], "suggested_lesson_title": "...", "suggested_lesson_type": "lesson", "quiz_placement_note": "optional: suggest where lesson/chapter/unit quizzes should be inserted in this content"}

Block types and schemas:
- {"type":"heading_2","content":"Section Title"}
- {"type":"paragraph","content":"Text with [[ConceptName|uuid-if-known]] links for key terms"}
- {"type":"math","content":"LaTeX without $ signs","caption":"optional label"}
- {"type":"tip","title":"optional","content":"Important insight or mnemonic"}
- {"type":"timeline","title":"...","orientation":"horizontal|vertical","events":[{"year":"...","title":"...","desc":"..."}]}
- {"type":"table","title":"...","headers":["Col1","Col2"],"rows":[["A","B"]]}
- {"type":"chart","title":"...","headers":["X","Y"],"rows":[["val","val"]],"caption":"..."}
- {"type":"proof","title":"...","steps":[{"statement":"...","reason":"..."}],"conclusion":"..."}
- {"type":"cloze","prefix_text":"...","answer":"single word or phrase","suffix_text":"..."}
- {"type":"frq","stimulus":"Question stem","context":"optional doc excerpt","points":4,"parts":[{"prompt":"(A) Explain...","model_answer":"...","scoring_guide":"1pt for..."}]}
- {"type":"quiz","question_text":"...","options":["A","B","C","D"],"correct_index":0,"explanation":"Why A is right","why_wrong":"Why B/C/D wrong","topic":"...","hint":"..."}
- {"type":"summary","title":"...","points":["Key takeaway 1"],"concept_questions":[{"question":"Why did X cause Y?","type":"Cause & Effect","answer":"Deep explanation..."}]}

Rules:
- Use tip blocks for mnemonics, warnings, exam traps
- Every lesson MUST end with exactly one summary block with 3-5 concept_questions
- Concept questions must be deep: cause/effect, connections, why/how — NOT simple recall`,
        loop3: `You are a rigorous AP exam auditor. Review these JSON content blocks and:
1. Fix ALL broken LaTeX
2. Every quiz block MUST have detailed explanation AND why_wrong covering each wrong option
3. Every FRQ part MUST have model_answer and scoring_guide
4. Ensure summary concept_questions are genuinely deep
5. Fix any factual errors
Output: {"blocks": [...], "issues_fixed": [...], "merge_hints": "describe if/where content overlaps with existing content"}`,
    };

    let rawText = '';
    let pdfFile: File | null = null;
    let pdfPages: string[] = [];
    let isPdfLoading = false;
    let pdfError = '';
    let selectedPages: Set<number> = new Set();
    let inputMode: 'text' | 'pdf' = 'text';

    async function loadPdf(e: Event) {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        pdfFile = file;
        isPdfLoading = true;
        pdfError = '';
        pdfPages = [];

        try {
            const { pdfjsLib } = window as any;
            if (!pdfjsLib) throw new Error('PDF.js not loaded');

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const pages: string[] = [];

            for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
                const page = await pdf.getPage(i);
                const scale = 1.5;
                const viewport = page.getViewport({ scale });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d')!;
                await page.render({ canvasContext: ctx, viewport }).promise;
                pages.push(canvas.toDataURL('image/jpeg', 0.85));
            }
            pdfPages = pages;
            selectedPages = new Set(pdfPages.map((_, i) => i));
        } catch (err: any) {
            pdfError = err.message ?? 'Failed to load PDF';
        } finally {
            isPdfLoading = false;
        }
    }

    function togglePage(i: number) {
        const next = new Set(selectedPages);
        next.has(i) ? next.delete(i) : next.add(i);
        selectedPages = next;
    }

    async function runPdfLoop1() {
        if (!pdfPages.length || selectedPages.size === 0) return;
        activeLoop = 1;
        error = '';

        const selectedImages = pdfPages
            .filter((_, i) => selectedPages.has(i))
            .map(dataUrl => dataUrl.split(',')[1]);

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: `Extract ALL text from these ${selectedImages.length} PDF page(s). Fix curved-spine distortion, OCR artifacts, and restore any broken math formulas. Preserve all headings, body text, tables, and equations. Output as JSON: {"text": "..."}`,
                    systemPrompt: SYSTEM_PROMPTS.loop1,
                    model: MODELS.loop1,
                    images: selectedImages,
                }),
            });
            const json = await res.json();
            if (!json.success) { error = json.error ?? 'Loop 1 failed'; activeLoop = null; return; }
            try {
                const parsed = JSON.parse(json.result);
                loop1Output = parsed.text ?? json.result;
            } catch {
                loop1Output = json.result;
            }
        } catch (e: any) {
            error = e.message;
        }
        activeLoop = null;
    }

    let targetLessonId = '';
    let mergeMode = false;
    let existingBlocks: any[] = [];
    let mergeHints = '';

    async function loadExistingBlocks() {
        if (!mergeMode || !targetLessonId) { existingBlocks = []; return; }
        const res = await fetch(`/api/lesson-blocks?lesson_id=${targetLessonId}`);
        if (res.ok) { const d = await res.json(); existingBlocks = d.blocks ?? []; }
    }

    let activeLoop: 1 | 2 | 3 | null = null;
    let loop1Output = '';
    let loop2Output = '';
    let loop3Output = '';
    let error = '';
    let isSaving = false;
    let savedCount = 0;

    async function runLoop(loop: 1 | 2 | 3) {
        activeLoop = loop;
        error = '';

        const inputMap: Record<number, string> = {
            1: rawText,
            2: loop1Output || rawText,
            3: loop2Output,
        };

        const modelMap: Record<number, string> = {
            1: MODELS.loop1,
            2: MODELS.loop2,
            3: MODELS.loop3,
        };

        let input = inputMap[loop];
        if (!input.trim()) { error = `No input for Loop ${loop}.`; activeLoop = null; return; }

        let systemPrompt = SYSTEM_PROMPTS[`loop${loop}` as keyof typeof SYSTEM_PROMPTS];

        if (loop === 2 && conceptLookup) {
            systemPrompt += conceptLookup;
        }

        if (mergeMode && existingBlocks.length > 0 && (loop === 2 || loop === 3)) {
            const existingSummary = existingBlocks
                .slice(0, 20)
                .map(b => `[${b.type}] ${b.content ?? JSON.stringify(b.content_json)?.slice(0, 80)}`)
                .join('\n');
            systemPrompt += `\n\nEXISTING LESSON CONTENT (Smart Merge context — do not duplicate, inject new info into gaps):\n${existingSummary}`;
        }

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: input, systemPrompt, model: modelMap[loop] }),
            });

            const json = await res.json();
            if (!json.success) { error = json.error ?? 'Unknown error.'; activeLoop = null; return; }

            if (loop === 1) {
                try {
                    const parsed = JSON.parse(json.result);
                    loop1Output = parsed.text ?? json.result;
                } catch {
                    loop1Output = json.result;
                }
            }
            if (loop === 2) {
                loop2Output = json.result;
                try {
                    const parsed = JSON.parse(json.result);
                    if (parsed.quiz_placement_note) mergeHints = (mergeHints ? mergeHints + ' | ' : '') + '📋 ' + parsed.quiz_placement_note;
                } catch {}
            }
            if (loop === 3) {
                loop3Output = json.result;
                try {
                    const parsed = JSON.parse(json.result);
                    if (parsed.merge_hints) mergeHints = parsed.merge_hints;
                } catch {}
            }
        } catch (e: any) {
            error = e.message ?? 'Network error.';
        }
        activeLoop = null;
    }

    async function runFullPipeline() {
        if (inputMode === 'pdf') {
            await runPdfLoop1();
        } else {
            await runLoop(1);
        }
        if (error) return;
        await runLoop(2);
        if (error) return;
        await runLoop(3);
    }

    async function saveToLesson() {
        if (!targetLessonId || !finalOutput) { error = 'Select a lesson and run the pipeline first.'; return; }
        isSaving = true;
        error = '';

        try {
            let parsed: any;
            try { parsed = JSON.parse(finalOutput); } catch { error = 'Could not parse JSON output.'; isSaving = false; return; }

            const blocks = parsed.blocks ?? parsed;
            if (!Array.isArray(blocks)) { error = 'Output is not a blocks array.'; isSaving = false; return; }

            const saveRes = await fetch('/api/save-blocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lesson_id: targetLessonId, blocks }),
            });
            const saveData = await saveRes.json();
            if (!saveData.success) { error = saveData.error ?? 'Save failed.'; isSaving = false; return; }
            savedCount = saveData.count ?? blocks.length;
        } catch (e: any) {
            error = e.message;
        }
        isSaving = false;
    }

    function prettyJson(str: string): string {
        try { return JSON.stringify(JSON.parse(str), null, 2); } catch { return str; }
    }

    $: finalOutput = loop3Output || loop2Output;
</script>

<div class="h-full overflow-y-auto bg-dashboard" in:fade>
    <div class="max-w-5xl mx-auto px-6 py-10">

        <header class="mb-8">
            <p class="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">Admin · Warren</p>
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">AI Content Forge ⚒️</h1>
            <p class="text-slate-500 font-medium mt-1 text-sm">3-Loop pipeline: Gemini OCR → Claude Structurer → GPT-4o Auditor</p>
        </header>

        <div class="flex items-center gap-2 mb-8 flex-wrap">
            {#each [
                { n: 1, label: 'Gemini OCR', color: 'blue' },
                { n: 2, label: 'Claude Structurer', color: 'purple' },
                { n: 3, label: 'GPT-4o Auditor', color: 'emerald' },
            ] as step}
                <div class="flex items-center gap-2">
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-black
                        {activeLoop === step.n ? 'animate-pulse bg-blue-50 border-blue-300 text-blue-700' :
                         (step.n === 1 && loop1Output) || (step.n === 2 && loop2Output) || (step.n === 3 && loop3Output)
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-white border-slate-200 text-slate-500'}">
                        {(step.n === 1 && loop1Output) || (step.n === 2 && loop2Output) || (step.n === 3 && loop3Output) ? '✓' : step.n}
                        {step.label}
                        {#if activeLoop === step.n}<span class="ml-1">…</span>{/if}
                    </div>
                    {#if step.n < 3}<span class="text-slate-300 font-bold">→</span>{/if}
                </div>
            {/each}

            <button on:click={runFullPipeline}
                disabled={inputMode === 'pdf' ? (selectedPages.size === 0 || activeLoop !== null) : (!rawText.trim() || activeLoop !== null)}
                class="ml-auto px-5 py-2 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {activeLoop ? 'Running…' : '▶ Run Full Pipeline'}
            </button>
        </div>

        {#if error}
            <div class="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm font-bold text-rose-700" in:fade>
                ⚠️ {error}
            </div>
        {/if}

        {#if savedCount > 0}
            <div class="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-700" in:fade>
                ✅ {savedCount} blocks saved to lesson successfully.
            </div>
        {/if}

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 class="font-black text-slate-800 text-sm">Input</h2>
                        <p class="text-xs text-slate-400 mt-0.5">Upload PDF or paste raw text</p>
                    </div>
                    <div class="flex gap-1 bg-slate-100 rounded-lg p-0.5">
                        <button on:click={() => inputMode = 'pdf'}
                            class="px-3 py-1.5 text-xs font-black rounded-md transition-all
                                {inputMode === 'pdf' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
                            📄 PDF
                        </button>
                        <button on:click={() => inputMode = 'text'}
                            class="px-3 py-1.5 text-xs font-black rounded-md transition-all
                                {inputMode === 'text' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}">
                            ✏️ Text
                        </button>
                    </div>
                </div>

                {#if inputMode === 'pdf'}
                    <div class="flex-1 flex flex-col min-h-[280px]">
                        {#if !pdfPages.length}
                            <label class="flex-1 flex flex-col items-center justify-center p-8 cursor-pointer border-2 border-dashed border-slate-200 m-4 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all">
                                <span class="text-3xl mb-3">{isPdfLoading ? '⏳' : '📄'}</span>
                                <p class="font-bold text-slate-600 text-sm">{isPdfLoading ? 'Reading PDF pages…' : 'Drop your PDF here'}</p>
                                <p class="text-xs text-slate-400 mt-1">Curved-spine scans work great. Up to 30 pages.</p>
                                <input type="file" accept="application/pdf" class="hidden" on:change={loadPdf} disabled={isPdfLoading}>
                            </label>
                            {#if pdfError}<p class="text-xs text-rose-600 font-bold px-4 pb-4">⚠️ {pdfError}</p>{/if}
                        {:else}
                            <div class="p-3 border-b border-slate-100 flex items-center justify-between">
                                <p class="text-xs font-bold text-slate-600">{pdfPages.length} pages · {selectedPages.size} selected</p>
                                <div class="flex gap-2">
                                    <button on:click={() => selectedPages = new Set(pdfPages.map((_,i)=>i))} class="text-[10px] font-bold text-blue-600 hover:underline">All</button>
                                    <button on:click={() => selectedPages = new Set()} class="text-[10px] font-bold text-slate-400 hover:text-slate-700">None</button>
                                    <label class="text-[10px] font-bold text-slate-400 hover:text-slate-700 cursor-pointer">
                                        Change PDF <input type="file" accept="application/pdf" class="hidden" on:change={loadPdf}>
                                    </label>
                                </div>
                            </div>
                            <div class="flex-1 overflow-y-auto p-3 grid grid-cols-3 gap-2">
                                {#each pdfPages as page, i}
                                    <button on:click={() => togglePage(i)}
                                        class="relative rounded-lg overflow-hidden border-2 transition-all
                                            {selectedPages.has(i) ? 'border-blue-500 shadow-md shadow-blue-200' : 'border-slate-200 opacity-50 hover:opacity-75'}">
                                        <img src={page} alt="Page {i+1}" class="w-full block">
                                        <div class="absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black
                                            {selectedPages.has(i) ? 'bg-blue-500 text-white' : 'bg-slate-800/60 text-white'}">
                                            {i+1}
                                        </div>
                                        {#if selectedPages.has(i)}
                                            <div class="absolute top-1 right-1 text-blue-400 text-sm">✓</div>
                                        {/if}
                                    </button>
                                {/each}
                            </div>
                            <div class="p-3 border-t border-slate-100">
                                <button on:click={runPdfLoop1} disabled={selectedPages.size === 0 || activeLoop !== null}
                                    class="w-full py-2.5 bg-blue-600 text-white font-black text-xs rounded-xl hover:bg-blue-500 transition-all disabled:opacity-40">
                                    {activeLoop === 1 ? '🔁 Gemini reading pages…' : `🔁 Loop 1 — Read ${selectedPages.size} page${selectedPages.size !== 1 ? 's' : ''} with Gemini`}
                                </button>
                            </div>
                        {/if}
                    </div>
                {:else}
                    <div class="flex-1 flex flex-col">
                        <div class="flex items-center justify-between px-5 py-2 border-b border-slate-50">
                            <p class="text-xs text-slate-400 font-medium">Paste raw text or Loop 1 output</p>
                            <button on:click={() => runLoop(1)} disabled={!rawText.trim() || activeLoop !== null}
                                class="text-xs font-bold px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition disabled:opacity-40">
                                {activeLoop === 1 ? 'Running…' : 'Loop 1 →'}
                            </button>
                        </div>
                        <textarea bind:value={rawText} placeholder="Paste raw scanned/OCR text here…"
                            class="flex-1 w-full p-5 text-sm text-slate-700 font-mono leading-relaxed resize-none focus:outline-none min-h-[280px]"></textarea>
                    </div>
                {/if}
            </div>

            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 class="font-black text-slate-800 text-sm">Loop 1 Output — Clean Text</h2>
                        <p class="text-xs text-slate-400 mt-0.5">Gemini fixed OCR — feeds into Loop 2</p>
                    </div>
                    <button on:click={() => runLoop(2)} disabled={(!loop1Output && !rawText.trim()) || activeLoop !== null}
                        class="text-xs font-bold px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition disabled:opacity-40">
                        {activeLoop === 2 ? 'Running…' : 'Loop 2 →'}
                    </button>
                </div>
                <textarea bind:value={loop1Output} placeholder="Loop 1 output will appear here…"
                    class="flex-1 w-full p-5 text-sm text-slate-600 font-mono leading-relaxed resize-none focus:outline-none min-h-[280px] bg-slate-50"></textarea>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 class="font-black text-slate-800 text-sm">Loop 2 Output — Structured JSON</h2>
                        <p class="text-xs text-slate-400 mt-0.5">Claude block schema — feeds into Loop 3</p>
                    </div>
                    <button on:click={() => runLoop(3)} disabled={!loop2Output || activeLoop !== null}
                        class="text-xs font-bold px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition disabled:opacity-40">
                        {activeLoop === 3 ? 'Running…' : 'Loop 3 →'}
                    </button>
                </div>
                <pre class="flex-1 p-5 text-xs text-slate-600 font-mono leading-relaxed overflow-auto min-h-[280px] bg-slate-50 whitespace-pre-wrap">{prettyJson(loop2Output) || 'Loop 2 output will appear here…'}</pre>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div class="px-5 py-4 border-b border-slate-100">
                    <h2 class="font-black text-slate-800 text-sm">Loop 3 Output — Audited JSON</h2>
                    <p class="text-xs text-slate-400 mt-0.5">GPT-4o validated LaTeX + quiz explanations</p>
                </div>
                <pre class="flex-1 p-5 text-xs text-slate-600 font-mono leading-relaxed overflow-auto min-h-[200px] bg-slate-50 whitespace-pre-wrap">{prettyJson(loop3Output) || 'Loop 3 output will appear here…'}</pre>

                <div class="p-5 border-t border-slate-100 space-y-3">
                    <select bind:value={targetLessonId} on:change={loadExistingBlocks}
                        class="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700">
                        <option value="">— Select target lesson —</option>
                        {#each lessons as lesson}
                            <option value={lesson.id}>
                                {lesson.units?.classes?.title} › {lesson.units?.title} › {lesson.title}
                            </option>
                        {/each}
                    </select>

                    <label class="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 transition">
                        <input type="checkbox" bind:checked={mergeMode} on:change={loadExistingBlocks} class="w-4 h-4 rounded text-amber-600">
                        <div class="min-w-0">
                            <p class="text-xs font-black text-amber-900">⚡ Smart Merge Mode</p>
                            <p class="text-[10px] text-amber-700 font-medium mt-0.5">
                                Loads existing lesson blocks and passes them as context to Loop 2 so the AI injects content into the right place instead of duplicating.
                                {#if existingBlocks.length > 0}
                                    <span class="font-black text-amber-900">({existingBlocks.length} existing blocks loaded)</span>
                                {/if}
                            </p>
                        </div>
                    </label>

                    {#if mergeHints}
                        <div class="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-serif text-blue-800">
                            <span class="font-black">AI Merge Notes: </span>{mergeHints}
                        </div>
                    {/if}

                    <button on:click={saveToLesson} disabled={!targetLessonId || !finalOutput || isSaving}
                        class="w-full py-3 bg-slate-900 text-white font-black text-sm rounded-xl hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        {isSaving ? 'Saving…' : mergeMode ? '⚡ Smart Merge into Lesson' : '💾 Append to Lesson'}
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>
