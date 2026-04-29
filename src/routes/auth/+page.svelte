<script lang="ts">
    import { enhance } from '$app/forms';
    import { fade, fly } from 'svelte/transition';

    export let form: any;

    let isLogin = true;
    let loading = false;
    let showPassword = false;
</script>

<svelte:head>
    <title>{isLogin ? 'Sign In' : 'Create Account'} — Meng Hub 梦</title>
</svelte:head>

<div class="min-h-screen bg-stars flex flex-col items-center justify-center py-12 px-4 relative overflow-hidden">

    <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-600/15 rounded-full blur-[140px]"></div>
        <div class="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]"></div>
    </div>

    <div class="text-center mb-8 relative z-10" in:fly={{ y: -20, duration: 400 }}>
        <a href="/" class="inline-block">
            <h1 class="text-5xl font-black text-white tracking-tighter">
                Meng Hub <span class="text-blue-400 font-serif">梦</span>
            </h1>
        </a>
        <p class="mt-3 text-slate-500 text-sm font-medium tracking-widest uppercase">
            {isLogin ? 'Access the Archives' : 'Join the Archives'}
        </p>
    </div>

    <div class="w-full max-w-sm relative z-10" in:fly={{ y: 20, duration: 400, delay: 100 }}>
        <div class="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.6)] overflow-hidden">

            <div class="flex border-b border-white/10">
                <button on:click={() => isLogin = true}
                    class="flex-1 py-3.5 text-xs font-black uppercase tracking-widest transition-colors
                        {isLogin ? 'text-white bg-white/5 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}">
                    Sign In
                </button>
                <button on:click={() => isLogin = false}
                    class="flex-1 py-3.5 text-xs font-black uppercase tracking-widest transition-colors
                        {!isLogin ? 'text-white bg-white/5 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}">
                    Create Account
                </button>
            </div>

            <div class="p-8">
                {#if form?.error}
                    <div class="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-xl text-sm font-bold text-rose-300 flex items-center gap-2" in:fade>
                        <span class="shrink-0">⚠️</span>
                        {form.error}
                    </div>
                {/if}

                {#if form?.message}
                    <div class="mb-5 p-3.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-sm font-bold text-emerald-300 flex items-center gap-2" in:fade>
                        <span class="shrink-0">✅</span>
                        {form.message}
                    </div>
                {/if}

                <form method="POST" action={isLogin ? '?/login' : '?/register'}
                    use:enhance={() => {
                        loading = true;
                        return async ({ update }) => { loading = false; update(); };
                    }}
                    class="space-y-4">

                    {#if !isLogin}
                        <div in:fly={{ y: 8, duration: 200 }}>
                            <label for="fullName" class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Full Name</label>
                            <input id="fullName" name="fullName" type="text" autocomplete="name"
                                class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm font-medium placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                placeholder="Ada Lovelace">
                        </div>
                    {/if}

                    <div>
                        <label for="email" class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Email</label>
                        <input id="email" name="email" type="email" autocomplete="email" required
                            class="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm font-medium placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            placeholder="you@example.com">
                    </div>

                    <div>
                        <div class="flex justify-between items-center mb-1.5">
                            <label for="password" class="block text-[10px] font-black uppercase tracking-widest text-slate-400">Password</label>
                            {#if isLogin}<span class="text-[10px] text-slate-600 font-medium">Min 6 characters</span>{/if}
                        </div>
                        <div class="relative">
                            <input id="password" name="password"
                                type={showPassword ? 'text' : 'password'}
                                autocomplete={isLogin ? 'current-password' : 'new-password'}
                                required minlength="6"
                                class="w-full px-4 py-3 pr-11 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm font-medium placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                placeholder="••••••••">
                            <button type="button" on:click={() => showPassword = !showPassword}
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1">
                                {#if showPassword}
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/></svg>
                                {:else}
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                                {/if}
                            </button>
                        </div>
                    </div>

                    <button type="submit" disabled={loading}
                        class="w-full py-3.5 rounded-xl font-black text-sm tracking-wide transition-all mt-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {#if loading}
                            <svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            Authenticating…
                        {:else}
                            {isLogin ? 'Enter the Archives →' : 'Create Account →'}
                        {/if}
                    </button>
                </form>
            </div>
        </div>

        <p class="text-center mt-6 text-xs text-slate-600 font-medium">
            <a href="/about" class="hover:text-slate-400 transition-colors">What is Meng Hub?</a>
            <span class="mx-2">·</span>
            <a href="/blog" class="hover:text-slate-400 transition-colors">Warren Dispatch</a>
        </p>
    </div>
</div>
