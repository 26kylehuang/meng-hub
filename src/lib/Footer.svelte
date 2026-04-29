<script lang="ts">
    const currentYear = new Date().getFullYear();
</script>

<footer class="bg-slate-950 text-slate-500 py-10 px-8 border-t border-white/5 relative z-10">
    <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">

        <div class="flex flex-col items-center sm:items-start gap-1">
            <span class="text-base font-black text-white tracking-tight">
                Meng Hub <span class="text-blue-400 font-serif">梦</span>
            </span>
            <p class="text-xs text-slate-600">
                © {currentYear} Meng Hub · Active Recall · Zettelkasten · Spaced Repetition
            </p>
        </div>

        <nav class="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] font-bold uppercase tracking-widest">
            <a href="/about" class="hover:text-white transition-colors">About</a>
            <a href="/blog"  class="hover:text-white transition-colors">Blog</a>
            <a href="/auth"  class="hover:text-white transition-colors">Sign In</a>
        </nav>

        <a href="https://ko-fi.com/menghub" target="_blank" rel="noopener noreferrer"
            class="group flex items-center gap-2.5 bg-slate-800 hover:bg-[#FF5E5B] border border-slate-700 hover:border-[#FF5E5B] text-white px-5 py-2.5 rounded-full transition-all text-xs font-bold shrink-0">
            <svg class="w-4 h-4 text-[#FF5E5B] group-hover:text-white transition-colors shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.216 6.415l-.132-.666c-.119-.598-.388-1.163-1.001-1.379-.197-.069-.42-.098-.57-.241-.152-.143-.196-.366-.231-.572-.065-.378-.125-.756-.192-1.133-.057-.325-.102-.69-.25-.987-.195-.4-.597-.634-.996-.788a5.723 5.723 0 00-.626-.194c-1-.263-2.05-.36-3.077-.416a25.834 25.834 0 00-3.7.062c-.915.083-1.88.184-2.75.5-.318.116-.646.256-.888.501-.297.302-.393.77-.177 1.146.154.267.415.456.692.58.36.162.737.284 1.123.366 1.075.238 2.189.331 3.287.37 1.218.05 2.437.01 3.65-.118.299-.033.598-.073.896-.119.352-.054.578-.513.474-.834-.124-.383-.457-.531-.834-.473-.466.074-.96.108-1.382.146-1.177.08-2.358.082-3.536.006a22.228 22.228 0 01-1.157-.107c-.086-.01-.18-.025-.258-.036-.243-.036-.484-.08-.724-.13-.111-.027-.111-.185 0-.212h.005c.277-.06.557-.108.838-.147h.002c.131-.009.263-.032.394-.048a25.076 25.076 0 013.426-.12c.674.019 1.347.067 2.017.144l.228.031c.267.04.533.088.798.145.392.085.895.113 1.07.542.055.137.08.288.111.431l.319 1.484a.237.237 0 01-.199.284h-.003c-.037.006-.075.01-.112.015a36.704 36.704 0 01-4.743.295 37.059 37.059 0 01-4.699-.304c-.14-.017-.293-.042-.417-.06-.326-.048-.649-.108-.973-.161-.393-.065-.768-.032-1.123.161-.29.16-.527.404-.675.701-.154.316-.199.66-.267 1-.069.34-.176.707-.135 1.056.087.753.613 1.365 1.37 1.502a39.69 39.69 0 0011.343.376.483.483 0 01.535.53l-.071.697-1.018 9.907c-.041.403-.129.953-.162 1.404-.162 2.1-1.65 3.99-3.768 4.308-2.968.44-5.15-1.75-4.94-4.845l.168-2.113.086-1.083.107-1.346.056-.705.037-.468.035-.438.024-.3.02-.25c.018-.235.037-.47.056-.706l.073-.91a.5.5 0 01.498-.458h7.046a.5.5 0 01.498.458z"/>
            </svg>
            Support this project
        </a>
    </div>
</footer>
