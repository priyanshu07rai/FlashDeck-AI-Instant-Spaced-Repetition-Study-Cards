import { useState, useEffect, useRef } from 'react'
import StickyTabs from './components/ui/sticky-section-tabs'
import ChatInterface from './components/ChatInterface'
import Flashcard from './components/Flashcard'
import Carousel from './components/Carousel'
import PDFOverlay from './components/PDFOverlay'
import InDepthPanel from './components/InDepthPanel'
import TopicDetailView from './components/TopicDetailView'
import FlowchartSection from './components/FlowchartSection'
import { Upload, FileText, Zap, Brain, Check, Sparkles, BookOpen, X, Image as ImageIcon, FileType, MessageSquare, Bookmark, Play, Layout, Search } from 'lucide-react'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showGuide, setShowGuide] = useState(false)
  const [cards, setCards] = useState([])
  const [deckName, setDeckName] = useState("")
  const [selectedCard, setSelectedCard] = useState(null)
  const [activeInDepthIndex, setActiveInDepthIndex] = useState(null)
  const [selectedSubTopic, setSelectedSubTopic] = useState(null)
  const [showPDF, setShowPDF] = useState(false)
  const [flowcharts, setFlowcharts] = useState([])
  const [isGeneratingFlowchart, setIsGeneratingFlowchart] = useState(false)

  // Master UX State
  const [isStudyMode, setIsStudyMode] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [savedTopics, setSavedTopics] = useState(() => {
    const saved = localStorage.getItem('flashdeck_saved_topics');
    return saved ? JSON.parse(saved) : [];
  })

  // Navigation Logic Simplified
  const [activeTab, setActiveTab] = useState('review')

  const cardsRef = useRef(null)
  const inDepthRef = useRef(null)
  const chatRef = useRef(null)

  // Sync Saved Topics to LocalStorage
  useEffect(() => {
    localStorage.setItem('flashdeck_saved_topics', JSON.stringify(savedTopics));
  }, [savedTopics]);

  // Calculate Progress (REMOVED)
  const progressPercent = 0;

  const handleNavigate = (id) => {
    setActiveInDepthIndex(null);
    setSelectedSubTopic(null);
  }

  const toggleSaveItem = (item) => {
    setSavedTopics(prev => {
      const isExist = prev.find(t => t.id === item.id);
      if (isExist) return prev.filter(t => t.id !== item.id);
      return [...prev, {
        ...item,
        parentCard: item.parentCard || cards[activeInDepthIndex]?.q || 'Unknown'
      }];
    });
  }

  const askAiAboutSource = (item) => {
    const cardTitle = item.type === 'card' ? item.question : item.title;
    const cardContent = item.type === 'card' ? item.answer : item.content;
    const pdfName = file?.name || "Unknown Document";

    const prompt = `Explain the following flashcard clearly and in more detail.

Card Question:
${cardTitle}

Card Answer:
${cardContent}

PDF Source:
${pdfName}

Keep the explanation concise and student-friendly.`;

    // 1. Switch tab to Chat using the actual ID as used by StickyTabs
    setActiveTab('chat');

    // 2. Auto-send via ref WITH context
    if (chatRef.current) {
      chatRef.current.handleExternalMessage(prompt, { ...item, pdfName });
    }
  }

  const findCardSource = (item) => {
    const cardTitle = item.type === 'card' ? item.question : item.title;
    const cardContent = item.type === 'card' ? item.answer : item.content;
    const pdfName = file?.name || "Unknown Document";

    const prompt = `Find the source of the following flashcard in the PDF.

Card Question:
${cardTitle}

Card Answer:
${cardContent}

PDF Name:
${pdfName}

Please respond with:
• Section title
• Page number (as shown in the PDF UI)
• Brief context (1 line)

If the exact page number is not certain, clearly say so.
Do NOT guess.`;

    setActiveTab('chat');

    if (chatRef.current) {
      chatRef.current.handleExternalMessage(prompt, { ...item, pdfName });
    }
  }

  const generateFlowcharts = async (currentCards = null) => {
    const listToUse = currentCards || cards;
    if (!listToUse || listToUse.length === 0) return;

    setIsGeneratingFlowchart(true);
    const topics = listToUse.map(c => c.q).join('\n• ');

    const prompt = `Create a clear flowchart for the chapter based on the following topics.

• Show logical progression
• Use simple boxes and arrows
• Keep it student-friendly
• Do NOT add extra concepts

If the chapter is large, split into multiple flowcharts.

REQUIRED FORMAT:
FLOWCHART: [Title]
• [Point 1]
• [Point 2]
• [Point 3]

--- (separator for multiple flowcharts)

TOPICS:
• ${topics}`;

    try {
      const response = await fetch('http://localhost:8001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: prompt }),
      });

      if (!response.ok) throw new Error("Flowchart generation failed");

      const data = await response.json();
      const content = data.answer;

      // Simple Parser
      const sections = content.split('---');
      const parsedFlows = sections.map(sec => {
        const lines = sec.trim().split('\n');
        let title = "Chapter Overview";
        const items = [];

        lines.forEach(line => {
          if (line.toLowerCase().startsWith('flowchart:')) {
            title = line.replace(/flowchart:/i, '').trim();
          } else if (line.trim().startsWith('•') || line.trim().startsWith('-') || /^\d+\./.test(line.trim())) {
            items.push(line.replace(/^[•\-]|^\d+\.\s*/, '').trim());
          } else if (line.length > 3) {
            // Treat non-bullet lines as items too if relevant
            if (!line.toLowerCase().includes('topics:')) items.push(line.trim());
          }
        });

        return items.length > 0 ? { title, items } : null;
      }).filter(Boolean);

      setFlowcharts(parsedFlows);

    } catch (error) {
      console.error("Flowchart Error:", error);
    } finally {
      setIsGeneratingFlowchart(false);
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setUploadProgress(0);
      setShowGuide(false);

      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setShowGuide(true);
        }
      }, 100);
    }
  }

  const handleGenerate = async () => {
    if (!file) return;
    setLoading(true);
    setCards([]);
    setFlowcharts([]);
    setShowGuide(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8001/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Generation failed");

      const data = await response.json();
      setCards(data.cards);
      setDeckName(data.deck_name);

      // Auto-generate flowcharts
      generateFlowcharts(data.cards);

      setTimeout(() => {
        document.getElementById('flashcards')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error) {
      alert("Error: " + error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#191919] text-gray-200 selection:bg-orange-500/30 font-sans">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#191919]/80 backdrop-blur-md border-b border-white/5 h-14 flex items-center">
        <div className="mx-auto w-full max-w-5xl px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-1.5 rounded-md">
              <Zap size={16} className="text-orange-400" fill="currentColor" />
            </div>
            <span className="font-medium text-sm text-gray-200">FlashDeck AI</span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-gray-500 border border-white/5">BETA</span>
          </div>
          <div className="text-xs text-gray-500 font-mono">v1.1</div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-24 pb-20">

        {/* Header Section */}
        <div className="mx-auto max-w-3xl px-6 mb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-6">
            <Sparkles size={12} />
            <span>AI-Powered Study Assistant</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="text-white">Master your notes.</span> <br />
            <span className="text-gradient-primary">In seconds.</span>
          </h1>

          <p className="text-lg text-gray-400 max-w-lg mx-auto leading-relaxed">
            Drop your lecture slides, PDFs, or notes here. We'll turn them into spaced-repetition flashcards instantly.
          </p>
        </div>

        {/* Sticky Tabs Interface */}
        <div className="mx-auto max-w-5xl">
          <StickyTabs
            mainNavHeight="3.5rem"
            rootClassName="bg-transparent"
            navSpacerClassName="border-b border-white/5 bg-[#191919]/90 backdrop-blur-lg"
            sectionClassName="bg-transparent py-10"
            stickyHeaderContainerClassName="bg-[#191919]/95 backdrop-blur border-b border-white/5"
            titleClassName="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]"
          >
            {/* STEP 1: UPLOAD */}
            <StickyTabs.Item title="Upload" id="upload">
              <div className="max-w-xl mx-auto">
                <div className="group relative transition-all duration-300 hover:scale-[1.01]">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>

                  <div className="relative glass rounded-3xl border border-white/10 p-10 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-[#2a2a2a] rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/5">
                        {file ? <FileText className="text-indigo-400" /> : <Upload className="text-gray-500" />}
                      </div>

                      <h3 className="text-xl font-medium text-white mb-2">
                        {file ? file.name : "Upload PDF"}
                      </h3>

                      {/* Status / Progress */}
                      {file && uploadProgress < 100 ? (
                        <div className="w-full max-w-xs mt-2 mb-8">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full transition-all duration-300 ease-out"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center mb-8 max-w-xs">
                          {file ? "File ready. Click generate below." : "Drag and drop your lecture slides or click to browse files."}
                        </p>
                      )}

                      <div className="relative w-full">
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleFileChange}
                          className={`absolute inset-0 w-full h-full opacity-0 z-20 ${file ? 'hidden' : 'cursor-pointer'}`}
                        />

                        {/* Main Action Button */}
                        <div className="relative">
                          {showGuide && (
                            <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full animate-bounce shadow-lg z-30 pointer-events-none">
                              Click Generate! 👇
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-indigo-600"></div>
                            </div>
                          )}

                          <button
                            disabled={!file || loading || uploadProgress < 100}
                            onClick={loading ? null : handleGenerate}
                            className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 relative z-10
                                ${file && uploadProgress === 100
                                ? 'bg-white text-black hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.3)] ring-2 ring-transparent hover:ring-indigo-500/50'
                                : 'bg-[#2a2a2a] text-gray-500 border border-white/5 hover:bg-[#333] cursor-pointer'}`}
                          >
                            {loading ? (
                              <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                Processing...
                              </span>
                            ) : (
                              <span>{file ? "Generate Flashcards" : "Select File"}</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </StickyTabs.Item>

            {/* STEP 2: FLASHCARDS */}
            <StickyTabs.Item title="Review" id="flashcards">
              {cards.length > 0 ? (
                <>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Active Deck: {deckName || "No Deck Loaded"}</p>
                    </div>

                    {/* Study Mode Toggle */}
                    <button
                      onClick={() => setIsStudyMode(!isStudyMode)}
                      className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all font-bold text-xs uppercase tracking-widest ${isStudyMode
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      {isStudyMode ? <Layout size={16} /> : <Play size={16} />}
                      {isStudyMode ? 'Normal View' : 'Study Mode'}
                    </button>
                  </div>

                  {/* Flashcard View */}
                  <div className="py-4">
                    <div ref={cardsRef} className="pb-10">
                      <Carousel
                        onSlideChange={(index) => setCurrentCardIndex(index)}
                        initialSlide={currentCardIndex}
                        itemCount={isStudyMode ? 1 : 5}
                      >
                        {cards
                          .filter((_, idx) => !isStudyMode || idx === currentCardIndex)
                          .map((card, idx) => {
                            // Map index back to original if filtering for Study Mode
                            const originalIdx = isStudyMode ? currentCardIndex : idx;
                            const currentCard = isStudyMode ? cards[currentCardIndex] : card;

                            return (
                              <Flashcard
                                key={originalIdx}
                                index={originalIdx}
                                question={currentCard.q}
                                answer={currentCard.a}
                                isActive={activeInDepthIndex === originalIdx}
                                isSaved={!!savedTopics.find(t => t.id === `card-${originalIdx}`)}
                                onSaveToggle={toggleSaveItem}
                                onViewPDF={() => setShowPDF(true)}
                                onToggleInDepth={(i) => {
                                  if (activeInDepthIndex === i) {
                                    setActiveInDepthIndex(null);
                                  } else {
                                    setActiveInDepthIndex(i);
                                    setTimeout(() => {
                                      inDepthRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }, 100);
                                  }
                                }}
                                onAskAI={askAiAboutSource}
                                onFindSource={findCardSource}
                              />
                            );
                          })}
                      </Carousel>
                    </div>

                    {/* Detached In-Depth Panel */}
                    <div ref={inDepthRef} className="pb-20">
                      <InDepthPanel
                        cardIndex={activeInDepthIndex}
                        question={activeInDepthIndex !== null ? cards[activeInDepthIndex]?.q : ""}
                        onSubTopicClick={(topic) => {
                          setSelectedSubTopic(topic);
                        }}
                        onClose={() => setActiveInDepthIndex(null)}
                        onAskAI={askAiAboutSource}
                      />
                    </div>
                    {/* Chapter Flowchart Section */}
                    <FlowchartSection
                      flowcharts={flowcharts}
                      loading={isGeneratingFlowchart}
                      onGenerateManual={() => generateFlowcharts()}
                    />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-gray-600">
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full p-4">
                      {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-64 rounded-2xl glass animate-pulse relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <BookOpen size={48} className="mb-4 opacity-20" />
                      <p className="text-sm">No cards yet.</p>
                    </>
                  )}
                </div>
              )}
            </StickyTabs.Item>

            {/* STEP 3: SAVED ITEMS */}
            <StickyTabs.Item title="Saved" id="bookmarks">
              <div className="pb-20">
                <div className="text-center mb-10">
                  <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                    <Bookmark size={32} className="text-indigo-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Saved Collection</h2>
                  <p className="text-gray-500 text-sm">Key insights and cards bookmarked for focused review.</p>
                </div>

                {savedTopics.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {savedTopics.map((item, idx) => (
                      <div
                        key={idx}
                        className="group relative bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 p-6 rounded-[2rem] transition-all hover:-translate-y-1"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${item.type === 'card' ? 'bg-orange-500/10 text-orange-400' : 'bg-indigo-500/10 text-indigo-400'
                            }`}>
                            {item.type === 'card' ? 'Flashcard' : 'Topic'}
                          </span>
                          <button
                            onClick={() => toggleSaveItem(item)}
                            className="text-gray-600 hover:text-red-400 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                          {item.type === 'card' ? item.question : item.title}
                        </h3>
                        <p className="text-xs text-gray-500 mb-6 font-medium">Source: {item.parentCard || 'General'}</p>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => {
                              if (item.type === 'card') {
                                // Navigate to the specific card index
                                const cardIdx = parseInt(item.id.replace('card-', ''));
                                setCurrentCardIndex(cardIdx);
                                document.getElementById('flashcards')?.scrollIntoView({ behavior: 'smooth' });
                              } else {
                                setSelectedSubTopic(item);
                              }
                            }}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                          >
                            Read Definition
                          </button>

                          <button
                            onClick={() => {
                              setShowPDF(true);
                            }}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                          >
                            View in PDF
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem] max-w-2xl mx-auto">
                    <Bookmark size={48} className="text-gray-800 mb-4" />
                    <p className="text-gray-500 font-medium">No saved items yet.</p>
                    <p className="text-xs text-gray-600 mt-2">Bookmark definitions or cards to see them here.</p>
                  </div>
                )}
              </div>
            </StickyTabs.Item>

            {/* STEP 4: CHAT */}
            <StickyTabs.Item title="Chat" id="chat">
              <ChatInterface ref={chatRef} />
            </StickyTabs.Item>

          </StickyTabs>
        </div>
      </div>

      {/* Sub-Topic Detail View */}
      {
        selectedSubTopic && (
          <TopicDetailView
            topic={selectedSubTopic}
            question={activeInDepthIndex !== null ? cards[activeInDepthIndex]?.q : ""}
            isSaved={!!savedTopics.find(t => t.id === selectedSubTopic.id)}
            onSaveToggle={toggleSaveItem}
            onClose={() => setSelectedSubTopic(null)}
            onAskAI={askAiAboutSource}
            onViewPDF={() => setShowPDF(true)}
          />
        )
      }

      {/* PDF Source Overlay */}
      {
        showPDF && file && (
          <PDFOverlay
            file={file}
            onClose={() => {
              setShowPDF(false);
            }}
          />
        )
      }
    </div >
  );
}

export default App;
