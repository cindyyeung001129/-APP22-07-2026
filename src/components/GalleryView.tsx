import React from 'react';
import { ArrowLeft, Camera, Lock, CheckCircle2 } from 'lucide-react';
import { playClickSound } from '../utils/audio';
import { ALL_CARDS } from '../cardsData';

interface GalleryViewProps {
  unlockedCards: string[];
  onBack: () => void;
  onScan: () => void;
}

export default function GalleryView({ unlockedCards, onBack, onScan }: GalleryViewProps) {
  const totalCards = ALL_CARDS.length;
  const unlockedCount = unlockedCards.length;
  const progressPercent = Math.round((unlockedCount / totalCards) * 100);

  return (
    <div className="flex-1 flex flex-col space-y-4 py-2 px-1 overflow-y-auto -mt-1 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-2">
        <button
          onClick={() => {
            playClickSound(400, 'sine');
            onBack();
          }}
          className="p-2 -ml-2 rounded-full hover:bg-brand-sand text-gray-500 transition active:scale-95 flex items-center gap-1"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-bold">返回</span>
        </button>
        <h2 className="text-xl font-black text-gray-800 font-sans tracking-tight">我的圖鑑</h2>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Scan Button */}
      <button
        onClick={() => {
          playClickSound(500, 'sine');
          onScan();
        }}
        className="w-full py-3 bg-white hover:bg-gray-50 border-2 border-brand-sand rounded-2xl flex items-center justify-center gap-2 text-brand-moss font-bold text-sm shadow-sm transition active:scale-95"
      >
        <Camera className="w-5 h-5" />
        <span>點擊掃描語錄卡</span>
      </button>

      {/* Progress Bar */}
      <div className="bg-white p-4 rounded-2xl border-2 border-brand-sand shadow-sm space-y-2">
        <div className="flex justify-between items-center text-sm font-bold text-gray-700">
          <span>收集進度</span>
          <span>{progressPercent}% ({unlockedCount}/{totalCards})</span>
        </div>
        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-sage transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        {ALL_CARDS.map(card => {
          const isUnlocked = unlockedCards.includes(card.id);
          
          return (
            <div
              key={card.id}
              className={`relative aspect-[3/4] rounded-xl border-2 overflow-hidden flex flex-col transition-all ${
                isUnlocked 
                  ? 'border-brand-sage bg-white shadow-sm' 
                  : 'border-gray-200 bg-gray-50 grayscale opacity-70'
              }`}
            >
              {isUnlocked ? (
                <>
                  <div className="absolute top-1.5 right-1.5 z-10 bg-white rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-brand-sage fill-brand-sage/20" />
                  </div>
                  <img
                    src={card.imageUrl}
                    alt={`Card ${card.id}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <span className="text-white text-xs font-bold drop-shadow-sm">#{card.id}</span>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-2">
                  <Lock className="w-6 h-6 text-gray-300" />
                  <span className="text-xs font-bold text-gray-400">#{card.id}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
