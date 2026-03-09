import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Send, Bot, User, Sparkles, MessageCircle } from 'lucide-react';

// Simple custom formatter for Markdown-like syntax (bullets and bold)
const FormattedMessage = ({ content }) => {
    const lines = content.split('\n');

    return (
        <div className="space-y-2 text-sm leading-relaxed">
            {lines.map((line, i) => {
                // Bullet points
                if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*')) {
                    const text = line.trim().substring(1).trim();
                    return (
                        <div key={i} className="flex gap-2 items-start ml-2">
                            <span className="text-indigo-400 mt-1.5 flex-shrink-0 animate-pulse">•</span>
                            <span dangerouslySetInnerHTML={{ __html: formatBold(text) }} />
                        </div>
                    );
                }

                // Empty lines
                if (!line.trim()) return <div key={i} className="h-1" />;

                // Regular lines with bold support
                return (
                    <p key={i} dangerouslySetInnerHTML={{ __html: formatBold(line) }} className="leading-relaxed text-gray-200" />
                );
            })}
        </div>
    );
};

// Helper to bold **text**
const formatBold = (text) => {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
};

const ChatInterface = forwardRef((props, ref) => {
    const [messages, setMessages] = useState([
        { role: 'ai', content: "Hi! I've analyzed your document. **Ask me anything** about it and I'll help you study! \n\n• Summarize concepts\n• Define terms\n• Create examples" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [activeContext, setActiveContext] = useState(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (customText = null, context = null) => {
        const textToSend = customText || input;
        if (!textToSend.trim()) return;

        // Update active context if provided
        if (context) {
            setActiveContext(context);
        }

        // Contextual synthesis for short follow-ups
        let synthesizedPrompt = textToSend;
        const currentActiveContext = context || activeContext;

        const isFollowUp = /^(explain too|explain more|simplify|why\?|give example|more detail|tell me more)/i.test(textToSend.trim());

        if (isFollowUp && currentActiveContext) {
            const pdfStr = currentActiveContext.pdfName || "Unknown Document";
            const pageStr = currentActiveContext.page || 'Page shown in PDF viewer';
            synthesizedPrompt = `[CONTEXT: The following question refers to the card: "${currentActiveContext.question || currentActiveContext.title}". Answer: "${currentActiveContext.answer || currentActiveContext.content}". PDF: ${pdfStr}, Source: ${pageStr}]\n\nUser Question: ${textToSend}`;
        }

        const userMsg = { role: 'user', content: textToSend };
        setMessages(prev => [...prev, userMsg]);
        if (!customText) setInput("");
        setLoading(true);

        try {
            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: synthesizedPrompt,
                    system_instruction: "You are a patient study tutor. When responding to a flashcard-based explanation or follow-ups related to a card, always append exactly one line at the end. Format: 'Source: [PDF Name] — Page [Page Number] (as shown in PDF viewer)'. If the exact page is unknown, use 'Source: [PDF Name] — Page shown in PDF viewer'. Never fabricate numbers. For general chat unrelated to any card context, do NOT append this line."
                }),
            });

            if (!response.ok) throw new Error("Failed to get answer");

            const data = await response.json();
            const aiMsg = { role: 'ai', content: data.answer };
            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error. Make sure a document is **uploaded** first." }]);
        } finally {
            setLoading(false);
        }
    };

    // Expose method to parent
    useImperativeHandle(ref, () => ({
        handleExternalMessage: (message, context = null) => {
            handleSend(message, context);
        }
    }));

    return (
        <div className="flex flex-col h-[650px] max-w-4xl mx-auto glass-dark rounded-3xl overflow-hidden shadow-[0_0_50px_-12px_rgba(79,70,229,0.2)]">
            {/* Header stays the same */}
            <div className="px-8 py-5 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <MessageCircle size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white tracking-wide">Document Tutor</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Active • Gemini 2.0</span>
                        </div>
                    </div>
                </div>
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-[#1a1a1a] bg-[#333]" />
                    ))}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        {msg.role === 'ai' && (
                            <div className="w-9 h-9 rounded-xl glass flex items-center justify-center flex-shrink-0 border border-white/10 shadow-lg">
                                <Bot size={18} className="text-indigo-400" />
                            </div>
                        )}

                        <div
                            className={`max-w-[85%] px-6 py-4 rounded-2xl text-[15px] shadow-sm ${msg.role === 'user'
                                ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-none shadow-indigo-500/10'
                                : 'glass text-gray-200 rounded-bl-none border border-white/5'
                                }`}
                        >
                            <FormattedMessage content={msg.content} />
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#333] to-[#222] flex items-center justify-center flex-shrink-0 border border-white/5 shadow-lg">
                                <User size={18} className="text-indigo-300" />
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-4 animate-fade-in">
                        <div className="w-9 h-9 rounded-xl glass flex items-center justify-center flex-shrink-0 border border-white/10">
                            <Bot size={18} className="text-indigo-400" />
                        </div>
                        <div className="glass px-6 py-5 rounded-2xl rounded-bl-none border border-white/5 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 bg-white/[0.02] border-t border-white/10">
                <div className="relative group max-w-3xl mx-auto">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your question..."
                        className="w-full bg-white/5 text-white placeholder-gray-600 border border-white/10 rounded-2xl py-4.5 pl-6 pr-16 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-medium hover:bg-white/[0.08]"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={!input.trim() || loading}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-30 disabled:grayscale active:scale-95"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
});

export default ChatInterface;
