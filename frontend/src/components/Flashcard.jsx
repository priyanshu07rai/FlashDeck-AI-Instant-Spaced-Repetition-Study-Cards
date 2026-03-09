import { useState } from 'react';
import { Sparkles, X, ChevronRight, ZoomIn, Bookmark, BookmarkCheck, Brain, FileText, Search } from 'lucide-react';

export default function Flashcard({ question, answer, index, imageUrl, onToggleInDepth, isActive, isSaved, onSaveToggle, onAskAI, onViewPDF, onFindSource }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    const getImageUrl = () => {
        if (imageUrl) return imageUrl;
        return `https://picsum.photos/seed/${index + 100}/400/200`;
    };

    const handleInDepthClick = (e) => {
        e.stopPropagation();
        onToggleInDepth(index);
    };

    return (
        <>
            <div
                onClick={() => setIsExpanded(true)}
                className={`group relative cursor-pointer transition-all duration-300 hover:-translate-y-2 h-full flex flex-col ${isActive ? 'scale-[1.02]' : 'hover:scale-[1.02]'
                    }`}
            >
                <div className={`absolute -inset-1 rounded-2xl transition-all duration-300 blur-md ${isActive
                    ? 'opacity-80 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500'
                    : 'opacity-0 group-hover:opacity-40 bg-white/20'
                    }`} />

                <div className={`relative bg-[#1a1a1a]/95 backdrop-blur-xl rounded-2xl border overflow-hidden shadow-2xl flex-1 flex flex-col transition-colors duration-300 ${isActive ? 'border-indigo-500/50 shadow-indigo-500/20' : 'border-white/10'
                    }`}>
                    <div className="relative h-32 bg-gradient-to-br from-indigo-900/30 to-purple-900/30 overflow-hidden">
                        {!imageError && (
                            <img
                                src={getImageUrl()}
                                alt=""
                                className={`w-full h-full object-cover transition-all duration-500 ${imageLoaded ? 'opacity-60' : 'opacity-0'
                                    }`}
                                onLoad={() => setImageLoaded(true)}
                                onError={() => setImageError(true)}
                                loading="lazy"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                            <Sparkles size={10} className="text-indigo-400" />
                            <span className="text-[10px] font-medium text-gray-300 tracking-wider">
                                CARD {index + 1}
                            </span>
                        </div>

                        {/* Explicit Source Tag */}
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onFindSource({ type: 'card', question, answer });
                                }}
                                className="px-2 py-1 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5 transition-all text-gray-400 hover:text-white"
                                title="Find source in PDF"
                            >
                                <Search size={10} />
                                <span className="text-[9px] font-bold uppercase tracking-widest">
                                    FIND
                                </span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewPDF();
                                }}
                                className="px-2 py-1 bg-black/60 hover:bg-black/80 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-1.5 transition-all text-gray-400 hover:text-white"
                                title="View in PDF"
                            >
                                <FileText size={10} />
                                <span className="text-[9px] font-bold uppercase tracking-widest">
                                    PDF
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                        <h3 className="text-sm font-semibold text-white leading-snug mb-3 line-clamp-2 transition-colors">
                            {question}
                        </h3>
                        <p className="text-[13px] text-gray-400 leading-relaxed line-clamp-2 mb-4">
                            {answer}
                        </p>

                        <div className="mt-auto space-y-3">
                            <button
                                onClick={handleInDepthClick}
                                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border ${isActive
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                                    : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <ZoomIn size={12} />
                                Explore Details
                            </button>

                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onAskAI({ type: 'card', question, answer });
                                    }}
                                    className="flex-1 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                >
                                    <Brain size={12} />
                                    Ask AI
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSaveToggle({ type: 'card', id: `card-${index}`, question, answer });
                                    }}
                                    className={`p-2 rounded-xl border transition-all ${isSaved
                                        ? 'bg-indigo-600 border-indigo-500 text-white'
                                        : 'bg-white/5 border-white/5 text-gray-500'}`}
                                >
                                    {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isExpanded && !isActive && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsExpanded(false)}
                >
                    <div
                        className="relative bg-[#1a1a1a] w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative h-48 bg-gradient-to-br from-indigo-900/50 to-purple-900/50">
                            {!imageError && (
                                <img
                                    src={getImageUrl()}
                                    alt=""
                                    className="w-full h-full object-cover opacity-50"
                                    onLoad={() => setImageLoaded(true)}
                                    onError={() => setImageError(true)}
                                />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/50 to-transparent" />
                            <button
                                onClick={() => setIsExpanded(false)}
                                className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-gray-400 hover:text-white transition-all"
                            >
                                <X size={18} />
                            </button>

                            {/* Actions in Modal */}
                            <div className="absolute top-4 right-16 flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSaveToggle({ type: 'card', id: `card-${index}`, question, answer });
                                    }}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg border ${isSaved
                                        ? 'bg-indigo-600 border-indigo-500 text-white'
                                        : 'bg-black/40 hover:bg-white/10 border-white/10 text-gray-300'
                                        }`}
                                >
                                    {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                                    {isSaved ? 'Saved' : 'Save Card'}
                                </button>

                                <button
                                    onClick={() => {
                                        setIsExpanded(false);
                                        onViewPDF();
                                    }}
                                    className="px-4 py-2 bg-black/40 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
                                >
                                    <FileText size={14} />
                                    View in PDF
                                </button>

                                <button
                                    onClick={() => {
                                        setIsExpanded(false);
                                        onFindSource({ type: 'card', question, answer });
                                    }}
                                    className="px-4 py-2 bg-black/40 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
                                >
                                    <Search size={14} />
                                    Find Source
                                </button>

                                <button
                                    onClick={() => {
                                        onAskAI({ type: 'card', question, answer });
                                    }}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 backdrop-blur-md rounded-xl text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
                                >
                                    <Brain size={14} />
                                    Ask AI
                                </button>
                            </div>

                            <div className="absolute bottom-4 left-6 flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1 bg-indigo-500 text-white rounded-lg font-bold text-xs shadow-lg">
                                        CARD {index + 1}
                                    </div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Source Reference</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="mb-8">
                                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2 block">Question</span>
                                <h2 className="text-2xl font-bold text-white leading-tight">{question}</h2>
                            </div>
                            <div className="bg-[#252525] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-600" />
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 block">Answer</span>
                                <p className="text-lg text-gray-200 leading-relaxed font-light">{answer}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
