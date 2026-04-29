<script lang="ts">
    import { enhance } from '$app/forms';
    import { fade } from 'svelte/transition';
    export let data;
    export let form: any;
    $: ({ profile } = data);

    let nameLoading  = false;
    let passLoading  = false;
    let showPassword = false;

    const roleLabel: Record<string, { label: string; color: string }> = {
        admin:   { label: 'Admin',     color: 'text-rose-400 bg-rose-400/10 border-rose-400/30' },
        warren:  { label: 'Warren TA', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
        student: { label: 'Student',   color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
    };
    $: role = roleLabel[profile?.role ?? 'student'] ?? roleLabel.student;

    $: memberSince = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
        : 'Unknown';
</script>

<div class="h-full overflow-y-auto bg-dashboard" in:fade>
    <div class="max-w-xl mx-auto px-6 py-12">

        <header class="mb-8">
            <h1 class="text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
            <p class="text-slate-500 font-medium mt-1 text-sm">Manage your account and preferences.</p>
        </header>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6 flex items-center gap-5">
            <div class="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-2xl font-black text-blue-600 shrink-0 uppercase">
                {profile?.full_name?.[0] ?? profile?.email?.[0] ?? '?'}
            </div>
            <div class="min-w-0">
                <p class="font-black text-slate-900 text-lg truncate">{profile?.full_name ?? 'No name set'}</p>
                <p class="text-slate-500 text-sm truncate">{profile?.email ?? ''}</p>
                <div class="flex items-center gap-3 mt-2">
                    <span class="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border {role.color}">
                        {role.label}
                    </span>
                    <span class="text-[10px] text-slate-400 font-medium">Member since {memberSince}</span>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-5">
            <div class="px-6 py-4 border-b border-slate-100">
                <h2 class="font-black text-slate-800 text-sm">Display Name</h2>
            </div>
            <div class="p-6">
                {#if form?.nameSuccess}
                    <div class="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-700" in:fade>
                        ✅ Name updated successfully.
                    </div>
                {/if}
                {#if form?.nameError}
                    <div class="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm font-bold text-rose-700" in:fade>
                        {form.nameError}
                    </div>
                {/if}
                <form method="POST" action="?/updateName"
                    use:enhance={() => { nameLoading = true; return async ({ update }) => { nameLoading = false; update(); }; }}
                    class="flex gap-3">
                    <input name="full_name" type="text" value={profile?.full_name ?? ''} placeholder="Your full name"
                        class="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <button type="submit" disabled={nameLoading}
                        class="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition disabled:opacity-50 shrink-0">
                        {nameLoading ? 'Saving…' : 'Save'}
                    </button>
                </form>
            </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-5">
            <div class="px-6 py-4 border-b border-slate-100">
                <h2 class="font-black text-slate-800 text-sm">Change Password</h2>
            </div>
            <div class="p-6">
                {#if form?.passSuccess}
                    <div class="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-700" in:fade>
                        ✅ Password updated. Use it on your next sign in.
                    </div>
                {/if}
                {#if form?.passError}
                    <div class="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm font-bold text-rose-700" in:fade>
                        {form.passError}
                    </div>
                {/if}
                <form method="POST" action="?/updatePassword"
                    use:enhance={() => { passLoading = true; return async ({ update }) => { passLoading = false; update(); }; }}
                    class="space-y-3">
                    <div class="relative">
                        <input name="password" type={showPassword ? 'text' : 'password'}
                            placeholder="New password (min 6 chars)" minlength="6"
                            class="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <button type="button" on:click={() => showPassword = !showPassword}
                            class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {#if showPassword}
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21"/>
                                {:else}
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                {/if}
                            </svg>
                        </button>
                    </div>
                    <input name="confirm_password" type={showPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        class="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <button type="submit" disabled={passLoading}
                        class="w-full py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition disabled:opacity-50">
                        {passLoading ? 'Updating…' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>

        <div class="bg-rose-50 rounded-2xl border border-rose-200 p-6">
            <h2 class="font-black text-rose-800 text-sm mb-1">Sign Out</h2>
            <p class="text-rose-600 text-xs font-medium mb-4">You'll be redirected to the login page.</p>
            <form method="POST" action="/auth?/logout">
                <button type="submit"
                    class="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-xl transition-all">
                    Sign Out of Meng Hub
                </button>
            </form>
        </div>

    </div>
</div>
