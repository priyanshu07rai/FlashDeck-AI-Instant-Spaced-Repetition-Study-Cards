import { X, ChevronLeft, Sparkles, Bookmark, BookmarkCheck, Brain, FileText } from 'lucide-react';

export default function TopicDetailView({ topic, question, isSaved, onSaveToggle, onClose, onAskAI, onViewPDF }) {
    if (!topic) return null;

    // Exact definition text
    const definition = `This section provides a detailed analysis of "${topic.title}" within the context of ${question}. \n\n• Key concept overview and theoretical foundations.\n• Practical implications and industry examples.\n• Comparative study with related methodologies.\n• Future outlook and emerging trends in this specific sub-domain.`;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#050505]/95 backdrop-blur-2xl animate-in fade-in duration-300">
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            <div className="relative w-full max-w-3xl bg-[#0a0a0a] rounded-[2.5rem] border border-white/10 shadow-[0_0_100px_-20px_rgba(79,70,229,0.3)] overflow-hidden animate-in zoom-in-95 duration-400 ease-out">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[100px] -ml-32 -mb-32"></div>

                <div className="relative z-10">
                    <div className="px-10 py-8 flex items-center justify-between border-b border-white/5 bg-white/[0.01]">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onClose}
                                className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all border border-white/5"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 mb-1">Detailed View</p>
                                <h2 className="text-2xl font-bold text-white tracking-tight">{topic.title}</h2>
                            </div>
                        </div>

                        {/* Save / Bookmark Toggle */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onSaveToggle({ ...topic, type: 'topic', parentCard: question });
                            }}
                            className={`p-4 rounded-2xl border transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${isSaved
                                ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400'
                                : 'bg-white/5 border-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {isSaved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
                            {isSaved ? 'Saved' : 'Save Topic'}
                        </button>
                    </div>

                    <div className="p-12">
                        <div className="p-10 bg-[#111] rounded-[2rem] border border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 transition-all duration-700"></div>

                            <div className="space-y-6">
                                {definition.split('\n').map((line, i) => (
                                    line.startsWith('•') ? (
                                        <div key={i} className="flex gap-4 items-start ml-2 text-indigo-300">
                                            <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.8)]"></div>
                                            <p className="text-lg text-gray-300 font-light leading-relaxed">{line.substring(1).trim()}</p>
                                        </div>
                                    ) : line.trim() === "" ? null : (
                                        <p key={i} className="text-xl text-white font-medium leading-relaxed">{line}</p>
                                    )
                                ))}
                            </div>
                        </div>



                        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
                            <button
                                onClick={() => {
                                    onViewPDF();
                                }}
                                className="w-full sm:w-auto px-8 h-16 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 font-bold rounded-2xl transition-all flex items-center justify-center gap-3"
                            >
                                <FileText size={20} />
                                View in PDF
                            </button>

                            <button
                                onClick={() => {
                                    onAskAI({ type: 'topic', title: topic.title, content: topic.content });
                                }}
                                className="w-full sm:flex-1 h-16 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                            >
                                <Brain size={20} />
                                Ask AI
                            </button>

                            <button
                                onClick={onClose}
                                className="w-full sm:w-auto px-10 h-16 bg-white/5 hover:bg-white/10 border border-white/5 text-gray-300 font-bold rounded-2xl transition-all"
                            >
                                Back to Topics
                            </button>
                        </div>
                    </div>

                    <div className="px-10 py-6 bg-white/[0.01] flex items-center justify-between text-[11px] font-mono text-gray-600 uppercase tracking-widest border-t border-white/5">
                        <div className="flex items-center gap-2">
                            <Sparkles size={12} />
                            FlashDeck AI Premium
                        </div>
                        <span>Final Reference System v3.0</span>
                    </div>
                </div>
            </div>
        </div >
    );
}
