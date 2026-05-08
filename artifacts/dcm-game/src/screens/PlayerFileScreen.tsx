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
    return SYSTEM_VOICE.PLAYER_FILE.OPEN_FIRST_TIME;
  };

  return (
    <div className="min-h-screen p-8 font-mono text-[#FFB000] max-w-4xl mx-auto flex flex-col">
      <div className="flex justify-between items-center mb-8 border-b border-[#FFB000] pb-4">
        <h1 className="text-2xl tracking-widest">[ CONTINUITY FILE : YOURS ]</h1>
        <button 
          onClick={() => store.setGamePhase('terminal')}
          className="border border-[#FFB000] px-4 py-2 hover:bg-[#FFB000] hover:text-[#0A0A0F] transition-colors"
          data-testid="button-close-file"
        >
          CLOSE FILE
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col */}
        <div className="col-span-1 flex flex-col items-center gap-6">
          <DissolutionPortrait dissolution_index={store.dissolution_index} />
          
          <div className="w-full border border-[#FFB000]/30 p-4 text-xs space-y-2">
             <div className="flex justify-between"><span className="opacity-50">DESIGNATION</span><span>PROCESSOR Θ</span></div>
             <div className="flex justify-between"><span className="opacity-50">CLEARANCE</span><span>{store.clearance_level}</span></div>
             <div className="flex justify-between"><span className="opacity-50">CASES PROCESSED</span><span>{store.completed_cases.length}</span></div>
          </div>
        </div>

        {/* Right Col */}
        <div className="col-span-2 flex flex-col gap-8">
          <div className="bg-[#0A0A0F] border border-[#FFB000] p-6 shadow-inner">
            <div className="text-xs opacity-50 mb-2">SYSTEM OBSERVATION</div>
            <div className="text-[#00B8B0] italic min-h-[4rem]">
              <TypewriterText text={getObservationText()} speed={30} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <StatBar label="DISSOLUTION INDEX" value={store.dissolution_index} colorClass="bg-[#FFB000]" highValueColorClass="bg-[#8C4EFF]" />
            <StatBar label="EFFICIENCY RATING" value={store.efficiency_score} colorClass="bg-[#00B8B0]" />
            <StatBar label="MYTHIC RESIDUE" value={store.mythic_residue} colorClass="bg-[#8C4EFF]" />
            <StatBar label="NARRATIVE STABILITY" value={store.narrative_stability} colorClass="bg-[#F5EDE0]" />
            
            <div className="col-span-full mt-4">
              <div className="text-xs uppercase tracking-widest opacity-50 mb-2">EMOTIONAL SURPLUS / DEFICIT</div>
              <div className="w-full h-3 border border-[#FFB000] relative">
                <div className="absolute top-0 bottom-0 w-[1px] bg-[#FFB000] left-1/2 z-10" />
                <div 
                  className={`absolute top-0 bottom-0 ${store.emotional_surplus >= 0 ? 'bg-[#FFB000] left-1/2' : 'bg-[#5C0010] right-1/2'}`}
                  style={{ width: `${Math.min(50, Math.abs(store.emotional_surplus) / 2)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>-100</span>
                <span>{store.emotional_surplus.toFixed(1)}</span>
                <span>+100</span>
              </div>
            </div>
          </div>

          {store.active_flags.length > 0 && (
             <div className="mt-4">
               <div className="text-xs uppercase tracking-widest opacity-50 mb-2 border-b border-[#FFB000]/30 pb-1">ACTIVE FILE FLAGS</div>
               <div className="flex flex-wrap gap-2">
                 {store.active_flags.map(f => (
                   <span key={f} className="text-xs bg-[#FFB000]/10 border border-[#FFB000]/30 px-2 py-1">
                     {f}
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
