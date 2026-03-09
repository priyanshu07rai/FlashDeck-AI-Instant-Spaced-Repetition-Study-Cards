import { Share2, GitCommit, ArrowRight, Sparkles } from 'lucide-react';

export function FlowchartCard({ title, items }) {
    return (
        <div className="min-w-[300px] md:min-w-[400px] bg-[#1a1a1a]/80 backdrop-blur-xl rounded-[2rem] border border-emerald-500/20 p-8 shadow-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-500">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <GitCommit size={18} className="text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
                </div>

                <div className="space-y-6">
                    {items.map((item, idx) => (
                        <div key={idx} className="relative">
                            {/* Connecting Line */}
                            {idx < items.length - 1 && (
                                <div className="absolute left-[17px] top-[34px] w-[2px] h-[30px] bg-gradient-to-b from-emerald-500/50 to-emerald-500/10" />
                            )}

                            <div className="flex items-center gap-4 group/item">
                                <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 group-hover/item:bg-emerald-500/20 transition-all shadow-lg shadow-emerald-500/5">
                                    <span className="text-[10px] font-black text-emerald-400">{idx + 1}</span>
                                </div>
                                <div className="px-5 py-3.5 bg-white/[0.03] border border-white/5 rounded-2xl flex-1 hover:bg-white/[0.05] transition-all group-hover/item:border-emerald-500/20">
                                    <p className="text-[13px] font-semibold text-gray-200 leading-snug">{item}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function FlowchartSection({ flowcharts, onGenerateManual, loading }) {
    if (!flowcharts || flowcharts.length === 0) {
        if (!onGenerateManual) return null; // Only show if we can generate
        return (
            <div className="mt-20 mb-32 text-center animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-6">
                    <Sparkles size={12} />
                    Concept Visualization
                </div>
                <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Chapter Flowchart</h2>
                <p className="text-gray-500 max-w-lg mx-auto mb-10 text-sm leading-relaxed">
                    Generate a visual roadmap of the entire chapter to understand how different concepts connect and progress.
                </p>
                <button
                    onClick={onGenerateManual}
                    disabled={loading}
                    className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Analyzing Chapter...' : 'Generate Chapter Flowchart'}
                </button>
            </div>
        );
    }

    return (
        <div className="mt-20 mb-32 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="flex flex-col items-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-6">
                    <GitCommit size={12} />
                    Visual Roadmap
                </div>
                <h2 className="text-4xl font-black text-white tracking-tighter mb-4">Chapter Flowchart</h2>
                <p className="text-gray-500 text-center max-w-md text-sm leading-relaxed">
                    Concept progression and logical flow as identified by our AI analyzer.
                </p>
            </div>

            <div className="relative group">
                {/* Horizontal Scroll Shadows */}
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex gap-8 overflow-x-auto pb-12 px-10 hide-scrollbar scroll-smooth">
                    {flowcharts.map((flow, i) => (
                        <FlowchartCard key={i} title={flow.title} items={flow.items} />
                    ))}
                </div>
            </div>
        </div>
    );
}
