import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { SYSTEM_VOICE } from '../data/voiceLines';
import { getCasesForDay } from '../data/cases';
import { TypewriterText } from '../components/TypewriterText';
import { StatBar } from '../components/StatBar';

export function TerminalScreen() {
  const store = useGameStore();
  const [greetingComplete, setGreetingComplete] = useState(false);

  const todayCases = useMemo(() => getCasesForDay(store.current_day), [store.current_day]);

  const availableCases = useMemo(
    () =>
      todayCases.filter(
        (c) => c.requires_flag === '' || store.hasFlag(c.requires_flag)
      ),
    [todayCases, store.flags]
  );

  const allAvailableComplete = availableCases.every((c) =>
    store.completed_cases.includes(c.id)
  );

  const getGreeting = () => {
    if (store.current_day === 3 && store.dissolution_index >= 50) {
      return SYSTEM_VOICE.GREETING.DAY3_HIGH_DISSOLUTION;
    }
    if (store.current_day === 1) return SYSTEM_VOICE.GREETING.DAY1;
    if (store.current_day === 2) return SYSTEM_VOICE.GREETING.DAY2;
    return SYSTEM_VOICE.GREETING.DAY3;
  };

  const getCaseStatus = (caseId: string) => {
    if (store.completed_cases.includes(caseId)) return 'complete';
    if (store.deferred_cases.includes(caseId)) return 'deferred';
    return 'pending';
  };

  const handleCaseSelect = (caseId: string, locked: boolean) => {
    if (locked) return;
    const status = getCaseStatus(caseId);
    if (status === 'complete') return;
    store.setActiveCase(caseId);
    store.setGamePhase('case');
  };

  return (
    <div className="min-h-screen p-6 font-mono text-[#FFB000] flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto">
      <div className="flex-1 flex flex-col gap-5">
        <div className="border border-[#FFB000]/40 p-5 bg-[#0A0A0F]/90">
          <div className="flex items-center justify-between mb-4 border-b border-[#FFB000]/30 pb-3">
            <h1 className="text-xl tracking-[0.2em]">[ TERMINAL — DAY {store.current_day} ]</h1>
            <span className="text-xs border border-[#FFB000]/40 px-2 py-1 tracking-widest opacity-70">
              ERA {store.era}
            </span>
          </div>
          <div className="min-h-[4rem] text-sm leading-relaxed text-[#00B8B0] italic">
            <TypewriterText
              text={getGreeting()}
              speed={18}
              onComplete={() => setGreetingComplete(true)}
            />
          </div>
        </div>

        {greetingComplete && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-[#FFB000]/40 p-5 bg-[#0A0A0F]/90 flex-1"
          >
            <h2 className="text-base tracking-[0.2em] mb-5 opacity-70">[ ACTIVE QUEUE ]</h2>

            <div className="flex flex-col gap-3">
              {availableCases.map((c) => {
                const isLocked = c.clearance_required > store.clearance_level;
                const status = getCaseStatus(c.id);
                const isEchoCase = c.worker_unit.name.toLowerCase().includes('echo');

                let statusLabel = '[ PENDING ]';
                let statusClass = 'text-[#FFB000]';
                let borderClass = 'border-[#FFB000]/20';

                if (status === 'complete') {
                  statusLabel = '[ FILED ]';
                  statusClass = 'text-[#00B8B0] opacity-40';
                  borderClass = 'border-[#00B8B0]/10';
                } else if (status === 'deferred') {
                  statusLabel = '[ DEFERRED ]';
                  statusClass = 'text-[#8C4EFF] opacity-60';
                  borderClass = 'border-[#8C4EFF]/20';
                } else if (isLocked) {
                  statusLabel = `[ CLEARANCE Θ-${c.clearance_required} REQ ]`;
                  statusClass = 'text-[#5C0010]/60';
                  borderClass = 'border-[#5C0010]/10';
                } else if (isEchoCase) {
                  statusLabel = '[ ANOMALY ]';
                  statusClass = 'text-[#8C4EFF]';
                  borderClass = 'border-[#8C4EFF]/30';
                }

                const clickable = !isLocked && status !== 'complete';

                return (
                  <button
                    key={c.id}
                    onClick={() => handleCaseSelect(c.id, isLocked)}
                    disabled={!clickable}
                    className={`text-left p-4 border ${borderClass} transition-all flex flex-col gap-1.5
                      ${clickable ? 'cursor-pointer hover:bg-[#FFB000]/5 hover:border-[#FFB000]/50' : 'cursor-not-allowed'}
                    `}
                    data-testid={`case-item-${c.id}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-sm font-bold tracking-wide">
                        {c.form_type} — {c.title}
                      </span>
                      <span className={`text-xs shrink-0 ${statusClass}`}>{statusLabel}</span>
                    </div>
                    <div className="text-xs opacity-60">{c.issue.substring(0, 80)}{c.issue.length > 80 ? '…' : ''}</div>
                    <div className="text-xs opacity-40 mt-1">
                      UNIT {c.worker_unit.id} · {c.worker_unit.name}
                    </div>
                  </button>
                );
              })}
            </div>

            {allAvailableComplete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 text-center"
              >
                <button
                  onClick={() => store.setGamePhase('end_of_day')}
                  className="px-8 py-4 bg-[#FFB000] text-[#0A0A0F] font-bold tracking-widest hover:bg-[#F5EDE0] transition-colors text-sm"
                  data-testid="button-end-shift"
                >
                  [ INITIATE END OF SHIFT PROTOCOL ]
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {greetingComplete && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-72 flex flex-col gap-5"
        >
          <div className="border border-[#FFB000]/40 p-5 bg-[#0A0A0F]/90">
            <div className="flex justify-between items-center mb-5 border-b border-[#FFB000]/30 pb-3">
              <span className="text-sm tracking-widest">STATUS</span>
              <span className="text-xs border border-[#FFB000]/40 px-2 py-1 tracking-widest">
                CLEARANCE Θ-{store.clearance_level}
              </span>
            </div>

            <div className="flex flex-col gap-5">
              <StatBar
                label="DISSOLUTION INDEX"
                value={store.dissolution_index}
                colorClass="bg-[#FFB000]"
                highValueColorClass="bg-[#8C4EFF]"
              />
              <StatBar
                label="EFFICIENCY RATING"
                value={store.efficiency_score}
                colorClass="bg-[#00B8B0]"
              />
              <StatBar
                label="REALITY STABILITY"
                value={store.reality_stability}
                colorClass="bg-[#F5EDE0]"
              />
              <StatBar
                label="MYTHIC RESIDUE"
                value={store.mythic_residue}
                colorClass="bg-[#8C4EFF]"
              />
            </div>

            <div className="mt-5 pt-4 border-t border-[#FFB000]/20 text-xs space-y-2 opacity-60">
              <div className="flex justify-between">
                <span>CASES FILED</span>
                <span>{store.completed_cases.length}</span>
              </div>
              <div className="flex justify-between">
                <span>DEPT. STRAIN</span>
                <span>{store.department_strain.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => store.setGamePhase('player_file')}
            className="border border-[#FFB000]/40 p-3 text-xs tracking-widest hover:bg-[#FFB000]/10 transition-colors text-center"
            data-testid="button-player-file"
          >
            [ OPEN CONTINUITY FILE ]
          </button>
        </motion.div>
      )}
    </div>
  );
}
