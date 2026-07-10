// src/shared/utils/statusPage.ts

export const getStatusPage = (): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Qafila API Status</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; }
            .grid-bg {
                background-image: linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                                  linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
                background-size: 24px 24px;
            }
        </style>
    </head>
    <body class="bg-[#0B0F19] text-slate-200 min-h-screen flex items-center justify-center relative overflow-hidden antialiased">
        
        <div class="absolute inset-0 grid-bg pointer-events-none"></div>
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div class="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>

        <main class="relative z-10 w-full max-w-md mx-4">
            <div class="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 p-8 rounded-2xl shadow-2xl shadow-black/40">
                
                <div class="flex items-center justify-between mb-8">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <h1 class="text-sm font-bold tracking-wider text-slate-400 uppercase">Qafila Core</h1>
                            <p class="text-xs text-slate-500">v1.0.0</p>
                        </div>
                    </div>
                    
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <span class="relative flex h-2 w-2">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Live
                    </span>
                </div>

                <div class="space-y-2 mb-8">
                    <h2 class="text-2xl font-bold tracking-tight text-white">
                        API Server is <span class="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Running!</span>
                    </h2>
                    <p class="text-sm text-slate-400 leading-relaxed">
                        The gateway is active, healthy, and securely operating with Bun & Postgres. Ready to handle traffic.
                    </p>
                </div>

                <div class="grid grid-cols-2 gap-3 mb-6">
                    <div class="bg-slate-950/40 border border-slate-800/50 rounded-xl p-3.5">
                        <span class="block text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-0.5">Database</span>
                        <span class="text-sm font-semibold text-emerald-400">Connected</span>
                    </div>
                    <div class="bg-slate-950/40 border border-slate-800/50 rounded-xl p-3.5">
                        <span class="block text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-0.5">Environment</span>
                        <span class="text-sm font-semibold text-slate-300">Development</span>
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                    <span>Runtime: <strong class="text-slate-400 font-medium">Bun</strong></span>
                    <span class="text-slate-400 font-medium">Powered by Hono</span>
                </div>

            </div>
        </main>

    </body>
    </html>
  `;
};