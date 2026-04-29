<script lang="ts">
    import { fade } from 'svelte/transition';
    import Footer from '$lib/Footer.svelte';
    export let data;
    $: ({ post } = data);

    $: authorName = post.profiles?.full_name ?? post.profiles?.email ?? 'Meng Hub Team';
    $: authorInitials = authorName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    $: dateStr = post.published_at
        ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';
</script>

<svelte:head>
    <title>{post.title} — Meng Hub 梦</title>
</svelte:head>

<div class="h-full overflow-y-auto bg-dashboard" in:fade>
    <div class="max-w-2xl mx-auto px-6 py-12 lg:py-20">

        <a href="/blog" class="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors mb-10 uppercase tracking-widest">
            ← Warren Dispatch
        </a>

        <header class="mb-10">
            <div class="flex items-center gap-3 mb-5">
                <span class="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    {post.category}
                </span>
                {#if dateStr}
                    <span class="text-xs text-slate-400 font-medium">{dateStr}</span>
                {/if}
            </div>
            <h1 class="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-6">
                {post.title}
            </h1>
            <div class="flex items-center gap-3 pt-5 border-t border-slate-100">
                <div class="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-xs font-black text-blue-700">
                    {authorInitials}
                </div>
                <div>
                    <p class="text-sm font-bold text-slate-800">{authorName}</p>
                    <p class="text-xs text-slate-400 font-medium">Meng Hub Team</p>
                </div>
            </div>
        </header>

        <div class="font-serif text-lg leading-relaxed text-slate-700">
            {#if post.body}
                {#each post.body.split('\n\n') as paragraph}
                    {#if paragraph.trim()}
                        <p class="mb-5">{paragraph.trim()}</p>
                    {/if}
                {/each}
            {:else if post.excerpt}
                <p>{post.excerpt}</p>
            {:else}
                <p class="text-slate-400 italic">No content yet.</p>
            {/if}
        </div>

        <div class="mt-16 pt-8 border-t border-slate-100 flex items-center justify-between">
            <a href="/blog" class="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
                ← All posts
            </a>
            <span class="text-xs text-slate-300 font-mono">{post.slug}</span>
        </div>
    </div>
    <Footer />
</div>
