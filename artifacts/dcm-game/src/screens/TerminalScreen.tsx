import { useEffect, useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { SYSTEM_VOICE } from '../data/voiceLines';
import { allCases } from '../data/cases';
import { TypewriterText } from '../components/TypewriterText';
import { StatBar } from '../components/StatBar';

export function TerminalScreen() {
  const store = useGameStore();
  const [greetingComplete, setGreetingComplete] = useState(false);

  const availableCases = useMemo(() => {
    return allCases.filter(c => c.day === store.current_day && (c.requires_flag === "" || store.active_flags.includes(c.requires_flag)));
  }, [store.current_day, store.active_flags]);

  const getGreeting = () => {
    if (store.current_day === 3 && store.dissolution_index >= 50) {
      return SYSTEM_VOICE.GREETING.DAY3_HIGH_DISSOLUTION;
    }
    if (store.current_day === 1) return SYSTEM_VOICE.GREETING.DAY1;
    if (store.current_day === 2) return SYSTEM_VOICE.GREETING.DAY2;
    return SYSTEM_VOICE.GREETING.DAY3;
  };

  const handleCaseSelect = (caseId: string, locked: boolean) => {
    if (locked) return;
    store.setActiveCase(caseId);
    store.setGamePhase('case');
  };

  const allCasesComplete = availableCases.every(c => store.completed_cases.includes(c.id));

  return (
    <div className="min-h-screen p-8 font-mono text-[#FFB000] flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
      {/* Left Column: Queue */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="border border-[#FFB000] p-6 bg-[#0A0A0F]/80">
          <h1 className="text-2xl mb-4 tracking-widest border-b border-[#FFB000] pb-2">
            [ TERMINAL — DAY {store.current_day} ]
          </h1>
          <div className="min-h-[4rem] text-sm leading-relaxed mb-4 text-[#00B8B0]">
            <TypewriterText 
              text={getGreeting()} 
              speed={20} 
              onComplete={() => setGreetingComplete(true)} 
            />
          </div>
        </div>

        {greetingComplete && (
          <div className="border border-[#FFB000] p-6 bg-[#0A0A0F]/80 flex-1">
            <h2 className="text-xl mb-6 tracking-widest">[ ACTIVE QUEUE ]</h2>
            
            <div className="flex flex-col gap-4">
              {availableCases.map((c) => {
                const isComplete = store.completed_cases.includes(c.id);
                const isLocked = c.clearance_required > store.clearance_level;
                
                let statusText = '[ PENDING ]';
                let statusClass = 'text-[#FFB000]';
                
                if (isComplete) {
                  statusText = '[ COMPLETE ]';
                  statusClass = 'text-[#00B8B0] opacity-50';
                } else if (isLocked) {
                  statusText = `[ LOCKED: CLEARANCE ${c.clearance_required} REQ ]`;
                  statusClass = 'text-[#5C0010] opacity-50';
                }

                return (
                  <button
                    key={c.id}
                    onClick={() => handleCaseSelect(c.id, isLocked)}
                    disabled={isComplete || isLocked}
                    className={`text-left p-4 border border-[#FFB000]/30 hover:bg-[#FFB000]/10 hover:border-[#FFB000] transition-all flex flex-col gap-2
                      ${isComplete || isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    data-testid={`case-item-${c.id}`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold">{c.id} : {c.form_type}</span>
                      <span className={statusClass}>{statusText}</span>
                    </div>
                    <div className="text-sm opacity-80">{c.title}</div>
                    <div className="text-xs opacity-60 mt-2">SUBJECT: {c.worker_unit.id} // {c.worker_unit.name}</div>
                  </button>
                );
              })}
            </div>

            {allCasesComplete && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => store.setGamePhase('end_of_day')}
                  className="px-8 py-4 bg-[#FFB000] text-[#0A0A0F] font-bold hover:bg-[#F5EDE0] transition-colors"
                  data-testid="button-end-shift"
                >
                  [ INITIATE END OF SHIFT PROTOCOL ]
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Stats */}
      {greetingComplete && (
        <div className="w-full md:w-80 flex flex-col gap-6">
          <div className="border border-[#FFB000] p-6 bg-[#0A0A0F]/80">
            <div className="flex justify-between items-center mb-6 border-b border-[#FFB000] pb-2">
              <span className="text-xl tracking-widest">STATUS</span>
              <span className="text-xs border border-[#FFB000] px-2 py-1">
                CLEARANCE Θ-{store.clearance_level}
              </span>
            </div>

            <div className="flex flex-col gap-6">
              <StatBar 
                label="DISSOLUTION INDEX" 
                value={store.dissolution_index} 
                max={100}
                colorClass="bg-[#FFB000]"
                highValueColorClass="bg-[#8C4EFF]"
              />
              <StatBar 
                label="EFFICIENCY RATING" 
                value={store.efficiency_score} 
                max={100}
                colorClass="bg-[#00B8B0]"
              />
              <StatBar 
                label="REALITY STABILITY" 
                value={store.reality_stability} 
                max={100}
                colorClass="bg-[#F5EDE0]"
              />
            </div>

            <button
              onClick={() => store.setGamePhase('player_file')}
              className="w-full mt-8 p-3 border border-[#FFB000] hover:bg-[#FFB000] hover:text-[#0A0A0F] transition-all text-center text-sm"
              data-testid="button-player-file"
            >
              [ OPEN CONTINUITY FILE ]
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
