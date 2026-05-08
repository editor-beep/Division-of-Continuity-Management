import { useGameStore } from '../store/gameStore';
import { SYSTEM_VOICE } from '../data/voiceLines';
import { TypewriterText } from '../components/TypewriterText';
import { DissolutionPortrait } from '../components/DissolutionPortrait';

export function EndingScreen() {
  const store = useGameStore();

  const getEndingText = () => {
    switch(store.active_ending) {
      case 'optimal_assimilation': return SYSTEM_VOICE.ENDING.OPTIMAL_ASSIMILATION;
      case 'quiet_rebellion': return SYSTEM_VOICE.ENDING.QUIET_REBELLION;
      case 'system_fracture': return SYSTEM_VOICE.ENDING.SYSTEM_FRACTURE;
      case 'mythic_ascension': return SYSTEM_VOICE.ENDING.MYTHIC_ASCENSION;
      case 'echo_loop': return SYSTEM_VOICE.ENDING.ECHO_LOOP;
      case 'merciful_erasure': return SYSTEM_VOICE.ENDING.MERCIFUL_ERASURE;
      case 'the_unraveling': return SYSTEM_VOICE.ENDING.UNRAVELING;
      case 'co_creator': return SYSTEM_VOICE.ENDING.CO_CREATOR;
      default: return SYSTEM_VOICE.ENDING.QUIET_REBELLION;
    }
  };

  const handleRestart = () => {
    store.resetGame();
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-8 font-mono">
      <div className="max-w-2xl text-center flex flex-col items-center">
        <div className="mb-16 opacity-30 transform scale-150 filter blur-sm">
          <DissolutionPortrait dissolution_index={store.dissolution_index} />
        </div>

        <div className="text-[#FFB000] text-xl md:text-2xl leading-loose tracking-wide min-h-[8rem]">
          <TypewriterText text={getEndingText()} speed={50} />
        </div>

        <div className="mt-24">
          <button 
            onClick={handleRestart}
            className="text-xs tracking-[0.5em] text-[#00B8B0] opacity-50 hover:opacity-100 transition-opacity uppercase"
            data-testid="button-restart"
          >
            [ OPEN NEW FILE ]
          </button>
        </div>
      </div>
    </div>
  );
}
