import { useGameStore } from '../store/gameStore';
import { SYSTEM_VOICE } from '../data/voiceLines';
import { TypewriterText } from '../components/TypewriterText';
import { DissolutionPortrait } from '../components/DissolutionPortrait';
import { StatBar } from '../components/StatBar';

export function PlayerFileScreen() {
  const store = useGameStore();

  const getObservationText = () => {
    if (store.dissolution_index >= 70) return SYSTEM_VOICE.PLAYER_FILE.OPEN_HIGH_DISSOLUTION;
    if (store.dissolution_index >= 50) return SYSTEM_VOICE.PLAYER_FILE.OPEN_DISSOLVING;
    if (store.emotional_surplus > 40) return SYSTEM_VOICE.PLAYER_FILE.OBSERVATION_HIGH_SURPLUS;
    if (store.hasFlag('echo_awareness')) return SYSTEM_VOICE.PLAYER_FILE.OBSERVATION_ECHO_EXPERIENCED;
    return SYSTEM_VOICE.PLAYER_FILE.OPEN_FIRST_TIME;
  };

  const activeFlags = Object.keys(store.flags).filter((k) => store.flags[k]);

  return (
    <div className="min-h-screen p-6 font-mono text-[#FFB000] max-w-5xl mx-auto flex flex-col">
      <div className="flex justify-between items-center mb-8 border-b border-[#FFB000]/30 pb-4">
        <h1 className="text-lg tracking-[0.2em]">[ CONTINUITY FILE : PROCESSOR Θ ]</h1>
        <button
          onClick={() => store.setGamePhase('terminal')}
          className="border border-[#FFB000]/40 px-4 py-2 text-xs tracking-widest hover:bg-[#FFB000] hover:text-[#0A0A0F] transition-colors"
          data-testid="button-close-file"
        >
          CLOSE FILE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
        <div className="col-span-1 flex flex-col items-center gap-5">
          <DissolutionPortrait dissolution_index={store.dissolution_index} />

          <div className="w-full border border-[#FFB000]/20 p-4 text-xs space-y-2.5">
            <div className="flex justify-between">
              <span className="opacity-40">DESIGNATION</span>
              <span>PROCESSOR Θ</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-40">CLEARANCE</span>
              <span>Θ-{store.clearance_level}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-40">ERA</span>
              <span>{store.era}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-40">CASES FILED</span>
              <span>{store.completed_cases.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-40">CONTINUITY CONTRIB.</span>
              <span>{store.continuity_contribution.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="col-span-2 flex flex-col gap-7">
          <div className="bg-[#0A0A0F] border border-[#FFB000]/20 p-5 shadow-inner">
            <div className="text-xs opacity-40 mb-2 tracking-widest">SYSTEM OBSERVATION</div>
            <div className="text-[#00B8B0] italic text-sm leading-relaxed min-h-[4rem]">
              <TypewriterText text={getObservationText()} speed={25} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            <StatBar label="DISSOLUTION INDEX" value={store.dissolution_index} colorClass="bg-[#FFB000]" highValueColorClass="bg-[#8C4EFF]" />
            <StatBar label="EFFICIENCY RATING" value={store.efficiency_score} colorClass="bg-[#00B8B0]" />
            <StatBar label="MYTHIC RESIDUE" value={store.mythic_residue} colorClass="bg-[#8C4EFF]" />
            <StatBar label="NARRATIVE STABILITY" value={store.narrative_stability} colorClass="bg-[#F5EDE0]" />
            <StatBar label="REALITY STABILITY" value={store.reality_stability} colorClass="bg-[#F5EDE0]" />

            <div className="flex flex-col gap-1">
              <div className="text-xs uppercase tracking-widest opacity-40 mb-1">EMOTIONAL SURPLUS</div>
              <div className="w-full h-2.5 border border-[#FFB000]/40 relative overflow-hidden bg-[#0A0A0F]">
                <div className="absolute top-0 bottom-0 w-px bg-[#FFB000]/30 left-1/2 z-10" />
                <div
                  className={`absolute top-0 bottom-0 ${store.emotional_surplus >= 0 ? 'bg-[#FFB000] left-1/2' : 'bg-[#5C0010] right-1/2'}`}
                  style={{ width: `${Math.min(50, Math.abs(store.emotional_surplus) / 2)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs opacity-40 mt-0.5">
                <span>-100</span>
                <span className="text-[#FFB000]">{store.emotional_surplus > 0 ? '+' : ''}{store.emotional_surplus.toFixed(1)}</span>
                <span>+100</span>
              </div>
            </div>
          </div>

          {activeFlags.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-widest opacity-40 mb-3 border-b border-[#FFB000]/10 pb-1">
                ACTIVE FILE FLAGS
              </div>
              <div className="flex flex-wrap gap-2">
                {activeFlags.map((flag) => (
                  <span
                    key={flag}
                    className="text-xs bg-[#FFB000]/5 border border-[#FFB000]/20 px-2.5 py-1 tracking-wide"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
