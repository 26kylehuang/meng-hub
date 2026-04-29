<script lang="ts">
    import { enhance } from '$app/forms';
    import { fade } from 'svelte/transition';
    export let form: any;

    const categories = ['AP Prep', 'Study Tips', 'Platform Update', 'Announcement'];
    let isSubmitting = false;
    let publishNow = false;
</script>

<div class="h-full overflow-y-auto bg-dashboard" in:fade>
    <div class="max-w-2xl mx-auto px-6 py-12">

        <div class="flex items-center justify-between mb-8">
            <div>
                <a href="/blog" class="text-xs font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest">← Back</a>
                <h1 class="text-2xl font-black text-slate-900 tracking-tight mt-2">New Post</h1>
            </div>
        </div>

        {#if form?.error}
            <div class="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm font-bold text-rose-700">
                {form.error}
            </div>
        {/if}

        <form method="POST"
            use:enhance={() => {
                isSubmitting = true;
                return async ({ update }) => { isSubmitting = false; update(); };
            }}
            class="space-y-6">

            <input type="hidden" name="publish" value={publishNow} />

            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                <div>
                    <label for="title" class="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Title *</label>
                    <input id="title" name="title" type="text" required
                        class="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="AP Calculus: How to Actually Understand Integrals">
                </div>

                <div>
                    <label for="category" class="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Category</label>
                    <select id="category" name="category"
                        class="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        {#each categories as cat}
                            <option value={cat}>{cat}</option>
                        {/each}
                    </select>
                </div>

                <div>
                    <label for="excerpt" class="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Excerpt</label>
                    <textarea id="excerpt" name="excerpt" rows="2"
                        class="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-serif focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Short summary shown on the blog listing…"></textarea>
                </div>

                <div>
                    <label for="body" class="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Body</label>
                    <textarea id="body" name="body" rows="12"
                        class="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-700 font-serif leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                        placeholder="Write your post here. Separate paragraphs with a blank line."></textarea>
                    <p class="text-xs text-slate-400 mt-1.5">Separate paragraphs with a blank line.</p>
                </div>
            </div>

            <label class="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition">
                <input type="checkbox" bind:checked={publishNow} class="w-5 h-5 rounded text-blue-600">
                <div>
                    <p class="font-bold text-slate-800 text-sm">Publish immediately</p>
                    <p class="text-xs text-slate-400 mt-0.5">Uncheck to save as draft.</p>
                </div>
            </label>

            <div class="flex gap-3">
                <button type="submit" disabled={isSubmitting}
                    class="flex-1 py-3.5 rounded-xl font-black text-sm transition-all
                        {publishNow ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-200' : 'bg-slate-900 text-white hover:bg-slate-800'}
                        disabled:opacity-50">
                    {isSubmitting ? 'Saving…' : publishNow ? '🚀 Publish Post' : '💾 Save Draft'}
                </button>
                <a href="/blog" class="px-6 py-3.5 rounded-xl font-bold text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
                    Cancel
                </a>
            </div>
        </form>
    </div>
</div>
