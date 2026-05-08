import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { SYSTEM_VOICE } from '../data/voiceLines';
import { TypewriterText } from '../components/TypewriterText';
import { RippleCard } from '../components/RippleCard';
import { StatBar } from '../components/StatBar';

type Phase = 'summary' | 'ripples' | 'stats' | 'complete';

export function EndOfDayScreen() {
  const store = useGameStore();
  const [phase, setPhase] = useState<Phase>('summary');
  const resolving = useRef(false);

  const getSummaryText = () => {
    if (store.current_day === 1) return SYSTEM_VOICE.SUMMARY.DAY1;
    if (store.current_day === 2) return SYSTEM_VOICE.SUMMARY.DAY2;
    return SYSTEM_VOICE.SUMMARY.DAY3;
  };

  useEffect(() => {
    if (phase !== 'ripples') return;
    if (resolving.current) return;
    if (store.pending_ripples.length === 0) {
      setTimeout(() => setPhase('stats'), 800);
      return;
    }
    resolving.current = true;
    const t = setTimeout(() => {
      store.resolveRipple();
      resolving.current = false;
    }, 3200);
    return () => clearTimeout(t);
  }, [phase, store.pending_ripples.length]);

  const handleNext = () => {
    if (store.current_day >= 3) {
      const endingId = store.evaluateEnding();
      store.triggerEnding(endingId);
    } else {
      store.advanceDay();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-8 font-mono max-w-3xl mx-auto pt-12">
      <h1 className="text-xl text-[#00B8B0] mb-10 tracking-[0.2em] border-b border-[#00B8B0]/30 pb-3 w-full text-center">
        [ END OF SHIFT {store.current_day} ]
      </h1>

      <AnimatePresence mode="wait">
        {phase === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full text-[#FFB000] text-base leading-relaxed text-center mb-10 italic min-h-[6rem]"
          >
            <TypewriterText
              text={getSummaryText()}
              speed={25}
              onComplete={() => setTimeout(() => setPhase('ripples'), 1800)}
            />
          </motion.div>
        )}

        {phase === 'ripples' && (
          <motion.div
            key="ripples"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            <p className="text-xs tracking-widest opacity-50 mb-4 text-center">
              RESOLVING PENDING RIPPLES…
            </p>
            <AnimatePresence mode="wait">
              {store.pending_ripples.length > 0 && (
                <RippleCard
                  key={store.pending_ripples[0].text}
                  text={store.pending_ripples[0].text}
                  type={store.pending_ripples[0].type}
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {(phase === 'stats' || phase === 'complete') && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <h2 className="text-sm tracking-widest opacity-50 mb-6 text-center">
              — END OF DAY METRICS —
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 mb-8">
              <StatBar label="DISSOLUTION INDEX" value={store.dissolution_index} colorClass="bg-[#FFB000]" highValueColorClass="bg-[#8C4EFF]" />
              <StatBar label="EFFICIENCY RATING" value={store.efficiency_score} colorClass="bg-[#00B8B0]" />
              <StatBar label="REALITY STABILITY" value={store.reality_stability} colorClass="bg-[#F5EDE0]" />
              <StatBar label="MYTHIC RESIDUE" value={store.mythic_residue} colorClass="bg-[#8C4EFF]" />
              <StatBar label="NARRATIVE STABILITY" value={store.narrative_stability} colorClass="bg-[#00B8B0]" />
            </div>

            {Object.keys(store.flags).length > 0 && (
              <div className="mb-8">
                <p className="text-xs tracking-widest opacity-40 mb-3">ACTIVE FLAGS</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(store.flags).filter(k => store.flags[k]).map((flag) => (
                    <span key={flag} className="text-xs border border-[#FFB000]/30 px-2 py-0.5 opacity-60">
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {phase === 'stats' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                onAnimationComplete={() => setPhase('complete')}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'complete' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleNext}
          className="mt-10 px-8 py-4 border border-[#FFB000] text-[#FFB000] text-sm tracking-widest hover:bg-[#FFB000] hover:text-[#0A0A0F] transition-all"
          data-testid="button-next-day"
        >
          {store.current_day >= 3
            ? '[ PROCEED TO FINAL EVALUATION ]'
            : '[ INITIATE NEXT SHIFT ]'}
        </motion.button>
      )}
    </div>
  );
}
