<script lang="ts">
    export let title = '';
    export let delay = '0s';
    export let url = '#';
    export let isAp = false;
</script>

<a href={url}
    class="relative flex flex-col items-center justify-center cursor-pointer group"
    style="animation: float 6s ease-in-out infinite; animation-delay: {delay};">

    <div class="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500
        {isAp ? 'shadow-[0_0_60px_rgba(225,29,72,0.4)]' : 'shadow-[0_0_60px_rgba(59,130,246,0.4)]'}">
    </div>

    <div class="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full flex flex-col items-center justify-center p-5 text-center
        transition-all duration-300 group-hover:scale-110 group-hover:z-10
        backdrop-blur-md border
        {isAp
            ? 'bg-rose-950/40 border-rose-500/30 shadow-[0_0_30px_rgba(225,29,72,0.2)] group-hover:border-rose-400/60'
            : 'bg-blue-950/40 border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)] group-hover:border-blue-400/60'}">

        <div class="absolute inset-0 rounded-full opacity-20 group-hover:opacity-30 transition-opacity
            {isAp
                ? 'bg-gradient-to-tr from-rose-500/30 via-transparent to-transparent'
                : 'bg-gradient-to-tr from-blue-500/30 via-transparent to-transparent'}">
        </div>

        {#if isAp}
            <span class="text-[9px] font-black uppercase tracking-widest text-rose-400 mb-1.5 z-10 opacity-80">AP</span>
        {/if}

        <span class="text-white font-black text-sm leading-tight drop-shadow-lg z-10 line-clamp-3 px-1">
            {title}
        </span>

        <span class="absolute bottom-4 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-60 transition-opacity duration-300
            {isAp ? 'text-rose-300' : 'text-blue-300'}">
            Open →
        </span>
    </div>
</a>

<style>
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50%       { transform: translateY(-14px); }
    }
</style>
