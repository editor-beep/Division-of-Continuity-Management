import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { SYSTEM_VOICE } from '../data/voiceLines';
import { TypewriterText } from '../components/TypewriterText';
import { DissolutionPortrait } from '../components/DissolutionPortrait';

export function BootScreen() {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  const [loginInput, setLoginInput] = useState('');
  const { setGamePhase, dissolution_index } = useGameStore();

  useEffect(() => {
    // Sequence: 0 -> wait for first voice line -> 1 -> wait for second -> 2 (login)
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput.trim()) {
      setGamePhase('terminal');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-[#FFB000] p-8 max-w-2xl mx-auto font-mono">
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2 }}
        className="mb-12"
      >
        <DissolutionPortrait dissolution_index={dissolution_index} />
      </motion.div>

      <div className="h-32 mb-8 text-center">
        {stage === 0 && (
          <TypewriterText 
            text={SYSTEM_VOICE.BOOT.INTRO_01} 
            speed={40} 
            onComplete={() => setTimeout(() => setStage(1), 1500)}
          />
        )}
        {stage === 1 && (
          <TypewriterText 
            text={SYSTEM_VOICE.BOOT.INTRO_02} 
            speed={40} 
            onComplete={() => setTimeout(() => setStage(2), 1500)}
          />
        )}
        {stage === 2 && (
          <TypewriterText 
            text={SYSTEM_VOICE.BOOT.PROMPT} 
            speed={40} 
          />
        )}
      </div>

      <AnimatePresence>
        {stage === 2 && (
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            onSubmit={handleLogin}
            className="flex flex-col items-center gap-4 w-full"
          >
            <div className="flex items-center gap-2 text-xl">
              <span>CREDENTIALS:</span>
              <input
                type="password"
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                className="bg-transparent border-b-2 border-[#FFB000] text-[#FFB000] outline-none text-center tracking-[0.5em] w-48 focus:border-[#00B8B0] transition-colors"
                autoFocus
                data-testid="input-credentials"
              />
            </div>
            <button
              type="submit"
              disabled={!loginInput.trim()}
              className="mt-8 px-8 py-3 border border-[#FFB000] hover:bg-[#FFB000] hover:text-[#0A0A0F] transition-all tracking-widest disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#FFB000]"
              data-testid="button-login"
            >
              [ INITIALIZE ]
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
