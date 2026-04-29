<script lang="ts">
    import '../app.css';
    import { invalidate, goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { afterNavigate } from '$app/navigation';
    import CommandPalette from '$lib/CommandPalette.svelte';

    export let data;
    $: ({ supabase, session, userRole, apClasses, coreClasses, feedbackCount } = data);

    let mobileMenuOpen = false;
    let paletteOpen = false;

    onMount(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
            if (_session?.expires_at !== session?.expires_at) {
                invalidate('supabase:auth');
            }
        });
        return () => subscription.unsubscribe();
    });

    afterNavigate(() => {
        if (typeof window !== 'undefined' && window.renderMathInElement) {
            window.renderMathInElement(document.body, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$',  right: '$',  display: false },
                ],
                throwOnError: false,
            });
        }
        mobileMenuOpen = false;
        paletteOpen = false;
    });

    async function handleSignOut() {
        await supabase.auth.signOut();
        goto('/auth');
    }

function isActive(path: string) {
        return $page.url.pathname === path || $page.url.pathname.startsWith(path + '/');
    }

    const navMain = [
        { href: '/dashboard', label: '📊 Command Center' },
        { href: '/progress',  label: '🧠 Nemesis Engine' },
        { href: '/quiz/build', label: '⚡ Quiz Builder' },
        { href: '/blog',      label: '📰 Warren Dispatch' },
        { href: '/tutorial',  label: '📖 Tutorial' },
    ];
</script>

{#if !session}
    <main class="min-h-screen bg-slate-900">
        <slot />
    </main>
{:else}
    <div class="flex h-screen font-sans overflow-hidden bg-slate-900">

        {#if mobileMenuOpen}
            <div class="fixed inset-0 bg-slate-900/70 z-40 lg:hidden backdrop-blur-sm"
                on:click={() => mobileMenuOpen = false}
                on:keydown={e => e.key === 'Escape' && (mobileMenuOpen = false)}
                role="button" tabindex="0" aria-label="Close menu"></div>
        {/if}

        <aside class="
            fixed lg:static inset-y-0 left-0 z-50
            w-64 bg-slate-900 text-slate-300 border-r border-slate-800
            flex flex-col transition-transform duration-300 ease-in-out shrink-0
            {mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ">
            <div class="h-16 flex items-center px-5 border-b border-slate-800/60 shrink-0 gap-3">
                <a href="/" class="flex items-center gap-3 group">
                    <span class="bg-blue-600 group-hover:bg-blue-500 transition-colors text-white rounded-lg w-8 h-8 flex items-center justify-center text-sm font-black shrink-0">梦</span>
                    <span class="text-lg font-black text-white tracking-widest">MENG HUB</span>
                </a>
            </div>

            <div class="px-3 py-3 shrink-0">
                <button on:click={() => paletteOpen = true}
                    class="w-full flex items-center justify-between bg-slate-800/60 hover:bg-slate-800 border border-slate-700/40 text-slate-400 px-3 py-2.5 rounded-xl transition-colors text-sm">
                    <span class="flex items-center gap-2">
                        <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        Search archives…
                    </span>
                    <span class="text-[10px] font-mono font-bold bg-slate-700/60 px-1.5 py-0.5 rounded text-slate-500">⌘K</span>
                </button>
            </div>

            <nav class="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-hide">
                <div class="space-y-0.5">
                    {#each navMain as item}
                        <a href={item.href}
                            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
                                {isActive(item.href) ? 'bg-blue-600/15 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}">
                            {item.label}
                        </a>
                    {/each}

                    {#if userRole === 'warren' || userRole === 'admin'}
                        <a href="/warren"
                            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
                                {isActive('/warren') ? 'bg-blue-600/15 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}">
                            🔨 Warren Board
                        </a>
                        <a href="/concepts"
                            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
                                {isActive('/concepts') ? 'bg-blue-600/15 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}">
                            🌐 Zettelkasten
                        </a>
                    {/if}

                    {#if userRole === 'admin'}
                        <a href="/admin"
                            class="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all
                                {isActive('/admin') ? 'bg-blue-600/15 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}">
                            <span>⚙️ Admin Control</span>
                            {#if feedbackCount > 0}
                                <span class="text-[10px] font-black bg-rose-600 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                                    {feedbackCount > 99 ? '99+' : feedbackCount}
                                </span>
                            {/if}
                        </a>
                        <a href="/review"
                            class="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold transition-all
                                {isActive('/review') ? 'bg-blue-600/15 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}">
                            <span>🔍 Review Queue</span>
                        </a>
                        <a href="/forge"
                            class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
                                {isActive('/forge') ? 'bg-blue-600/15 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}">
                            ⚒️ Content Forge
                        </a>
                    {/if}
                </div>

                {#if apClasses?.length > 0}
                    <div>
                        <p class="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">AP Archives</p>
                        <div class="space-y-0.5">
                            {#each apClasses as cls}
                                <a href="/class/{cls.id}/dashboard"
                                    class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                                        {$page.url.pathname.includes(cls.id) ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}">
                                    <span class="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                                    <span class="truncate">{cls.title}</span>
                                </a>
                            {/each}
                        </div>
                    </div>
                {/if}

                {#if coreClasses?.length > 0}
                    <div>
                        <p class="px-3 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Core Foundations</p>
                        <div class="space-y-0.5">
                            {#each coreClasses as cls}
                                <a href="/class/{cls.id}/dashboard"
                                    class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                                        {$page.url.pathname.includes(cls.id) ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800 hover:text-white'}">
                                    <span class="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                    <span class="truncate">{cls.title}</span>
                                </a>
                            {/each}
                        </div>
                    </div>
                {/if}
            </nav>

            <div class="p-3 border-t border-slate-800/60 shrink-0">
                <div class="flex items-center gap-3 bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                    <div class="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-black text-blue-400 shrink-0 uppercase">
                        {session.user.email?.[0] ?? '?'}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-xs font-bold text-slate-200 truncate">{session.user.email}</p>
                        <p class="text-[10px] font-black uppercase tracking-wide {userRole === 'admin' ? 'text-rose-400' : userRole === 'warren' ? 'text-amber-400' : 'text-emerald-500'}">
                            {userRole === 'admin' ? 'Admin' : userRole === 'warren' ? 'Warren TA' : 'Student'}
                        </p>
                    </div>
                    <a href="/profile" class="text-slate-500 hover:text-blue-400 transition-colors p-1.5 rounded-lg hover:bg-blue-500/10 shrink-0">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                    </a>
                    <button on:click={handleSignOut} class="text-slate-500 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-rose-500/10 shrink-0">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                        </svg>
                    </button>
                </div>
            </div>
        </aside>

        <main class="flex-1 flex flex-col min-w-0 relative overflow-hidden">
            <header class="h-14 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-4 lg:hidden shrink-0 z-30">
                <a href="/" class="font-black text-white tracking-widest text-sm">MENG HUB</a>
                <button on:click={() => mobileMenuOpen = !mobileMenuOpen} class="p-2 text-slate-400 bg-slate-800 rounded-lg">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                    </svg>
                </button>
            </header>

            <div class="flex-1 overflow-y-auto bg-slate-50">
                <slot />
            </div>
        </main>
    </div>
    <CommandPalette bind:open={paletteOpen} />
{/if}
