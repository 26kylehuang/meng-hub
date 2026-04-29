<script lang="ts">
    import { supabase } from '$lib/supabase';
    import { createEventDispatcher } from 'svelte';

    export let title = '';
    export let conceptId = '';

    const dispatch = createEventDispatcher();

    let isHovered = false;
    let previewText = '';
    let isLoading = false;
    let fetched = false;
    let spanEl: HTMLElement;
    let flipLeft = false;

    async function handleHover() {
        isHovered = true;

        if (spanEl) {
            const rect = spanEl.getBoundingClientRect();
            flipLeft = rect.left > window.innerWidth * 0.6;
        }

        if (!fetched && conceptId) {
            isLoading = true;
            dispatch('spotlight', { title, text: 'Accessing archives…' });

            const { data, error } = await supabase
                .from('concepts')
                .select('content_json')
                .eq('id', conceptId)
                .single();

            if (!error && data?.content_json?.length > 0) {
                const firstText = data.content_json.find((b: any) => b.type === 'text' || b.type === 'paragraph');
                previewText = firstText
                    ? firstText.content.substring(0, 160) + '…'
                    : 'Concept found but no text definition available.';
            } else {
                previewText = 'Definition not found in the archives.';
            }

            dispatch('spotlight', { title, text: previewText });
            isLoading = false;
            fetched = true;
        } else if (fetched) {
            dispatch('spotlight', { title, text: previewText });
        }
    }
</script>

<span bind:this={spanEl}
    class="relative inline-block group cursor-help"
    on:mouseenter={handleHover}
    on:mouseleave={() => isHovered = false}
    role="button" tabindex="0"
    on:focus={handleHover}
    on:blur={() => isHovered = false}>

    <span class="border-b-2 border-dashed border-blue-400 text-blue-700 font-semibold
        transition-colors group-hover:bg-blue-50 group-hover:border-blue-600 px-0.5 rounded-sm">
        {title}
    </span>

    {#if isHovered}
        <div class="absolute bottom-full mb-2.5 w-72 p-4 bg-slate-900 text-white text-sm rounded-xl shadow-2xl z-50 pointer-events-none
            {flipLeft ? 'right-0' : 'left-1/2 -translate-x-1/2'}">

            <div class="absolute top-full {flipLeft ? 'right-4' : 'left-1/2 -translate-x-1/2'} border-4 border-transparent border-t-slate-900"></div>

            <div class="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
                <span class="font-black text-blue-400 tracking-widest text-[10px] uppercase">Meng Hub <span class="font-serif">梦</span></span>
                <span class="font-bold text-slate-300 text-xs truncate">{title}</span>
            </div>

            <p class="leading-relaxed font-serif text-slate-200">
                {#if isLoading}
                    <span class="text-slate-400 italic">Accessing archives…</span>
                {:else}
                    {previewText}
                {/if}
            </p>
        </div>
    {/if}
</span>
