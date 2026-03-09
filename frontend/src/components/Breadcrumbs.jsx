import { ChevronRight, Home, LayoutGrid, FileText, Brain } from 'lucide-react';

export default function Breadcrumbs({ items, onNavigate }) {
    if (!items || items.length === 0) return null;

    return (
        <nav className="flex items-center gap-2 px-6 py-3 mb-6 bg-white/[0.02] border border-white/5 rounded-2xl w-fit animate-in fade-in duration-500">
            <button
                onClick={() => onNavigate('home')}
                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-indigo-400 transition-all"
                title="Home"
            >
                <Home size={16} />
            </button>

            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    <ChevronRight size={14} className="text-gray-700" />
                    <button
                        onClick={() => onNavigate(item.id, index)}
                        disabled={index === items.length - 1}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${index === items.length - 1
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {item.type === 'grid' && <LayoutGrid size={12} />}
                        {item.type === 'card' && <Brain size={12} />}
                        {item.type === 'detail' && <FileText size={12} />}
                        <span className="truncate max-w-[150px]">{item.label}</span>
                    </button>
                </div>
            ))}
        </nav>
    );
}
