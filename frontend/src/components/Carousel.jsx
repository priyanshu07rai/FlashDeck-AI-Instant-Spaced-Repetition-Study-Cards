import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Carousel({ children }) {
    const scrollRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const checkScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeftArrow(scrollLeft > 10);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    };

    useEffect(() => {
        checkScroll();
        const current = scrollRef.current;
        current?.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);

        // Keyboard navigation
        const handleKeyDown = (e) => {
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowLeft') scroll('left');
            if (e.key === 'ArrowRight') scroll('right');
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            current?.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const scroll = (direction) => {
        if (!scrollRef.current) return;
        const { clientWidth } = scrollRef.current;
        const scrollAmount = clientWidth; // Scroll by one full view
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    };

    return (
        <div className="relative group w-full px-12">
            {/* Left Arrow */}
            {showLeftArrow && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-3 bg-[#1a1a1a]/80 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-indigo-600 transition-all shadow-2xl"
                >
                    <ChevronLeft size={24} />
                </button>
            )}

            {/* Right Arrow */}
            {showRightArrow && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-3 bg-[#1a1a1a]/80 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-indigo-600 transition-all shadow-2xl"
                >
                    <ChevronRight size={24} />
                </button>
            )}

            {/* Horizontal Scroll Area */}
            <div
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto scroll-smooth no-scrollbar snap-x snap-mandatory py-6"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {children.map((child, i) => (
                    <div key={i} className="flex-none w-full md:w-[calc(50%-12px)] lg:w-[calc(20%-20px)] snap-start">
                        {child}
                    </div>
                ))}
            </div>

            {/* Gradient Fades */}
            <div className="absolute left-10 top-0 bottom-0 w-24 bg-gradient-to-r from-[#111] to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute right-10 top-0 bottom-0 w-24 bg-gradient-to-l from-[#111] to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}
