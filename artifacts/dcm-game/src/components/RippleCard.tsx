import { motion, AnimatePresence } from 'framer-motion';
import { TypewriterText } from './TypewriterText';

interface RippleCardProps {
  text: string;
  type: 'small' | 'medium' | 'major';
  onComplete?: () => void;
}

export function RippleCard({ text, type, onComplete }: RippleCardProps) {
  const getBorderColor = () => {
    switch (type) {
      case 'major': return 'border-[#5C0010]';
      case 'medium': return 'border-[#00B8B0]';
      default: return 'border-[#FFB000]';
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'major': return '[ MAJOR RIPPLE DETECTED ]';
      case 'medium': return '[ MINOR FLUCTUATION ]';
      default: return '[ UPDATE LOGGED ]';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`p-6 border-l-4 ${getBorderColor()} bg-[#0A0A0F]/90 backdrop-blur-sm mb-4 bureau-border shadow-lg`}
    >
      <div className="text-xs tracking-widest text-[#00B8B0] mb-2">{getLabel()}</div>
      <div className="text-[#FFB000] font-mono leading-relaxed">
        <TypewriterText text={text} speed={40} onComplete={onComplete} />
      </div>
    </motion.div>
  );
}
