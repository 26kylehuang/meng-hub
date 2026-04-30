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
