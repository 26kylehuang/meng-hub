<script lang="ts">
    import Simulator from '$lib/Simulator.svelte';
    import { fade } from 'svelte/transition';

    export let data;
    $: ({ topics } = data);

    let selectedTopicIds: string[] = [];
    let questionCount = 15;
    let includePastQuestions = false;
    let launched = false;
    let builtQuestions: any[] = [];

    const questionTypes = ['Cause/Effect', 'Chronology', 'Primary Source Analysis', 'Definition', 'Concept'];
    let selectedTypes: string[] = [...questionTypes];

    $: selectedTopics = topics.filter((t: any) => selectedTopicIds.includes(t.id));
    $: totalAvailable = selectedTopics.reduce((n: number, t: any) => n + t.count, 0);
    $: canLaunch = selectedTopicIds.length > 0 && selectedTypes.length > 0;
    let isLaunching = false;
    async function handleLaunch() { isLaunching = true; await launchQuiz(); isLaunching = false; }

    function toggleTopic(id: string) {
        selectedTopicIds = selectedTopicIds.includes(id)
            ? selectedTopicIds.filter(x => x !== id)
            : [...selectedTopicIds, id];
    }

    async function launchQuiz() {
        let pool: any[] = [];
        for (const topic of selectedTopics) {
            for (const block of topic.blocks ?? []) {
                pool.push({ ...block.content_json, block_id: block.id, topic: topic.name });
            }
        }

        if (includePastQuestions) {
            try {
                const res = await fetch('/api/search?type=nemesis');
                if (res.ok) {
                    const d = await res.json();
                    const nemesisQs = (d.questions ?? []).filter((q: any) =>
                        !pool.find((p: any) => p.block_id === q.block_id)
                    );
                    pool = [...pool, ...nemesisQs];
                }
            } catch { /* non-blocking */ }
        }

        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        builtQuestions = pool.slice(0, questionCount);
        launched = true;
    }

    function reset() {
        launched = false;
        builtQuestions = [];
    }
</script>

{#if launched}
    <div class="h-full flex flex-col" in:fade>
        <div class="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div>
                <span class="text-xs font-black text-blue-400 uppercase tracking-widest block mb-0.5">Custom Quiz</span>
                <h1 class="text-lg font-black text-white tracking-tight">{builtQuestions.length} questions · {selectedTopics.length} topic{selectedTopics.length !== 1 ? 's' : ''}</h1>
            </div>
            <button on:click={reset} class="text-xs font-bold text-slate-400 hover:text-white px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                ← Rebuild
            </button>
        </div>
        <div class="flex-1 overflow-hidden bg-white">
            <Simulator questions={builtQuestions} />
        </div>
    </div>

{:else}
    <div class="h-full overflow-y-auto bg-dashboard p-8" in:fade>
        <div class="max-w-3xl mx-auto">

            <header class="mb-8">
                <h1 class="text-3xl font-black text-slate-900 tracking-tight">Custom Quiz Builder</h1>
                <p class="text-slate-500 font-medium mt-1">Configure a targeted practice session from your archives.</p>
            </header>

            <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">

                <section class="p-8 border-b border-slate-100">
                    <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                        1. Select Topics
                        {#if selectedTopicIds.length > 0}
                            <span class="ml-2 text-blue-600 normal-case">{totalAvailable} questions available</span>
                        {/if}
                    </h3>
                    {#if topics.length === 0}
                        <div class="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                            <p class="font-bold text-sm">No quiz-ready lessons found.</p>
                            <p class="text-xs mt-1">Blocks need content_json with question_text.</p>
                        </div>
                    {:else}
                        <div class="space-y-2 max-h-72 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
                            {#each topics as topic (topic.id)}
                                <label class="flex items-center p-3 hover:bg-white rounded-lg cursor-pointer transition border border-transparent hover:border-slate-200 hover:shadow-sm">
                                    <input type="checkbox"
                                        checked={selectedTopicIds.includes(topic.id)}
                                        on:change={() => toggleTopic(topic.id)}
                                        class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0">
                                    <div class="ml-3 flex-1 min-w-0">
                                        <span class="font-bold text-slate-800 text-sm truncate block">{topic.name}</span>
                                        <p class="text-xs text-slate-400 mt-0.5">{topic.className} › {topic.unitName}</p>
                                    </div>
                                    <span class="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded shrink-0 ml-2">{topic.count} Qs</span>
                                </label>
                            {/each}
                        </div>
                    {/if}
                </section>

                <section class="p-8 border-b border-slate-100">
                    <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">2. Question Types</h3>
                    <div class="flex flex-wrap gap-3">
                        {#each questionTypes as type}
                            <label class="flex items-center px-4 py-2 border-2 rounded-xl cursor-pointer transition
                                {selectedTypes.includes(type) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50'}">
                                <input type="checkbox" bind:group={selectedTypes} value={type} class="hidden">
                                <span class="font-bold text-sm {selectedTypes.includes(type) ? 'text-blue-700' : 'text-slate-600'}">{type}</span>
                            </label>
                        {/each}
                    </div>
                </section>

                <section class="p-8 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">3. Length</h3>
                        <div class="flex items-center gap-4">
                            <input type="range" min="5" max="55" step="5" bind:value={questionCount} class="w-full accent-blue-600">
                            <span class="text-2xl font-black text-slate-800 w-12 text-right">{questionCount}</span>
                        </div>
                        {#if totalAvailable > 0 && questionCount > totalAvailable}
                            <p class="text-xs text-amber-600 font-bold mt-2">Only {totalAvailable} available — quiz will use all of them.</p>
                        {/if}
                    </div>
                    <div>
                        <h3 class="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">4. Spaced Repetition</h3>
                        <label class="flex items-start gap-4 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                            <input type="checkbox" bind:checked={includePastQuestions}
                                class="w-5 h-5 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500">
                            <div>
                                <span class="block font-bold text-slate-700 text-sm">Include Past Mistakes</span>
                                <span class="block text-xs text-slate-500 mt-1">Injects questions from your Nemesis queue.</span>
                            </div>
                        </label>
                    </div>
                </section>

                <div class="p-8 bg-slate-50 flex justify-end">
                    <button on:click={handleLaunch} disabled={!canLaunch || isLaunching}
                        class="bg-blue-600 text-white font-black text-base px-12 py-4 rounded-xl shadow-[0_10px_20px_-10px_rgba(37,99,235,0.5)] hover:bg-blue-500 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:hover:translate-y-0 disabled:cursor-not-allowed">
                        {isLaunching ? 'Building…' : 'Launch Simulator →'}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}
