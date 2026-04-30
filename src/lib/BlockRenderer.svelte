<script lang="ts">
    import FeedbackMenu from './FeedbackMenu.svelte';
    import HoverCard from './HoverCard.svelte';
    import { onMount, createEventDispatcher } from 'svelte';
    import { fade } from 'svelte/transition';

    export let block: any;
    export let spotlightContent: any = null;

    const dispatch = createEventDispatcher();

    let blockElement: HTMLElement;
    let clozeAnswer = '';
    let clozeCorrect = false;
    let frqAnswers: string[] = [];
    let frqRevealed: boolean[] = [];
    let conceptAnswers: string[] = [];
    let conceptRevealed: boolean[] = [];

    function parseSegments(text: string): Array<{text: string, isLink: boolean, title?: string, id?: string}> {
        if (!text) return [];
        const regex = /\[\[(.*?)\|([a-z0-9-]+)\]\]/gi;
        const segs: any[] = [];
        let last = 0, m;
        while ((m = regex.exec(text)) !== null) {
            if (m.index > last) segs.push({ text: text.slice(last, m.index), isLink: false });
            segs.push({ text: m[1], isLink: true, title: m[1], id: m[2] });
            last = regex.lastIndex;
        }
        if (last < text.length) segs.push({ text: text.slice(last), isLink: false });
        return segs.length ? segs : [{ text, isLink: false }];
    }

    onMount(() => {
        const snatchTypes = ['video', 'image', 'timeline', 'chart', 'table', 'proof'];
        if (snatchTypes.includes(block.type)) {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        spotlightContent = { type: block.type, title: block.caption || block.title || 'Reference', url: block.url ?? null, block };
                    }
                });
            }, { threshold: 0.4 });
            if (blockElement) observer.observe(blockElement);
            return () => observer.disconnect();
        }
    });

    $: if (block.type === 'frq') {
        if (!frqAnswers.length || frqAnswers.length !== (block.parts ?? []).length) {
            frqAnswers  = (block.parts ?? []).map(() => '');
            frqRevealed = (block.parts ?? []).map(() => false);
        }
    }
    $: if (block.type === 'summary') {
        if (!conceptAnswers.length || conceptAnswers.length !== (block.concept_questions ?? []).length) {
            conceptAnswers  = (block.concept_questions ?? []).map(() => '');
            conceptRevealed = (block.concept_questions ?? []).map(() => false);
        }
    }

    function checkCloze() {
        if (clozeAnswer.toLowerCase().trim() === block.answer?.toLowerCase().trim()) clozeCorrect = true;
    }
    function revealFrq(i: number) { frqRevealed = frqRevealed.map((v, idx) => idx === i ? true : v); }
    function revealConcept(i: number) { conceptRevealed = conceptRevealed.map((v, idx) => idx === i ? true : v); }
</script>

<FeedbackMenu blockId={block.id ?? 'preview'} lessonId={block.lesson_id ?? 'preview'}>
<div bind:this={blockElement} class="block-wrapper mb-6">

    {#if block.type === 'heading' || block.type === 'heading_2'}
        <h2 class="text-2xl font-black mt-10 mb-3 text-slate-800 tracking-tight border-b border-slate-100 pb-2">{block.content}</h2>

    {:else if block.type === 'text' || block.type === 'paragraph'}
        <p class="text-lg leading-relaxed text-slate-700 font-serif">
            {#each parseSegments(block.content) as seg}
                {#if seg.isLink}
                    <HoverCard title={seg.title ?? ''} conceptId={seg.id ?? ''} on:spotlight={e => { spotlightContent = e.detail; }} />
                {:else}{seg.text}{/if}
            {/each}
        </p>

    {:else if block.type === 'math'}
        <div class="my-8 py-6 px-8 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto text-center">
            <span class="text-xl text-slate-800">$$ {block.content} $$</span>
            {#if block.caption}<p class="text-xs font-bold text-slate-400 mt-3 uppercase tracking-widest">{block.caption}</p>{/if}
        </div>

    {:else if block.type === 'image'}
        <figure class="my-8">
            <img src={block.url} alt={block.caption} class="rounded-xl shadow-md border border-slate-200 w-full max-w-2xl mx-auto">
            {#if block.caption}<figcaption class="text-center text-sm font-bold text-slate-400 mt-3">{block.caption}</figcaption>{/if}
        </figure>

    {:else if block.type === 'video'}
        <div class="aspect-video w-full max-w-2xl mx-auto rounded-xl overflow-hidden shadow-lg border border-slate-200 my-8">
            <iframe src={block.url} title={block.caption ?? 'Video'} class="w-full h-full" allowfullscreen></iframe>
        </div>

    {:else if block.type === 'timeline'}
        <div class="my-10 bg-slate-50 border border-slate-200 rounded-2xl p-8 overflow-hidden">
            <h3 class="font-black text-slate-800 text-base mb-6 tracking-tight">{block.title ?? 'Timeline'}</h3>
            {#if block.orientation === 'vertical'}
                <div class="relative pl-8 space-y-0">
                    <div class="absolute left-3 top-0 bottom-0 w-0.5 bg-blue-200 rounded-full"></div>
                    {#each (block.events ?? []) as event}
                        <div class="relative flex gap-4 pb-8 last:pb-0">
                            <div class="absolute -left-5 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow mt-1 shrink-0"></div>
                            <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex-1">
                                <span class="text-[10px] font-black px-2 py-0.5 bg-blue-600 text-white rounded shadow inline-block mb-2">{event.year}</span>
                                <h4 class="font-bold text-slate-800 text-sm mb-1">{event.title}</h4>
                                <p class="text-xs text-slate-500 font-serif leading-relaxed">{event.desc ?? event.description ?? ''}</p>
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="flex gap-6 overflow-x-auto pb-4 snap-x">
                    {#each (block.events ?? []) as event}
                        <div class="snap-start shrink-0 w-60 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                            <span class="text-[10px] font-black px-2 py-0.5 bg-blue-600 text-white rounded shadow inline-block">{event.year}</span>
                            <h4 class="font-bold text-slate-800 mt-2 mb-1 text-sm leading-tight">{event.title}</h4>
                            <p class="text-xs text-slate-500 font-serif leading-relaxed">{event.desc ?? event.description ?? ''}</p>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

    {:else if block.type === 'cloze'}
        <div class="my-6 p-5 bg-blue-50 border border-blue-100 rounded-xl flex flex-wrap items-center gap-2 text-base font-serif">
            <span class="text-[10px] font-black uppercase tracking-widest text-blue-600 border-r border-blue-200 pr-3 mr-1">Drill</span>
            <span class="text-slate-700">{block.prefix_text}</span>
            <input type="text" bind:value={clozeAnswer} on:keyup={checkCloze} disabled={clozeCorrect}
                class="w-28 sm:w-40 text-center border-b-2 bg-transparent focus:outline-none font-bold transition-all {clozeCorrect ? 'text-emerald-600 border-emerald-500' : 'text-blue-900 border-blue-400 focus:border-blue-700'}"
                placeholder="...">
            <span class="text-slate-700">{block.suffix_text}</span>
            {#if clozeCorrect}<span class="text-emerald-500 font-black text-sm">✓ Correct!</span>{/if}
        </div>

    {:else if block.type === 'tip'}
        <div class="my-6 flex gap-4 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
            <span class="text-2xl shrink-0 mt-0.5">💡</span>
            <div>
                {#if block.title}<p class="font-black text-amber-900 text-sm mb-1">{block.title}</p>{/if}
                <p class="text-amber-800 font-serif leading-relaxed text-base">{block.content}</p>
            </div>
        </div>

    {:else if block.type === 'chart'}
        <div class="my-8 bg-slate-50 border border-slate-200 rounded-2xl p-6 overflow-hidden">
            {#if block.title}<h3 class="font-black text-slate-800 text-base mb-4">{block.title}</h3>{/if}
            {#if block.rows && block.headers}
                <div class="overflow-x-auto">
                    <table class="w-full text-sm border-collapse">
                        <thead><tr class="bg-slate-800 text-white">{#each block.headers as h}<th class="px-4 py-2.5 text-left font-black text-xs uppercase tracking-wider">{h}</th>{/each}</tr></thead>
                        <tbody>{#each block.rows as row, ri}<tr class="{ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'} border-b border-slate-100">{#each row as cell}<td class="px-4 py-3 text-slate-700 font-serif">{cell}</td>{/each}</tr>{/each}</tbody>
                    </table>
                </div>
            {/if}
            {#if block.caption}<p class="text-xs text-slate-400 font-bold mt-3 text-center uppercase tracking-widest">{block.caption}</p>{/if}
        </div>

    {:else if block.type === 'table'}
        <div class="my-8 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            {#if block.title}<div class="px-5 py-3 bg-slate-800 text-white font-black text-sm">{block.title}</div>{/if}
            <table class="w-full text-sm">
                {#if block.headers}<thead class="bg-slate-100 border-b border-slate-200"><tr>{#each block.headers as h}<th class="px-5 py-3 text-left font-black text-[11px] uppercase tracking-widest text-slate-600">{h}</th>{/each}</tr></thead>{/if}
                <tbody class="divide-y divide-slate-100">{#each (block.rows ?? []) as row, ri}<tr class="{ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50/40 transition-colors">{#each row as cell, ci}<td class="px-5 py-3 {ci === 0 ? 'font-bold text-slate-800' : 'text-slate-600 font-serif'}">{cell}</td>{/each}</tr>{/each}</tbody>
            </table>
        </div>

    {:else if block.type === 'proof'}
        <div class="my-8 bg-slate-900 text-white rounded-2xl p-6 overflow-hidden">
            <div class="flex items-center gap-2 mb-5">
                <span class="text-blue-400 font-black text-xs uppercase tracking-widest">Proof</span>
                {#if block.title}<span class="text-white font-black text-base">— {block.title}</span>{/if}
            </div>
            <div class="space-y-3">
                {#each (block.steps ?? []) as step, i}
                    <div class="flex gap-4 items-start">
                        <span class="shrink-0 w-6 h-6 rounded-full bg-blue-600/30 border border-blue-500/50 text-blue-400 text-xs font-black flex items-center justify-center mt-0.5">{i+1}</span>
                        <div class="flex-1">
                            <p class="font-mono text-sm text-slate-200 leading-relaxed">{step.statement}</p>
                            {#if step.reason}<p class="text-xs text-slate-400 mt-0.5 font-serif italic">∵ {step.reason}</p>{/if}
                        </div>
                    </div>
                {/each}
            </div>
            {#if block.conclusion}
                <div class="mt-5 pt-4 border-t border-slate-700 flex items-center gap-2">
                    <span class="text-emerald-400 font-black text-sm">∴</span>
                    <p class="text-emerald-300 font-bold font-serif text-sm">{block.conclusion}</p>
                </div>
            {/if}
        </div>

    {:else if block.type === 'frq'}
        <div class="my-8 bg-white border-2 border-blue-100 rounded-2xl overflow-hidden shadow-sm">
            <div class="px-6 py-4 bg-blue-600 flex items-center justify-between">
                <div>
                    <span class="text-[10px] font-black uppercase tracking-widest text-blue-200">Free Response</span>
                    <p class="font-black text-white text-base mt-0.5">{block.stimulus ?? block.question ?? 'Free Response Question'}</p>
                </div>
                {#if block.points}<span class="text-xs font-black bg-blue-500 text-white px-3 py-1 rounded-full shrink-0">{block.points} pts</span>{/if}
            </div>
            {#if block.context}
                <div class="px-6 py-4 bg-blue-50 border-b border-blue-100 font-serif text-slate-600 italic text-sm leading-relaxed">{block.context}</div>
            {/if}
            <div class="divide-y divide-slate-100">
                {#each (block.parts ?? []) as part, i}
                    <div class="p-5">
                        <div class="flex items-start gap-3 mb-3">
                            <span class="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{String.fromCharCode(65 + i)}</span>
                            <p class="text-slate-800 font-semibold text-sm leading-relaxed">{part.prompt}</p>
                        </div>
                        <textarea bind:value={frqAnswers[i]} placeholder="Write your response here…" rows="4" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-serif leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y mb-3"></textarea>
                        {#if !frqRevealed[i]}
                            <button on:click={() => revealFrq(i)} class="text-xs font-bold text-blue-600 hover:underline">Show model answer →</button>
                        {:else}
                            <div class="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm" in:fade>
                                <p class="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Model Answer</p>
                                <p class="text-slate-700 font-serif leading-relaxed">{part.model_answer}</p>
                                {#if part.scoring_guide}<p class="text-xs text-slate-400 mt-2 font-bold border-t border-emerald-100 pt-2">Scoring: {part.scoring_guide}</p>{/if}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>

    {:else if block.type === 'summary'}
        <div class="my-12 rounded-3xl overflow-hidden border border-slate-200 shadow-lg">
            <div class="bg-slate-900 px-8 py-5">
                <p class="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">Lesson Summary</p>
                <h2 class="text-xl font-black text-white tracking-tight">{block.title ?? 'Key Takeaways'}</h2>
            </div>
            {#if block.points?.length}
                <div class="bg-slate-800 px-8 py-5">
                    <ul class="space-y-2.5">
                        {#each block.points as point}
                            <li class="flex items-start gap-3 text-slate-300 font-serif text-sm leading-relaxed">
                                <span class="text-blue-400 font-black shrink-0 mt-0.5">→</span>{point}
                            </li>
                        {/each}
                    </ul>
                </div>
            {/if}
            {#if block.concept_questions?.length}
                <div class="bg-white px-8 py-6">
                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-5">Concept Questions — Connections, Cause &amp; Effect, Why/How</p>
                    <div class="space-y-6">
                        {#each block.concept_questions as q, i}
                            <div class="border-l-4 border-blue-200 pl-5">
                                <p class="font-bold text-slate-800 text-sm mb-2 leading-snug">{q.question}</p>
                                <textarea bind:value={conceptAnswers[i]} placeholder="Think through it before revealing…" rows="2" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-serif text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none mb-2"></textarea>
                                {#if !conceptRevealed[i]}
                                    <button on:click={() => revealConcept(i)} class="text-xs font-bold text-blue-600 hover:underline">Reveal deep answer →</button>
                                {:else}
                                    <div class="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm" in:fade>
                                        <p class="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">{q.type ?? 'Deep Connection'}</p>
                                        <p class="text-slate-700 font-serif leading-relaxed">{q.answer}</p>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
        </div>
    {/if}

</div>
</FeedbackMenu>
