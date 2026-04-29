<script lang="ts">
    import { fade } from 'svelte/transition';
    import Footer from '$lib/Footer.svelte';
    export let data;
    $: ({ userRole, posts } = data);

    let selectedCategory = 'All';
    const categories = ['All', 'AP Prep', 'Study Tips', 'Platform Update', 'Announcement'];

    $: filteredPosts = selectedCategory === 'All'
        ? posts
        : posts.filter((p: any) => p.category === selectedCategory);
</script>

<div class="h-full overflow-y-auto bg-dashboard" in:fade>
    <div class="max-w-5xl mx-auto px-8 py-12">

        <header class="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-5">
            <div>
                <p class="text-xs font-black text-blue-500 uppercase tracking-widest mb-2">Warren Dispatch</p>
                <h1 class="text-4xl font-black tracking-tight text-slate-900">Study Strategies &amp; Updates</h1>
                <p class="text-slate-500 font-serif mt-2">Guides, deep-dives, and platform news from the Meng Hub team.</p>
            </div>
            {#if userRole === 'admin' || userRole === 'warren'}
                <a href="/blog/new"
                    class="shrink-0 px-5 py-3 bg-blue-600 text-white font-black text-sm rounded-xl hover:bg-blue-500 transition-all hover:-translate-y-0.5 shadow-md shadow-blue-200 whitespace-nowrap">
                    + New Post
                </a>
            {/if}
        </header>

        <div class="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {#each categories as cat}
                <button on:click={() => selectedCategory = cat}
                    class="px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border-2
                        {selectedCategory === cat
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-200 text-slate-500 hover:border-slate-400 bg-white'}">
                    {cat}
                </button>
            {/each}
        </div>

        {#if filteredPosts.length === 0}
            <div class="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl">
                <p class="text-2xl mb-3">📝</p>
                <p class="font-bold text-slate-500">No posts in this category yet.</p>
                {#if userRole === 'admin' || userRole === 'warren'}
                    <a href="/blog/new" class="text-sm text-blue-600 font-bold mt-2 inline-block hover:underline">Write the first one →</a>
                {/if}
            </div>
        {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {#each filteredPosts as post (post.id)}
                    <a href="/blog/{post.slug}"
                        class="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all"
                        in:fade>
                        <div class="flex items-center gap-2 mb-4">
                            <span class="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                                {post.category}
                            </span>
                            <span class="text-[10px] text-slate-400 font-medium">{post.date}</span>
                        </div>
                        <h2 class="text-lg font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                            {post.title}
                        </h2>
                        <p class="text-sm text-slate-500 font-serif leading-relaxed line-clamp-3 mb-5">{post.excerpt ?? ''}</p>
                        <div class="flex items-center gap-2.5 pt-4 border-t border-slate-100">
                            <div class="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                                {post.author_initials}
                            </div>
                            <span class="text-xs font-bold text-slate-600">{post.author_name}</span>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}
    </div>
    <Footer />
</div>
