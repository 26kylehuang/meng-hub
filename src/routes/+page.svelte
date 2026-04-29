<script lang="ts">
    import DreamNode from '$lib/DreamNode.svelte';
    import { fade, fly } from 'svelte/transition';

    export let data;
    $: ({ apClasses, coreClasses, session } = data);

    const delays = ['0s', '0.8s', '1.6s', '2.4s', '0.4s', '1.2s', '2.0s', '2.8s'];
    $: username = session?.user?.email?.split('@')[0] ?? 'Scholar';
    $: totalClasses = (apClasses?.length ?? 0) + (coreClasses?.length ?? 0);
</script>

<div class="min-h-full bg-slate-900 flex flex-col overflow-y-auto relative" in:fade>

    <div class="bg-stars absolute inset-0 pointer-events-none"></div>

    <div class="pointer-events-none absolute inset-0 overflow-hidden">
        <div class="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[120px]"></div>
        <div class="absolute bottom-1/3 right-1/4 w-96 h-96 bg-rose-600/8 rounded-full blur-[100px]"></div>
        <div class="absolute top-2/3 left-1/2 w-80 h-80 bg-purple-600/6 rounded-full blur-[100px]"></div>
    </div>

    <div class="relative z-10 flex flex-col items-center px-6 py-12 sm:py-20">

        <div class="text-center mb-12 sm:mb-16" in:fly={{ y: 20, duration: 400 }}>
            <div class="inline-flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Archives Online</span>
            </div>
            <h1 class="text-5xl sm:text-7xl font-black text-white tracking-tighter leading-none mb-4">
                Meng Hub <span class="text-blue-400 font-serif">梦</span>
            </h1>
            <p class="text-slate-400 text-lg font-medium max-w-md mx-auto leading-relaxed">
                Welcome back, <span class="text-white font-bold">{username}</span>.
                {totalClasses} archive{totalClasses !== 1 ? 's' : ''} await.
            </p>
        </div>

        <div class="flex flex-wrap justify-center gap-3 mb-16 sm:mb-20" in:fly={{ y: 20, duration: 400, delay: 100 }}>
            <a href="/dashboard" class="flex items-center gap-2 px-5 py-2.5 bg-slate-800/70 hover:bg-slate-700/80 border border-slate-700/50 text-slate-300 hover:text-white text-sm font-bold rounded-xl transition-all backdrop-blur-sm hover:-translate-y-0.5">
                📊 Command Center
            </a>
            <a href="/progress" class="flex items-center gap-2 px-5 py-2.5 bg-rose-900/40 hover:bg-rose-800/50 border border-rose-700/40 text-rose-300 hover:text-rose-200 text-sm font-bold rounded-xl transition-all backdrop-blur-sm hover:-translate-y-0.5">
                ⚔️ Nemesis Engine
            </a>
            <a href="/quiz/build" class="flex items-center gap-2 px-5 py-2.5 bg-blue-900/40 hover:bg-blue-800/50 border border-blue-700/40 text-blue-300 hover:text-blue-200 text-sm font-bold rounded-xl transition-all backdrop-blur-sm hover:-translate-y-0.5">
                ⚡ Quick Quiz
            </a>
        </div>

        {#if apClasses?.length > 0}
            <div class="w-full max-w-5xl mb-16 sm:mb-20" in:fly={{ y: 20, duration: 400, delay: 150 }}>
                <h2 class="text-[10px] font-black text-rose-400/80 uppercase tracking-[0.2em] mb-8 text-center">── AP Archives ──</h2>
                <div class="flex flex-wrap justify-center gap-8 sm:gap-10">
                    {#each apClasses as cls, i}
                        <DreamNode title={cls.title} url="/class/{cls.id}/dashboard" isAp={true} delay={delays[i % delays.length]} />
                    {/each}
                </div>
            </div>
        {/if}

        {#if coreClasses?.length > 0}
            <div class="w-full max-w-5xl" in:fly={{ y: 20, duration: 400, delay: 200 }}>
                <h2 class="text-[10px] font-black text-blue-400/80 uppercase tracking-[0.2em] mb-8 text-center">── Core Foundations ──</h2>
                <div class="flex flex-wrap justify-center gap-8 sm:gap-10">
                    {#each coreClasses as cls, i}
                        <DreamNode title={cls.title} url="/class/{cls.id}/dashboard" isAp={false} delay={delays[(i + 3) % delays.length]} />
                    {/each}
                </div>
            </div>
        {/if}

        {#if totalClasses === 0}
            <div class="text-center text-slate-600 mt-10" in:fade>
                <p class="text-5xl mb-5 opacity-30">🌌</p>
                <p class="font-bold text-slate-500">The cosmos is empty.</p>
                <p class="text-sm mt-2 text-slate-600">Admins: create classes in Supabase to populate the archives.</p>
            </div>
        {/if}

    </div>
</div>
