import { useState, useEffect } from 'react';
import { X, ChevronLeft, FileText, RefreshCw } from 'lucide-react';

export default function PDFOverlay({ file, onClose }) {
    const [pdfURL, setPdfURL] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!file) return;

        setIsLoading(true);
        const fileURL = URL.createObjectURL(file);

        // Simple reliable view without automation
        const url = `${fileURL}#view=FitH`;

        setPdfURL(url);

        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);

        return () => {
            clearTimeout(timer);
            URL.revokeObjectURL(fileURL);
        };
    }, [file]);

    if (!file) return null;

    return (
        <div className="fixed inset-0 z-[200] flex animate-in fade-in duration-300">
            <div
                className="absolute inset-0 bg-black/95 backdrop-blur-md"
                onClick={onClose}
            />

            <div className="relative ml-auto w-full max-w-5xl bg-[#0a0a0a] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out">
                {/* Toolbar */}
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02] backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-xs font-bold border border-white/5"
                        >
                            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Return
                        </button>
                        <div className="h-6 w-px bg-white/10" />
                        <div className="flex flex-col">
                            <h3 className="text-sm font-bold text-white truncate max-w-[300px]">
                                {file.name}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium font-mono uppercase tracking-widest">
                                <FileText size={10} className="text-gray-400" />
                                <span>Source Document Reference</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2.5 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Viewer Area */}
                <div className="flex-1 bg-[#1a1a1a] relative overflow-hidden">
                    {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0a0a0a]">
                            <RefreshCw size={40} className="text-indigo-500 animate-spin" />
                            <p className="text-sm text-gray-500 font-medium font-mono uppercase tracking-widest">Loading Reference Document...</p>
                        </div>
                    ) : (
                        <iframe
                            src={pdfURL}
                            className="w-full h-full border-none animate-in fade-in duration-700"
                            title="PDF Viewer"
                        />
                    )}
                </div>

                {/* Footer info */}
                <div className="px-8 py-4 border-t border-white/10 bg-white/[0.01] text-[10px] text-gray-600 font-mono flex justify-between items-center uppercase tracking-[0.2em]">
                    <span>STABILITY-FIRST REFERENCE • NATIVE VIEWER</span>
                    <div className="flex items-center gap-4">
                        <span>FLASHDECK AI</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
