import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { SYSTEM_VOICE } from '../data/voiceLines';
import { TypewriterText } from '../components/TypewriterText';
import { DissolutionPortrait } from '../components/DissolutionPortrait';

type BootStage = 'seal' | 'intro1' | 'intro2' | 'login' | 'confirm';

const SEAL_FRAGMENTS = [
  'M 50 5 L 95 50 L 50 95 L 5 50 Z',
  'M 50 15 L 85 50 L 50 85 L 15 50 Z',
  'M 50 25 A 25 25 0 1 1 49.99 25 Z',
  'M 30 30 L 70 30 L 70 70 L 30 70 Z',
  'M 50 5 L 61 35 L 95 35 L 68 57 L 79 91 L 50 70 L 21 91 L 32 57 L 5 35 L 39 35 Z',
];

export function BootScreen() {
  const [stage, setStage] = useState<BootStage>('seal');
  const [loginInput, setLoginInput] = useState('');
  const { setGamePhase, dissolution_index } = useGameStore();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setStage('intro1'), 2200);
    return () => clearTimeout(t);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput.trim()) {
      setStage('confirm');
    }
  };

  const handleConfirmComplete = () => {
    setGamePhase('terminal');
  };

  useEffect(() => {
    if (stage === 'login') {
      setTimeout(() => inputRef.current?.focus(), 2500);
    }
  }, [stage]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-[#FFB000] p-8 font-mono">
      <div className="w-full max-w-lg flex flex-col items-center">
        <AnimatePresence mode="wait">
          {stage === 'seal' && (
            <motion.div
              key="seal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-12 flex flex-col items-center"
            >
              <svg width="180" height="180" viewBox="0 0 100 100" fill="none" stroke="#FFB000" strokeWidth="0.5">
                {SEAL_FRAGMENTS.map((d, i) => (
                  <motion.path
                    key={i}
                    d={d}
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 0.6 + i * 0.08, scale: 1 }}
                    transition={{ delay: i * 0.28, duration: 0.6, ease: 'easeOut' }}
                    stroke="#FFB000"
                    strokeWidth={i === 4 ? '0.8' : '0.4'}
                  />
                ))}
                <motion.circle
                  cx="50" cy="50" r="42"
                  stroke="#FFB000"
                  strokeWidth="0.3"
                  strokeDasharray="3 2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4, rotate: 360 }}
                  transition={{ delay: 1.2, duration: 1.0 }}
                />
              </svg>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 1.6 }}
                className="text-xs tracking-[0.4em] mt-4 opacity-50"
              >
                DIVISION OF CONTINUITY MANAGEMENT
              </motion.p>
            </motion.div>
          )}

          {(stage === 'intro1' || stage === 'intro2' || stage === 'login' || stage === 'confirm') && (
            <motion.div
              key="portrait"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2 }}
              className="mb-10"
            >
              <DissolutionPortrait dissolution_index={dissolution_index} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full min-h-[6rem] mb-8 text-center px-4">
          {stage === 'intro1' && (
            <TypewriterText
              text={SYSTEM_VOICE.BOOT.INTRO_01}
              speed={35}
              className="text-[#FFB000] leading-relaxed"
              onComplete={() => setTimeout(() => setStage('intro2'), 1400)}
            />
          )}
          {stage === 'intro2' && (
            <TypewriterText
              text={SYSTEM_VOICE.BOOT.INTRO_02}
              speed={35}
              className="text-[#FFB000] leading-relaxed"
              onComplete={() => setTimeout(() => setStage('login'), 1400)}
            />
          )}
          {stage === 'login' && (
            <TypewriterText
              text={SYSTEM_VOICE.BOOT.PROMPT}
              speed={30}
              className="text-[#00B8B0] leading-relaxed italic"
            />
          )}
          {stage === 'confirm' && (
            <TypewriterText
              text={SYSTEM_VOICE.BOOT.CLEARANCE_CONFIRM}
              speed={30}
              className="text-[#00B8B0] leading-relaxed"
              onComplete={() => setTimeout(handleConfirmComplete, 1000)}
            />
          )}
        </div>

        <AnimatePresence>
          {stage === 'login' && (
            <motion.form
              key="login-form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 2.2 }}
              onSubmit={handleLogin}
              className="flex flex-col items-center gap-6 w-full"
            >
              <div className="flex items-center gap-3 text-sm tracking-widest">
                <span className="opacity-60">CREDENTIALS</span>
                <span className="opacity-40">›</span>
                <input
                  ref={inputRef}
                  type="password"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  className="bg-transparent border-b border-[#FFB000] text-[#FFB000] outline-none text-center tracking-[0.4em] w-44 pb-1 focus:border-[#00B8B0] transition-colors placeholder-[#FFB000]/30"
                  autoComplete="off"
                  data-testid="input-credentials"
                />
              </div>
              <button
                type="submit"
                disabled={!loginInput.trim()}
                className="mt-4 px-10 py-3 border border-[#FFB000] text-sm tracking-[0.3em] hover:bg-[#FFB000] hover:text-[#0A0A0F] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#FFB000]"
                data-testid="button-login"
              >
                [ INITIALIZE ]
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
