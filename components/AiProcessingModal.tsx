'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const MESSAGES = [
    "마음의 소리를 듣는 중...",
    "감정의 파동을 분석하고 있어요...",
    "당신을 위한 선율을 고르는 중...",
    "거의 다 준비되었어요..."
];

export default function AiProcessingModal({ isOpen }: { isOpen: boolean }) {
    const [progress, setProgress] = useState(0);
    const [messageIdx, setMessageIdx] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            setProgress(0);
            setMessageIdx(0);
            
            // Asymptotic progress (approaches 100% logarithmically)
            const progInterval = setInterval(() => {
                setProgress(prev => {
                    const remaining = 100 - prev;
                    return prev + remaining * 0.1; 
                });
            }, 200);

            // Change messages every 2.5s
            const msgInterval = setInterval(() => {
                setMessageIdx(prev => (prev < 3 ? prev + 1 : prev));
            }, 2500);

            return () => {
                clearInterval(progInterval);
                clearInterval(msgInterval);
            };
        }
    }, [isOpen]);

    // React Portal logic to avoid stacking context issues
    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-[#FFFDF9] border-[3px] border-black shadow-[6px_6px_0px_#000] p-8 max-w-sm w-full mx-4 flex flex-col items-center">
                <div className="w-16 h-16 border-[4px] border-black border-t-transparent rounded-full animate-spin mb-6"></div>
                <h3 className="text-xl font-bold text-black mb-2">{MESSAGES[messageIdx]}</h3>
                
                <div className="w-full h-4 bg-white border-2 border-black rounded-full overflow-hidden mt-4">
                    <div 
                        className="h-full bg-[#B2F5EA] transition-all duration-200 ease-out border-r-2 border-black"
                        style={{ width: `${Math.min(99, Math.floor(progress))}%` }}
                    />
                </div>
                <p className="mt-2 text-sm font-bold text-black">{Math.floor(progress)}%</p>
            </div>
        </div>,
        document.body
    );
}
