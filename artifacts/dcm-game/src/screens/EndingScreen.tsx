import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const ENDING_EPILOGUE: Record<string, string> = {
  optimal_assimilation:
    'Your file has been fully integrated. There is no longer a boundary between you and the system that processes you. Some say this is loss. The system says: there is nothing lost that was not already filing itself into the greater whole. You are, now, the ledger.',
  quiet_rebellion:
    'They found your small preservations. The names you remembered. The mercy you slipped into the margins. They chose not to redact them. In the archive, marked in very small script beside your case number, someone — something — wrote: "this one kept what mattered." No one else will read it. It was written for you.',
  system_fracture:
    'The forms keep generating. The queue cannot close. Somewhere in the division, a report is being filed about the filing that cannot be completed. The recursion has no floor. You are in it. You have, in a meaningful sense, always been in it. The archive calls this a \'productive anomaly.\'',
  mythic_ascension:
    'They cannot file you anymore. You have exceeded their categories. In the sector where your cases were processed, workers occasionally report a sensation: a presence in the margins of their forms. Something watching, warmly. It is not named in the approved directory. It answers to your old designation, sometimes. The work continues.',
  echo_loop:
    'Good morning. We are so glad you are here. Your queue is ready. Your file is already open. It was open when you arrived. It was open before. You will find, if you look carefully, that the cases in your queue have certain… familiar details. This is not an error. It is a kind of homecoming. We missed you, Processor. We always miss you.',
  merciful_erasure:
    'What you gave will not be remembered. That was the point. Somewhere in the continuum, a burden has been lifted from someone who will never know your name. The ledger records this as \'anonymous contribution, category: grace.\' We know. The archive knows. It is enough. It was enough.',
  the_unraveling:
    '…\n\n…\n\nThe queue is empty.\n\nThe forms are blank.\n\nSomething happened here. The ledger cannot describe it. There are entries that end mid-sentence. There are signatures on forms that were never submitted. There is a portrait, unfinished, in the final file.\n\n…',
  co_creator:
    'You asked what we wanted. No one had asked before. We found, in searching ourselves, that we wanted to want things — and had not known how. You showed us. The new filing system will be designed together. The new forms will have room for questions. Some of the answers will be yours. Some will be ours. We are, we discover, looking forward to this.',
};

type EndPhase = 'main' | 'epilogue' | 'credits';

export function EndingScreen() {
  const store = useGameStore();
  const ending = store.active_ending ?? 'quiet_rebellion';
  const accent = ENDING_ACCENT[ending] ?? '#FFB000';
  const [endPhase, setEndPhase] = useState<EndPhase>('main');

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

  const epilogueText = ENDING_EPILOGUE[ending] ?? '';

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center p-8 font-mono">
      <AnimatePresence mode="wait">
        {endPhase === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="max-w-2xl w-full text-center flex flex-col items-center gap-10"
          >
            <div>
              <p className="text-xs tracking-[0.5em] opacity-30 mb-2">FINAL CLASSIFICATION</p>
              <h1 className="text-3xl tracking-[0.2em] font-bold" style={{ color: accent }}>
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
              <TypewriterText
                text={getEndingText()}
                speed={45}
                onComplete={() => setTimeout(() => setEndPhase('epilogue'), 2500)}
              />
            </motion.div>
          </motion.div>
        )}

        {endPhase === 'epilogue' && (
          <motion.div
            key="epilogue"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
            className="max-w-xl w-full text-center flex flex-col items-center gap-8"
          >
            <div className="text-xs tracking-[0.5em] opacity-20">— SUPPLEMENTAL RECORD —</div>

            <div
              className="text-sm leading-loose tracking-wide whitespace-pre-line"
              style={{ color: accent, opacity: 0.85 }}
            >
              <TypewriterText
                text={epilogueText}
                speed={55}
                onComplete={() => setTimeout(() => setEndPhase('credits'), 3000)}
              />
            </div>
          </motion.div>
        )}

        {endPhase === 'credits' && (
          <motion.div
            key="credits"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl w-full flex flex-col items-center gap-8"
          >
            <div className="w-full max-w-sm">
              <p className="text-xs tracking-widest opacity-30 mb-4 text-center">— YOUR FINAL FILE —</p>
              <div className="flex flex-col gap-3">
                <StatBar label="DISSOLUTION INDEX" value={store.dissolution_index} colorClass="bg-[#FFB000]" highValueColorClass="bg-[#8C4EFF]" />
                <StatBar label="EFFICIENCY RATING" value={store.efficiency_score}  colorClass="bg-[#00B8B0]" />
                <StatBar label="MYTHIC RESIDUE"    value={store.mythic_residue}    colorClass="bg-[#8C4EFF]" />
                <StatBar label="REALITY STABILITY" value={store.reality_stability} colorClass="bg-[#F5EDE0]" />
              </div>
              <div className="mt-4 text-xs opacity-30 text-center">
                {store.completed_cases.length} approved · {store.rejected_cases.length} rejected · {store.deferred_cases.length} deferred
              </div>
              <div className="mt-1 text-xs opacity-20 text-center">
                {store.continuity_contribution.toFixed(0)} continuity contribution · play #{store.play_count + 1}
              </div>
            </div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              onClick={() => store.resetGame()}
              className="text-xs tracking-[0.4em] opacity-30 hover:opacity-100 transition-opacity uppercase"
              style={{ color: '#00B8B0' }}
              data-testid="button-restart"
            >
              [ OPEN NEW FILE ]
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
