import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SOS_EXERCISES } from '../moodsData';
import { playClickSound, startCalmingDrone, stopCalmingDrone, speakText } from '../utils/audio';
import { ShieldAlert, Wind, Eye, Music, Volume2, HelpCircle, Sparkles, CheckCircle2, RefreshCw, Play, Square } from 'lucide-react';

const HAVEN_PASSAGES = [
  {
    title: "麥田之風",
    guide: "想像你正走在一片金黃色的麥田裡，微風吹過，帶來溫和的麥香。陽光灑在你的肩膀上，溫暖而踏實。每一步，你都感覺雙腳與大地緊密相連，無比安穩。",
    quote: "「你不需要事事完美，此時此刻，你的存在本身就非常有價值。」"
  },
  {
    title: "壁爐微雨",
    guide: "想像你坐在一間安靜溫馨的小木屋內，面前燃燒著暖洋洋的壁爐。窗外正下著輕柔的小雨，雨滴輕敲玻璃。在這裡，沒有任何人催促你，沒有任何事情需要焦慮。",
    quote: "「外面的世界風雨再大，這裡永遠有一盞溫暖的燈火，為疲憊的你守候。」"
  },
  {
    title: "棉花糖雲朵",
    guide: "想像你躺在一個柔軟、像棉花糖一樣的雲朵上，輕飄飄地浮在晴朗的天空中。地心引力彷彿消失了，你的身體變得無比輕盈。每一次呼吸，你都將輕鬆吸入體內，吐出所有的沉重。",
    quote: "「允許自己慢下來、停下來、歇一會兒。放空和休息，也是一種溫柔的力量。」"
  },
  {
    title: "晨曦山林",
    guide: "想像你置身於清晨的山林中，四周瀰漫著清新的泥土與綠草香氣。一顆清晨的露珠從樹葉上滑落。你大口呼吸著純淨的空氣，感覺身心都被洗滌得乾乾淨淨。",
    quote: "「情緒就像流動的溪水，它會流來，也終將流逝。給自己一點溫柔，明天依然會放晴。」"
  },
  {
    title: "星空沙灘",
    guide: "想像你站在一片寧靜的夜空下，腳下是柔軟溫熱的沙灘，海浪正溫柔地撫摸著你的腳尖。夜空中有無數顆星星正在對你眨眼，像是溫暖的擁抱與無聲的陪伴。",
    quote: "「繁星閃爍是因為黑夜的存在。你的脆弱和敏感，其實也是你最溫柔的光芒。」"
  },
  {
    title: "秘密花園",
    guide: "想像你身在一個開滿了五彩繽紛花朵的小花園裡。有一隻溫柔的小蝴蝶輕輕停在你的指尖，微微顫動翅膀。它彷彿在輕聲對你說：沒事的，有我在呢。",
    quote: "「每一朵花都有自己的花期。不慌不忙，在自己的節奏裡，慢慢盛開就好。」"
  }
];

interface FirstAidViewProps {
  onGoToHome?: () => void;
}

export default function FirstAidView({ onGoToHome }: FirstAidViewProps) {
  const [activeTool, setActiveTool] = useState<'breathing' | 'grounding' | 'haven'>('breathing');
  const [isDroneActive, setIsDroneActive] = useState(false);

  // Safe Haven States
  const [isGuiding, setIsGuiding] = useState(false);
  const [currentPassageIdx, setCurrentPassageIdx] = useState<number>(0);

  // Breathing States
  const [breathingPhase, setBreathingPhase] = useState<'idle' | 'inhale' | 'hold1' | 'exhale' | 'hold2'>('idle');
  const [breathingTimer, setBreathingTimer] = useState(0);
  const [breathingCycleCount, setBreathingCycleCount] = useState(0);
  const breathingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Grounding states
  const [groundingStep, setGroundingStep] = useState(1);
  const [groundingChecked, setGroundingChecked] = useState<Record<number, boolean>>({});
  const [isGroundingStarted, setIsGroundingStarted] = useState(false);
  const [isGroundingFinished, setIsGroundingFinished] = useState(false);

  // Clean up timers & audio drones on unmount
  useEffect(() => {
    return () => {
      if (breathingIntervalRef.current) {
        clearInterval(breathingIntervalRef.current);
      }
      stopCalmingDrone();
    };
  }, []);

  // Breathing loop controller
  const startBreathingLoop = () => {
    playClickSound(520, 'sine');
    setBreathingCycleCount(0);
    if (breathingIntervalRef.current) {
      clearInterval(breathingIntervalRef.current);
    }
    
    // Cycle starts with Inhale (3 seconds)
    runInhalePhase();
  };

  const stopBreathingLoop = () => {
    playClickSound(300, 'sine');
    if (breathingIntervalRef.current) {
      clearInterval(breathingIntervalRef.current);
    }
    setBreathingPhase('idle');
    setBreathingTimer(0);
  };

  const runInhalePhase = () => {
    setBreathingPhase('inhale');
    setBreathingTimer(4);
    speakText('慢慢吸氣，感受身體放鬆。');
    
    let counter = 4;
    breathingIntervalRef.current = setInterval(() => {
      counter--;
      setBreathingTimer(counter);
      if (counter <= 0) {
        clearInterval(breathingIntervalRef.current!);
        runHold1Phase();
      }
    }, 1000);
  };

  const runHold1Phase = () => {
    setBreathingPhase('hold1');
    setBreathingTimer(4);
    speakText('閉住呼吸，安頓心靈。');

    let counter = 4;
    breathingIntervalRef.current = setInterval(() => {
      counter--;
      setBreathingTimer(counter);
      if (counter <= 0) {
        clearInterval(breathingIntervalRef.current!);
        runExhalePhase();
      }
    }, 1000);
  };

  const runExhalePhase = () => {
    setBreathingPhase('exhale');
    setBreathingTimer(4);
    speakText('慢慢呼氣，吐出所有壓力和煩惱。');

    let counter = 4;
    breathingIntervalRef.current = setInterval(() => {
      counter--;
      setBreathingTimer(counter);
      if (counter <= 0) {
        clearInterval(breathingIntervalRef.current!);
        runHold2Phase();
      }
    }, 1000);
  };

  const runHold2Phase = () => {
    setBreathingPhase('hold2');
    setBreathingTimer(4);
    speakText('閉住呼吸，保持平靜。');

    let counter = 4;
    breathingIntervalRef.current = setInterval(() => {
      counter--;
      setBreathingTimer(counter);
      if (counter <= 0) {
        clearInterval(breathingIntervalRef.current!);
        setBreathingCycleCount((prev) => prev + 1);
        // Repeat the loop automatically
        runInhalePhase();
      }
    }, 1000);
  };

  // Toggle synthesized low-frequency calming drone
  const handleToggleDrone = () => {
    const nextState = !isDroneActive;
    setIsDroneActive(nextState);
    playClickSound(nextState ? 600 : 300, 'sine');
    if (nextState) {
      startCalmingDrone();
    } else {
      stopCalmingDrone();
    }
  };

  const toggleGroundingCheck = (stepNum: number) => {
    playClickSound(480, 'sine');
    setGroundingChecked((prev) => ({
      ...prev,
      [stepNum]: !prev[stepNum]
    }));
  };

  return (
    <div className="flex-1 flex flex-col p-1 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-5.5 h-5.5 text-brand-terracotta" />
          <h2 className="text-2xl font-black text-gray-800 font-sans tracking-tight">情緒急救箱</h2>
        </div>
      </div>

      {/* Segmented control for tools */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-brand-sand rounded-2xl border-2 border-brand-sand">
        {[
          { id: 'breathing', label: '深呼吸練習', icon: <Wind className="w-4 h-4" /> },
          { id: 'grounding', label: '五感著陸', icon: <Eye className="w-4 h-4" /> },
          { id: 'haven', label: '避風港文字', icon: <HelpCircle className="w-4 h-4" /> }
        ].map((tool) => (
          <button
            key={tool.id}
            onClick={() => {
              playClickSound(500, 'sine');
              setActiveTool(tool.id as any);
            }}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition duration-150 cursor-pointer ${
              activeTool === tool.id
                ? 'bg-white text-brand-moss font-black shadow-xs'
                : 'text-gray-600 hover:bg-white/40 font-bold'
            }`}
            style={{ minHeight: '44px' }}
          >
            {tool.icon}
            <span className="text-[11px] sm:text-[13px] tracking-tight mt-0.5 font-sans">{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Sound drone generator control */}
      <div className="bg-[#fcfbf9] p-3 rounded-2xl border-2 border-brand-sand/60 shadow-xs flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-xl transition ${isDroneActive ? 'bg-brand-sage/20 text-brand-moss animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-brand-moss">療癒共鳴音</h4>
            <p className="text-[11px] font-bold text-gray-500 leading-tight">幫助腦波平靜 (Web Audio 合鳴)</p>
          </div>
        </div>
        <button
          onClick={handleToggleDrone}
          className={`text-xs px-3 py-1.5 rounded-full font-black border transition duration-200 cursor-pointer ${
            isDroneActive
              ? 'bg-brand-sage border-brand-sage text-white shadow-xs'
              : 'bg-white border-brand-sand/80 text-brand-moss hover:bg-brand-sand/30'
          }`}
          style={{ minHeight: '34px' }}
        >
          {isDroneActive ? '⏹ 關閉' : '▶ 播放'}
        </button>
      </div>

      {/* Main Container Area */}
      <div className="flex-1 bg-white rounded-3xl border-2 border-brand-sand p-3.5 shadow-sm min-h-[200px] flex flex-col justify-between overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTool === 'breathing' && (
            <motion.div
              key="breathing"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex-1 flex flex-col items-center justify-between space-y-3.5 w-full"
            >
              <div className="text-center space-y-1">
                <h3 className="text-base sm:text-lg font-black text-gray-800">🌬️ 4-4-4-4 方形呼吸法</h3>
                <p className="text-sm font-semibold text-brand-moss mt-0.5">吸氣 4 秒 · 閉氣 4 秒 · 呼氣 4 秒 · 閉氣 4 秒</p>
              </div>

              {/* Dynamic step visual card */}
              <div className="bg-gradient-to-br from-brand-sand/15 via-white to-brand-sage/10 rounded-2xl p-4 border-2 border-brand-sand/80 shadow-xs space-y-4 max-w-sm mx-auto w-full">
                <p className="text-sm font-black text-gray-700 text-center select-none">跟著方形，慢慢呼吸：</p>
                
                {/* Breathing Circle Visualizer in the center */}
                <div className="flex justify-center my-1.5">
                  <div className="relative flex items-center justify-center w-28 h-28">
                    {/* Outer pulsing ring */}
                    <motion.div
                      className="absolute rounded-2xl border border-brand-sage/40"
                      animate={{
                        scale:
                          breathingPhase === 'inhale' ? [1, 1.45] :
                          breathingPhase === 'hold1' ? 1.45 :
                          breathingPhase === 'hold2' ? 1 :
                          breathingPhase === 'exhale' ? [1.45, 1] : 1,
                        opacity: breathingPhase === 'idle' ? 0.2 : [0.5, 0.8, 0.5]
                      }}
                      transition={{
                        duration: 4,
                        ease: 'easeInOut',
                        repeat: breathingPhase === 'idle' ? Infinity : 0
                      }}
                      style={{ width: '100%', height: '100%' }}
                    />

                    {/* Main animated ball */}
                    <motion.div
                      className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center text-center shadow-md border-2"
                      style={{
                        backgroundColor:
                          breathingPhase === 'inhale' ? '#e2ece3' :
                          breathingPhase === 'hold1' ? '#fbf4e8' :
                          breathingPhase === 'exhale' ? '#fbeee9' :
                          breathingPhase === 'hold2' ? '#eef2f5' : '#f5f1e9',
                        borderColor:
                          breathingPhase === 'inhale' ? '#8ca48e' :
                          breathingPhase === 'hold1' ? '#f2cc8f' :
                          breathingPhase === 'exhale' ? '#df7a5e' :
                          breathingPhase === 'hold2' ? '#a5b4c4' : '#a8bfa9',
                      }}
                      animate={{
                        scale:
                          breathingPhase === 'inhale' ? [1, 1.45] :
                          breathingPhase === 'hold1' ? 1.45 :
                          breathingPhase === 'hold2' ? 1 :
                          breathingPhase === 'exhale' ? [1.45, 1] : 1,
                      }}
                      transition={{
                        duration: 4,
                        ease: 'linear',
                      }}
                    >
                      <div className="flex flex-col items-center justify-center rounded-full origin-center">
                        <span className="text-xs font-black text-gray-800 tracking-wider">
                          {breathingPhase === 'idle' && '已準備'}
                          {breathingPhase === 'inhale' && '吸氣'}
                          {breathingPhase === 'hold1' && '閉氣'}
                          {breathingPhase === 'hold2' && '閉氣'}
                          {breathingPhase === 'exhale' && '呼氣'}
                        </span>
                        {breathingPhase !== 'idle' && (
                          <span className="text-lg font-black text-brand-moss font-mono mt-0.5">
                            {breathingTimer}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Center status prompt */}
                <div className="text-center bg-brand-sand/20 rounded-xl p-2 max-w-[200px] mx-auto border border-brand-sand/40">
                  <p className="text-xs sm:text-sm font-black text-emerald-800 tracking-tight">
                    {breathingPhase === 'idle' && '準備好後按下方開始'}
                    {breathingPhase === 'inhale' && '🌟 吸氣...肚子慢慢鼓起來'}
                    {breathingPhase === 'hold1' && '⏹️ 閉住呼吸...平靜感覺'}
                    {breathingPhase === 'hold2' && '⏹️ 閉住呼吸...保持平靜'}
                    {breathingPhase === 'exhale' && '🍃 慢慢呼氣...釋放所有緊繃'}
                  </p>
                </div>
              </div>

              {/* Breathing Tool Action Bar */}
              <div className="flex gap-2.5 max-w-sm mx-auto w-full items-center justify-between">
                {breathingPhase === 'idle' ? (
                  <button
                    onClick={startBreathingLoop}
                    className="flex-1 py-3 bg-brand-sage hover:bg-brand-moss text-white rounded-[100px] text-xs sm:text-sm font-black tracking-wider transition shadow-md active:scale-95 cursor-pointer border-0 flex items-center justify-center gap-1.5"
                    style={{ minHeight: '44px' }}
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>開始呼吸循環</span>
                  </button>
                ) : (
                  <button
                    onClick={stopBreathingLoop}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-[100px] text-xs sm:text-sm font-black tracking-wider transition shadow-md active:scale-95 cursor-pointer border-0 flex items-center justify-center gap-1.5"
                    style={{ minHeight: '44px' }}
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                    <span>停止練習</span>
                  </button>
                )}

                {/* Play Instruction TTS */}
                <button
                  onClick={() => {
                    playClickSound(520, 'sine');
                    speakText("深呼吸練習。吸氣四秒，閉氣四秒，呼氣四秒，閉氣四秒。跟著方形的縮放，讓我們一起放鬆。");
                  }}
                  className="p-3 bg-white hover:bg-brand-sand/40 border border-brand-sand text-brand-moss rounded-xl cursor-pointer active:scale-95 transition flex items-center justify-center"
                  style={{ minHeight: '44px', minWidth: '44px' }}
                  title="朗讀練習引導"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* Simple Breathing Counter indicator */}
              <div className="text-center select-none pb-0.5">
                <span className="text-[11px] font-black tracking-wider uppercase text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full inline-block">
                  🔄 已完成 {breathingCycleCount} 次循環
                </span>
              </div>
            </motion.div>
          )}

          {activeTool === 'grounding' && (
            <motion.div
              key="grounding"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex-1 flex flex-col justify-between space-y-3"
            >
              {!isGroundingStarted ? (
                /* Entrance Landing Page */
                <div className="flex-1 flex flex-col justify-between space-y-4 py-2">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-brand-sage/10 text-brand-sage rounded-full flex items-center justify-center mx-auto shadow-inner border border-brand-sage/20">
                      <Eye className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-gray-800">👀 5-4-3-2-1 感官著陸</h3>
                    <p className="text-sm font-bold text-gray-600 leading-relaxed max-w-xs mx-auto">
                      一個協助你平靜下來的練習 🌸
                    </p>
                  </div>

                  <div className="bg-brand-sand/30 p-4 rounded-2xl border-2 border-brand-sand text-left space-y-2 max-w-sm mx-auto w-full">
                    <p className="text-xs sm:text-sm font-black text-brand-moss">進行此練習時，請注意：</p>
                    <ul className="text-xs sm:text-sm font-semibold text-gray-600 space-y-1 pl-1">
                      <li>· 可於座位進行，或選擇感到舒服的位置</li>
                      <li>· 如感到不適，可以隨時停止</li>
                    </ul>
                  </div>

                  <div className="space-y-3 max-w-xs mx-auto w-full">
                    <button
                      onClick={() => {
                        playClickSound(580, 'sine');
                        setIsGroundingStarted(true);
                        setIsGroundingFinished(false);
                        setGroundingStep(1);
                        setGroundingChecked({});
                        speakText("開始感官著陸練習。第一步，視覺：尋找 5 件目光所及的事物。觀看身處空間內的事物即可，例如窗外的樹、桌上的筆、牆上的時鐘。");
                      }}
                      className="w-full py-3.5 bg-brand-sage hover:bg-brand-moss text-white rounded-[100px] text-sm font-black tracking-wider transition shadow-md active:scale-95 cursor-pointer border-0 flex items-center justify-center gap-2"
                      style={{ minHeight: '46px' }}
                    >
                      <span>我準備好了，開始練習</span>
                    </button>
                    <p className="text-xs text-center font-bold text-gray-500 leading-relaxed">
                      👩‍👧‍👦 建議在家長或教師陪同下進行
                    </p>
                  </div>
                </div>
              ) : isGroundingFinished ? (
                /* Finished Success Page */
                <div className="flex-1 flex flex-col justify-between space-y-4 py-2">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-gray-800">🎉 著陸完成！🎉</h3>
                  </div>

                  <div className="bg-brand-sand/30 p-5 rounded-2xl border-2 border-brand-sand text-center space-y-3 max-w-sm mx-auto w-full">
                    <span className="text-xs font-black text-brand-moss bg-brand-sand/60 px-2.5 py-1 rounded-full inline-block">
                      5-4-3-2-1 感官著陸
                    </span>
                    <p className="text-sm font-black text-gray-700 leading-relaxed">
                      「 你做到了！<br /><br />
                      你好棒！<br />
                      下次再來練習喔！」
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto w-full">
                    <button
                      onClick={() => {
                        playClickSound(580, 'sine');
                        setIsGroundingStarted(true);
                        setIsGroundingFinished(false);
                        setGroundingStep(1);
                        setGroundingChecked({});
                        speakText("重新開始著陸練習。第一步，視覺：尋找 5 件目光所及的事物。觀看身處空間內的事物即可，例如窗外的樹、桌上的筆、牆上的時鐘。");
                      }}
                      className="py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-[13px] font-black transition cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-xs border-0"
                      style={{ minHeight: '44px' }}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>再試一次</span>
                    </button>

                    <button
                      onClick={() => {
                        playClickSound(400, 'sine');
                        if (onGoToHome) {
                          onGoToHome();
                        } else {
                          setIsGroundingStarted(false);
                          setIsGroundingFinished(false);
                          setGroundingStep(1);
                        }
                      }}
                      className="py-3 bg-brand-sage hover:bg-brand-moss text-white rounded-xl text-xs sm:text-[13px] font-black transition cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-xs border-0"
                      style={{ minHeight: '44px' }}
                    >
                      <span>回到首頁</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Step by Step Flow */
                <div className="flex-1 flex flex-col justify-between space-y-4">
                  {/* Header */}
                  <div className="text-center space-y-1">
                    <span className="inline-block text-[11px] font-black text-brand-moss bg-brand-sage/10 px-2.5 py-0.5 rounded-full border border-brand-sage/20">
                      感官著陸 - 步驟 {groundingStep} / 5
                    </span>
                  </div>

                  {/* Dynamic step visual card */}
                  <div className="bg-gradient-to-br from-brand-sand/15 via-white to-brand-sage/10 rounded-2xl p-4 border-2 border-brand-sand/80 shadow-xs space-y-3.5 max-w-sm mx-auto w-full">
                    <AnimatePresence mode="wait">
                      {groundingStep === 1 && (
                        <motion.div
                          key="g1"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="space-y-3 text-center sm:text-left"
                        >
                          <h4 className="text-[16px] font-black text-slate-800 leading-snug">
                            👀 第一步：視覺
                          </h4>
                          <p className="text-sm font-black text-emerald-800">
                            尋找 5 件目光所及的事物
                          </p>
                          <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 text-left space-y-1">
                            <p className="text-xs sm:text-sm font-bold text-amber-900">
                              💡 觀看身處空間內的事物即可
                            </p>
                            <p className="text-xs font-medium text-amber-800">
                              （例如：窗外的樹、桌上的筆、牆上的時鐘）
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {groundingStep === 2 && (
                        <motion.div
                          key="g2"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="space-y-3 text-center sm:text-left"
                        >
                          <h4 className="text-[16px] font-black text-slate-800 leading-snug">
                            🖐️ 第二步：觸覺
                          </h4>
                          <p className="text-sm font-black text-emerald-800">
                            尋找 4 件可以觸摸的物件
                          </p>
                          <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 text-left space-y-1">
                            <p className="text-xs sm:text-sm font-bold text-amber-900">
                              💡 用手觸摸屬於自己的物品即可
                            </p>
                            <p className="text-xs font-medium text-amber-800">
                              （例如：你的衣服、文具、手錶）
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {groundingStep === 3 && (
                        <motion.div
                          key="g3"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="space-y-3 text-center sm:text-left"
                        >
                          <h4 className="text-[16px] font-black text-slate-800 leading-snug">
                            👂 第三步：聽覺
                          </h4>
                          <p className="text-sm font-black text-emerald-800">
                            尋找 3 種可以聽見的聲音
                          </p>
                          <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 text-left space-y-1">
                            <p className="text-xs sm:text-sm font-bold text-amber-900">
                              💡 靜心聆聽即可
                            </p>
                            <p className="text-xs font-medium text-amber-800">
                              （例如：身邊同學或老師的聲音）
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {groundingStep === 4 && (
                        <motion.div
                          key="g4"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="space-y-3 text-center sm:text-left"
                        >
                          <h4 className="text-[16px] font-black text-slate-800 leading-snug">
                            👃 第四步：嗅覺
                          </h4>
                          <p className="text-sm font-black text-emerald-800">
                            尋找 2 種可以聞到的氣味
                          </p>
                          <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 text-left space-y-1">
                            <p className="text-xs sm:text-sm font-bold text-amber-900">
                              💡 輕輕留意身邊的氣味
                            </p>
                            <p className="text-xs font-medium text-amber-800">
                              （例如：清新的空氣、書本的氣味）
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {groundingStep === 5 && (
                        <motion.div
                          key="g5"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="space-y-3 text-center sm:text-left"
                        >
                          <h4 className="text-[16px] font-black text-slate-800 leading-snug">
                            👄 第五步：味覺
                          </h4>
                          <p className="text-sm font-black text-emerald-800">
                            尋找 1 種味道
                          </p>
                          <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200/80 text-left space-y-1">
                            <p className="text-xs sm:text-sm font-bold text-amber-900">
                              💡 可飲用自帶清水，或回想喜歡的味道
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Primary Action and TTS */}
                  <div className="flex gap-2.5 max-w-sm mx-auto w-full items-center justify-between">
                    <button
                      onClick={() => {
                        playClickSound(520, 'sine');
                        if (groundingStep < 5) {
                          const nextStep = groundingStep + 1;
                          setGroundingStep(nextStep);
                          if (nextStep === 2) speakText("第二步，觸覺：尋找 4 件可以觸摸的物件。用手觸摸屬於自己的物品即可，例如你的衣服、文具、手錶。");
                          if (nextStep === 3) speakText("第三步，聽覺：尋找 3 種可以聽見的聲音。靜心聆聽即可，例如身邊同學或老師的聲音。");
                          if (nextStep === 4) speakText("第四步，嗅覺：尋找 2 種可以聞到的氣味。輕輕留意身邊的氣味，例如清新的空氣、書本的氣味。");
                          if (nextStep === 5) speakText("第五步，味覺：尋找 1 種味道。可飲用自帶清水，或回想喜歡的味道。");
                        } else {
                          setIsGroundingFinished(true);
                          speakText("太棒了！你完成了感官著陸練習！你做得真棒！");
                        }
                      }}
                      className="flex-1 py-3 bg-brand-sage hover:bg-brand-moss text-white rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-xs border-0"
                      style={{ minHeight: '44px' }}
                    >
                      {groundingStep === 1 && <span>✅ 我已找到 5 件</span>}
                      {groundingStep === 2 && <span>✅ 我已找到 4 件</span>}
                      {groundingStep === 3 && <span>✅ 我已找到 3 種</span>}
                      {groundingStep === 4 && <span>✅ 我已找到 2 種</span>}
                      {groundingStep === 5 && <span>✅ 我已找到 1 種</span>}
                    </button>

                    <button
                      onClick={() => {
                        playClickSound(480, 'sine');
                        if (groundingStep === 1) speakText("👀 第一步，視覺：尋找 5 件目光所及的事物。觀看身處空間內的事物即可，例如窗外的樹、桌上的筆、牆上的時鐘。");
                        if (groundingStep === 2) speakText("🖐️ 第二步，觸覺：尋找 4 件可以觸摸的物件。用手觸摸屬於自己的物品即可，例如你的衣服、文具、手錶。");
                        if (groundingStep === 3) speakText("👂 第三步，聽覺：尋找 3 種可以聽見的聲音。靜心聆聽即可，例如身邊同學或老師的聲音。");
                        if (groundingStep === 4) speakText("👃 第四步，嗅覺：尋找 2 種可以聞到的氣味。輕輕留意身邊的氣味，例如清新的空氣、書本的氣味。");
                        if (groundingStep === 5) speakText("👄 第五步，味覺：尋找 1 種味道。可飲用自帶清水，或回想喜歡的味道。");
                      }}
                      className="p-3 bg-white hover:bg-brand-sand/40 border border-brand-sand text-brand-moss rounded-xl cursor-pointer active:scale-95 transition flex items-center justify-center"
                      style={{ minHeight: '44px', minWidth: '44px' }}
                      title="朗讀本關卡說明"
                    >
                      <Volume2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Dot/Bottom prompt helpers */}
                  <div className="text-center pb-1">
                    <p className="text-xs sm:text-sm font-black text-brand-moss select-none animate-pulse">
                      💡 完成本步驟後，點擊按鈕進入下一步！
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTool === 'haven' && (
            <motion.div
              key="haven"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="flex-1 flex flex-col justify-start space-y-3 mt-[-2px]"
            >
              {!isGuiding ? (
                /* Landing Entrance Screen */
                <div className="flex-1 flex flex-col justify-between space-y-4 py-2">
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-brand-sage/10 text-brand-sage rounded-full flex items-center justify-center mx-auto shadow-inner border border-brand-sage/20">
                      <HelpCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-800">🏡 安全避風港</h3>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 leading-relaxed max-w-xs mx-auto">
                      這是一個專屬你心靈的溫慢小角落。當你感到焦慮、疲憊或不知所措時，點擊開始，讓我們用舒緩的畫面與溫柔的聲音陪伴你。
                    </p>
                  </div>

                  <div className="bg-brand-sand/30 p-4 rounded-2xl border-2 border-brand-sand text-center space-y-2 max-w-sm mx-auto w-full">
                    <span className="text-xs font-black text-brand-moss bg-brand-sand/60 px-2.5 py-0.5 rounded-full inline-block">
                      🌱 內置專屬溫慢篇章
                    </span>
                    <p className="text-xs sm:text-sm font-bold text-slate-600 leading-relaxed">
                      放鬆你的肩膀，閉上雙眼，點擊下方「開始引導」按鈕，展開一段療癒的心靈小語旅行。
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      playClickSound(580, 'sine');
                      const randIdx = Math.floor(Math.random() * HAVEN_PASSAGES.length);
                      setCurrentPassageIdx(randIdx);
                      setIsGuiding(true);
                      const p = HAVEN_PASSAGES[randIdx];
                      speakText(p.guide + " " + p.quote);
                    }}
                    className="w-full py-3 bg-brand-sage hover:bg-brand-moss text-white rounded-[100px] text-xs sm:text-sm font-black tracking-wider transition shadow-md active:scale-95 cursor-pointer border-0 max-w-xs mx-auto flex items-center justify-center gap-2"
                    style={{ minHeight: '44px' }}
                  >
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>開始引導</span>
                  </button>
                </div>
              ) : (
                /* Interactive Guidance Screen */
                <div className="flex-1 flex flex-col justify-between space-y-3 py-1">
                  {/* Header Indicator */}
                  <div className="text-center space-y-1">
                    <h3 className="text-base font-black text-emerald-800 tracking-tight">
                      🏡 【 {HAVEN_PASSAGES[currentPassageIdx].title} 】
                    </h3>
                  </div>

                  {/* Healing Page Box */}
                  <div className="bg-gradient-to-br from-brand-sand/15 via-white to-brand-sage/10 rounded-2xl p-3 sm:p-4 border-2 border-brand-sand/80 shadow-xs text-center space-y-3.5 max-w-sm mx-auto w-full">
                    {/* Text Guide */}
                    <div className="space-y-1 text-left">
                      <span className="text-xs uppercase font-black tracking-wider text-brand-sage block select-none">
                        🧭 呼吸與想像導引
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed font-sans">
                        {HAVEN_PASSAGES[currentPassageIdx].guide}
                      </p>
                    </div>

                    {/* Divider Line */}
                    <div className="border-t border-dashed border-brand-sand my-0.5" />

                    {/* Warm Quote */}
                    <div className="space-y-1 text-left bg-white/70 p-2.5 rounded-xl border border-brand-sand/40">
                      <span className="text-xs uppercase font-black tracking-wider text-amber-700 block select-none">
                        💖 避風港溫暖語錄
                      </span>
                      <p className="text-xs sm:text-sm font-black text-emerald-800 leading-relaxed italic font-sans">
                        {HAVEN_PASSAGES[currentPassageIdx].quote}
                      </p>
                    </div>
                  </div>

                  {/* Sub-Actions Bar (換一段、語音、結束) */}
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto w-full">
                    {/* 1. 換一段 (Next Segment) */}
                    <button
                      onClick={() => {
                        playClickSound(520, 'sine');
                        let nextIdx = currentPassageIdx;
                        if (HAVEN_PASSAGES.length > 1) {
                          while (nextIdx === currentPassageIdx) {
                            nextIdx = Math.floor(Math.random() * HAVEN_PASSAGES.length);
                          }
                        }
                        setCurrentPassageIdx(nextIdx);
                        const p = HAVEN_PASSAGES[nextIdx];
                        speakText(p.guide + " " + p.quote);
                      }}
                      className="py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-[13px] font-black transition cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-xs border-0"
                      style={{ minHeight: '40px' }}
                      title="隨記切換下一篇溫暖引導"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>換一段</span>
                    </button>

                    {/* 2. 語音 (TTS Play) */}
                    <button
                      onClick={() => {
                        playClickSound(560, 'sine');
                        const p = HAVEN_PASSAGES[currentPassageIdx];
                        speakText(p.guide + " " + p.quote);
                      }}
                      className="py-2.5 bg-brand-sage hover:bg-brand-moss text-white rounded-xl text-xs sm:text-[13px] font-black transition cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-xs border-0"
                      style={{ minHeight: '40px' }}
                      title="播放當前語音引導"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>語音</span>
                    </button>

                    {/* 3. 結束 (Exit / Back to start) */}
                    <button
                      onClick={() => {
                        playClickSound(400, 'sine');
                        if ('speechSynthesis' in window) {
                          window.speechSynthesis.cancel();
                        }
                        setIsGuiding(false);
                      }}
                      className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs sm:text-[13px] font-black transition cursor-pointer flex items-center justify-center gap-1 active:scale-95 shadow-2xs border border-gray-200"
                      style={{ minHeight: '40px' }}
                    >
                      <span>結束</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
