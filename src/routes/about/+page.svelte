<script lang="ts">
    import { fade } from 'svelte/transition';
    import Footer from '$lib/Footer.svelte';
</script>

<svelte:head>
    <title>About — Meng Hub 梦</title>
</svelte:head>

<div class="h-full overflow-y-auto bg-dashboard" in:fade>
    <div class="max-w-3xl mx-auto px-8 py-16">

        <header class="mb-12">
            <h1 class="text-4xl font-black text-slate-900 tracking-tight mb-3">
                About Meng Hub <span class="font-serif text-blue-600">梦</span>
            </h1>
            <p class="text-lg text-slate-500 font-serif leading-relaxed">
                A high-fidelity cognitive learning ecosystem built to replace messy textbooks and passive studying.
            </p>
        </header>

        <div class="space-y-10 font-serif text-slate-700 leading-relaxed text-lg">

            <section>
                <h2 class="font-black text-slate-900 text-xl mb-3 font-sans tracking-tight">The Vision</h2>
                <p>
                    Meng Hub is designed to be as interactive as Brilliant, as structured as Khan Academy,
                    and as rigorous as Princeton Review — built specifically for AP and core academic courses.
                    Content lives as relational JSON blocks, not static documents, so it can be
                    dynamically assembled, queried, and cross-linked.
                </p>
            </section>

            <section>
                <h2 class="font-black text-slate-900 text-xl mb-3 font-sans tracking-tight">How It Works</h2>
                <div class="space-y-4">
                    {#each [
                        { title: 'Zettelkasten Knowledge Web', body: 'Key terms in notes are linked to a concepts table. Hovering reveals a lazy-loaded definition card without leaving the page.' },
                        { title: 'Tri-Pane Reader', body: 'Every lesson opens in a three-column layout: course navigation on the left, your notes in the center, and a dynamic Spotlight + personal Scratchpad on the right.' },
                        { title: 'Active Recall Quizzes', body: 'At the end of every lesson, the notes blur out to force memory retrieval. Guided mode shows hints and root-cause analysis. AP Strict mode runs a timed drill with no assistance.' },
                        { title: 'Nemesis Engine', body: 'Every wrong answer is tracked. Your personal Nemesis queue surfaces your hardest repeated misses as a prioritized spaced-repetition drill.' },
                        { title: '3-Loop AI Archivist', body: 'Textbooks are ingested via Gemini OCR, structured by Claude, and validated by GPT-4o — automatically populating the block database with accurate, quiz-ready content.' },
                    ] as item}
                        <div class="pl-5 border-l-2 border-blue-200">
                            <h3 class="font-black text-slate-800 text-base mb-1 font-sans">{item.title}</h3>
                            <p class="text-base text-slate-600">{item.body}</p>
                        </div>
                    {/each}
                </div>
            </section>

            <section>
                <h2 class="font-black text-slate-900 text-xl mb-3 font-sans tracking-tight">The Stack</h2>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {#each [
                        ['SvelteKit', 'Frontend framework'],
                        ['Supabase', 'Auth & database'],
                        ['Cloudflare', 'Hosting & storage'],
                        ['OpenRouter', 'AI pipelines'],
                        ['KaTeX', 'Math rendering'],
                        ['Tailwind CSS', 'Styling'],
                    ] as [tech, role]}
                        <div class="bg-white border border-slate-200 rounded-xl p-4">
                            <p class="font-black text-slate-800 text-sm font-sans">{tech}</p>
                            <p class="text-xs text-slate-400 mt-0.5">{role}</p>
                        </div>
                    {/each}
                </div>
            </section>

        </div>
    </div>
    <Footer />
</div>
