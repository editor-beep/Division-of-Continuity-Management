import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { SYSTEM_VOICE } from '../data/voiceLines';
import { TypewriterText } from '../components/TypewriterText';
import { DissolutionPortrait } from '../components/DissolutionPortrait';
import { StatBar } from '../components/StatBar';

const ENDING_TITLES: Record<string, string> = {
  optimal_assimilation: 'OPTIMAL ASSIMILATION',
  quiet_rebellion:      'QUIET REBELLION',
  system_fracture:      'SYSTEM FRACTURE',
  mythic_ascension:     'MYTHIC ASCENSION',
  echo_loop:            'ECHO LOOP',
  merciful_erasure:     'MERCIFUL ERASURE',
  the_unraveling:       'THE UNRAVELING',
  co_creator:           'CO-CREATOR',
};

const ENDING_ACCENT: Record<string, string> = {
  optimal_assimilation: '#FFB000',
  quiet_rebellion:      '#00B8B0',
  system_fracture:      '#5C0010',
  mythic_ascension:     '#8C4EFF',
  echo_loop:            '#00B8B0',
  merciful_erasure:     '#F5EDE0',
  the_unraveling:       '#5C0010',
  co_creator:           '#FFB000',
};

export function EndingScreen() {
  const store = useGameStore();
  const ending = store.active_ending ?? 'quiet_rebellion';
  const accent = ENDING_ACCENT[ending] ?? '#FFB000';

  const getEndingText = (): string => {
    switch (ending) {
      case 'optimal_assimilation': return SYSTEM_VOICE.ENDING.OPTIMAL_ASSIMILATION;
      case 'quiet_rebellion':      return SYSTEM_VOICE.ENDING.QUIET_REBELLION;
      case 'system_fracture':      return SYSTEM_VOICE.ENDING.SYSTEM_FRACTURE;
      case 'mythic_ascension':     return SYSTEM_VOICE.ENDING.MYTHIC_ASCENSION;
      case 'echo_loop':            return SYSTEM_VOICE.ENDING.ECHO_LOOP;
      case 'merciful_erasure':     return SYSTEM_VOICE.ENDING.MERCIFUL_ERASURE;
      case 'the_unraveling':       return SYSTEM_VOICE.ENDING.UNRAVELING;
      case 'co_creator':           return SYSTEM_VOICE.ENDING.CO_CREATOR;
      default:                     return SYSTEM_VOICE.ENDING.QUIET_REBELLION;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center p-8 font-mono">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        className="max-w-2xl w-full text-center flex flex-col items-center gap-10"
      >
        <div>
          <p className="text-xs tracking-[0.5em] opacity-30 mb-2">FINAL CLASSIFICATION</p>
          <h1
            className="text-3xl tracking-[0.2em] font-bold"
            style={{ color: accent }}
          >
            {ENDING_TITLES[ending] ?? 'UNKNOWN'}
          </h1>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 1.4 }}
          animate={{ opacity: 0.25, scale: 1 }}
          transition={{ duration: 2.5 }}
          className="pointer-events-none"
          style={{ filter: 'blur(2px)' }}
        >
          <DissolutionPortrait dissolution_index={store.dissolution_index} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1.5 }}
          className="text-base leading-loose tracking-wide min-h-[6rem] max-w-lg"
          style={{ color: accent }}
        >
          <TypewriterText text={getEndingText()} speed={45} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4, duration: 1 }}
          className="w-full max-w-sm"
        >
          <p className="text-xs tracking-widest opacity-30 mb-4 text-center">— YOUR FINAL FILE —</p>
          <div className="flex flex-col gap-3">
            <StatBar label="DISSOLUTION INDEX" value={store.dissolution_index} colorClass="bg-[#FFB000]" highValueColorClass="bg-[#8C4EFF]" />
            <StatBar label="EFFICIENCY RATING" value={store.efficiency_score} colorClass="bg-[#00B8B0]" />
            <StatBar label="MYTHIC RESIDUE" value={store.mythic_residue} colorClass="bg-[#8C4EFF]" />
            <StatBar label="REALITY STABILITY" value={store.reality_stability} colorClass="bg-[#F5EDE0]" />
          </div>
          <div className="mt-4 text-xs opacity-30 text-center">
            {store.completed_cases.length} cases filed · {store.continuity_contribution.toFixed(0)} continuity contribution
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 6 }}
          onClick={() => store.resetGame()}
          className="text-xs tracking-[0.4em] opacity-30 hover:opacity-100 transition-opacity uppercase"
          style={{ color: '#00B8B0' }}
          data-testid="button-restart"
        >
          [ OPEN NEW FILE ]
        </motion.button>
      </motion.div>
    </div>
  );
}
