import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { SYSTEM_VOICE } from '../data/voiceLines';
import { TypewriterText } from '../components/TypewriterText';
import { RippleCard } from '../components/RippleCard';

export function EndOfDayScreen() {
  const store = useGameStore();
  const [phase, setPhase] = useState<'summary' | 'ripples' | 'complete'>('summary');
  const [currentRippleIndex, setCurrentRippleIndex] = useState(0);

  const getSummaryText = () => {
    if (store.current_day === 1) return SYSTEM_VOICE.SUMMARY.DAY1;
    if (store.current_day === 2) return SYSTEM_VOICE.SUMMARY.DAY2;
    return SYSTEM_VOICE.SUMMARY.DAY3;
  };

  useEffect(() => {
    if (phase === 'ripples') {
      if (currentRippleIndex < store.pending_ripples.length) {
        const timer = setTimeout(() => {
          store.resolveRipple();
          // Keep resolving after a delay
        }, 3000);
        return () => clearTimeout(timer);
      } else {
        setTimeout(() => setPhase('complete'), 1000);
      }
    }
  }, [phase, store.pending_ripples.length]);

  const handleNext = () => {
    if (store.current_day === 3) {
      // Evaluate ending
      const s = store;
      let ending = 'quiet_rebellion';
      if (s.dissolution_index >= 75 && s.efficiency_score >= 85 && s.mythic_residue <= 40) ending = 'optimal_assimilation';
      else if (s.department_strain >= 70 && s.unraveling_events >= 5) ending = 'system_fracture';
      else if (s.mythic_residue >= 70 && s.dissolution_index >= 40) ending = 'mythic_ascension';
      else if (s.active_flags.includes('echo_awareness') && s.completed_cases.filter(id => ['case_005','case_010','case_015'].includes(id)).length >= 2) ending = 'echo_loop';
      else if (s.emotional_surplus >= 30 && s.active_flags.includes('mercy_override_used')) ending = 'merciful_erasure';
      else if (s.efficiency_score <= 25 && s.reality_stability <= 30 && s.unraveling_events >= 3) ending = 'the_unraveling';
      else if (s.dissolution_index >= 45 && s.dissolution_index <= 70 && s.efficiency_score >= 55 && s.efficiency_score <= 80) ending = 'co_creator';

      store.triggerEnding(ending);
    } else {
      store.advanceDay();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 font-mono max-w-3xl mx-auto">
      <h1 className="text-2xl text-[#00B8B0] mb-12 tracking-widest border-b border-[#00B8B0] pb-2 w-full text-center">
        [ END OF SHIFT {store.current_day} ]
      </h1>

      <div className="w-full min-h-[10rem] mb-12 text-[#FFB000] text-lg leading-relaxed text-center px-8">
        {phase === 'summary' && (
          <TypewriterText 
            text={getSummaryText()} 
            speed={30} 
            onComplete={() => setTimeout(() => setPhase('ripples'), 2000)}
          />
        )}
      </div>

      <div className="w-full flex-1">
        <AnimatePresence>
          {phase === 'ripples' && store.pending_ripples.length > 0 && (
            <RippleCard 
              key={store.pending_ripples[0].text} 
              text={store.pending_ripples[0].text} 
              type={store.pending_ripples[0].type} 
            />
          )}
        </AnimatePresence>
      </div>

      {phase === 'complete' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleNext}
          className="mt-12 px-8 py-4 border border-[#FFB000] text-[#FFB000] hover:bg-[#FFB000] hover:text-[#0A0A0F] tracking-widest transition-all"
          data-testid="button-next-day"
        >
          {store.current_day === 3 ? "[ PROCEED TO FINAL EVALUATION ]" : "[ INITIATE NEXT SHIFT ]"}
        </motion.button>
      )}
    </div>
  );
}
