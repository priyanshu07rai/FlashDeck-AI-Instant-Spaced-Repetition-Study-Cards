import { ArrowRight, Sparkles } from 'lucide-react';

export default function InDepthPanel({ cardIndex, question, subTopics, onSubTopicClick, onClose }) {
    if (cardIndex === null) return null;

    // Mock sub-topics if none provided (as per requirements for guided flow)
    const displayTopics = subTopics || [
        { title: "Historical Context", id: 1 },
        { title: "Core Principles", id: 2 },
        { title: "Real-world Applications", id: 3 },
        { title: "Current Challenges", id: 4 }
    ];

    return (
        <div className="mx-auto max-w-5xl mt-8 animate-in slide-in-from-top-4 fade-in duration-500">
            <div className="relative glass-dark rounded-3xl border border-white/10 p-8 shadow-2xl overflow-hidden">
                {/* Header Decor */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={14} className="text-indigo-400" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">Section 2: Guided Learning</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">
                            In-Depth: <span className="text-gray-400 font-medium">{question}</span>
                        </h2>
                        <p className="text-sm text-gray-500 mt-2 max-w-xl">
                            Select a sub-topic below to explore deeper definitions and source material.
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 text-xs font-bold transition-all self-start"
                    >
                        Close Panel
                    </button>
                </div>

                {/* Sub-Topic Pills Area */}
                <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {displayTopics.map((topic, i) => (
                        <button
                            key={topic.id}
                            onClick={() => onSubTopicClick(topic)}
                            className="group relative flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-indigo-500/50 hover:bg-white/[0.08] transition-all text-left animate-in fade-in slide-in-from-bottom-2 duration-300"
                            style={{ animationDelay: `${i * 100}ms` }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs border border-indigo-500/20 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    {i + 1}
                                </div>
                                <span className="text-sm font-semibold text-gray-200 group-hover:text-white">
                                    {topic.title}
                                </span>
                            </div>
                            <ArrowRight size={16} className="text-gray-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
