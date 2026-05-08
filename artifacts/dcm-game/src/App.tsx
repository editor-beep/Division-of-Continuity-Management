import { useGameStore } from './store/gameStore';
import { BootScreen } from './screens/BootScreen';
import { TerminalScreen } from './screens/TerminalScreen';
import { CaseFormScreen } from './screens/CaseFormScreen';
import { EndOfDayScreen } from './screens/EndOfDayScreen';
import { PlayerFileScreen } from './screens/PlayerFileScreen';
import { EndingScreen } from './screens/EndingScreen';
import { Background } from './components/Background';
import { CRTOverlay } from './components/CRTOverlay';

export default function App() {
  const gamePhase = useGameStore((state) => state.game_phase);

  return (
    <>
      <Background />
      <CRTOverlay />
      
      <div className="relative z-10 w-full h-full">
        {gamePhase === 'boot' && <BootScreen />}
        {gamePhase === 'terminal' && <TerminalScreen />}
        {gamePhase === 'case' && <CaseFormScreen />}
        {gamePhase === 'end_of_day' && <EndOfDayScreen />}
        {gamePhase === 'player_file' && <PlayerFileScreen />}
        {gamePhase === 'ending' && <EndingScreen />}
      </div>
    </>
  );
}
