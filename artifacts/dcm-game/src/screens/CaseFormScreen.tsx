import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { allCases } from '../data/cases';
import { SYSTEM_VOICE } from '../data/voiceLines';
import { TypewriterText } from '../components/TypewriterText';
import { RippleCard } from '../components/RippleCard';

export function CaseFormScreen() {
  const store = useGameStore();
  const caseData = useMemo(() => allCases.find(c => c.id === store.active_case_id), [store.active_case_id]);
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [ripplesToShow, setRipplesToShow] = useState<any[]>([]);

  if (!caseData) return <div>Case not found</div>;

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const isFormComplete = caseData.sections.every(s => 
    s.fields.every(f => {
      if (f.type === 'choice' && (f as any).required) {
        return formData[f.id] !== undefined;
      }
      return true; // other fields usually have defaults or aren't strictly required
    })
  );

  const handleSubmit = () => {
    if (!isFormComplete) return;

    let totalEffects: Record<string, number> = {};
    let allFlags: string[] = [];
    let allRipples: any[] = [];

    caseData.sections.forEach(section => {
      section.fields.forEach(field => {
        const val = formData[field.id];
        if (field.type === 'choice' && val) {
          const opt = (field as any).options.find((o: any) => o.id === val);
          if (opt) {
            // merge effects
            Object.keys(opt.effects || {}).forEach(k => {
              totalEffects[k] = (totalEffects[k] || 0) + opt.effects[k];
            });
            allFlags.push(...(opt.flags_set || []));
            allRipples.push(...(opt.ripples || []));
          }
        } else if (field.type === 'slider' && val !== undefined) {
           const f = field as any;
           const ratio = (val - f.min) / (f.max - f.min);
           // simple linear interpolation for slider effects
           Object.keys(f.effects_at_max || {}).forEach(k => {
               const minVal = f.effects_at_min?.[k] || 0;
               const maxVal = f.effects_at_max[k];
               const eff = minVal + (maxVal - minVal) * ratio;
               totalEffects[k] = (totalEffects[k] || 0) + eff;
           });
        } else if (field.type === 'toggle') {
            const f = field as any;
            if (val && f.effects_on) {
                Object.keys(f.effects_on).forEach(k => {
                    totalEffects[k] = (totalEffects[k] || 0) + f.effects_on[k];
                });
                if (f.ripples_on) allRipples.push(...f.ripples_on);
            }
        }
      });
    });

    if (caseData.completion_flag) {
        allFlags.push(caseData.completion_flag);
    }

    store.completeCase(caseData.id, totalEffects, allFlags, allRipples);
    setRipplesToShow(allRipples);
    setSubmitted(true);
  };

  const handleReturn = () => {
    store.setActiveCase('');
    store.setGamePhase('terminal');
  };

  if (submitted) {
    return (
      <div className="min-h-screen p-8 font-mono flex flex-col items-center justify-center max-w-2xl mx-auto">
        <h2 className="text-[#00B8B0] text-xl mb-8 tracking-widest">[ PROCESSING COMPLETE ]</h2>
        <div className="w-full mb-8">
            <AnimatePresence>
                {ripplesToShow.map((rip, i) => (
                    <RippleCard key={i} text={rip.text} type={rip.type} />
                ))}
            </AnimatePresence>
        </div>
        <button
          onClick={handleReturn}
          className="px-8 py-3 border border-[#FFB000] text-[#FFB000] hover:bg-[#FFB000] hover:text-[#0A0A0F] transition-all tracking-widest"
          data-testid="button-return-terminal"
        >
          [ RETURN TO TERMINAL ]
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 font-mono text-[#F5EDE0] max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
          <button 
            onClick={handleReturn}
            className="text-[#FFB000] hover:text-[#F5EDE0] underline"
            data-testid="button-back"
          >
            ← Back to Queue
          </button>
          <div className="text-xs border border-[#FFB000] text-[#FFB000] px-2 py-1">FORM {caseData.form_type}</div>
      </div>

      <div className="bg-[#F5EDE0] text-[#0A0A0F] p-8 md:p-12 shadow-[0_0_20px_rgba(255,176,0,0.1)] relative">
        {/* Form Header */}
        <div className="border-b-4 border-[#0A0A0F] pb-6 mb-8 text-center">
            <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">{caseData.form_title}</h1>
            <h2 className="text-xl uppercase tracking-wider">{caseData.title}</h2>
        </div>

        {/* Worker Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 border-b-2 border-[#0A0A0F]/20 pb-8 text-sm">
            <div>
                <div className="font-bold opacity-50 text-xs">UNIT ID</div>
                <div>{caseData.worker_unit.id}</div>
            </div>
            <div>
                <div className="font-bold opacity-50 text-xs">NAME</div>
                <div>{caseData.worker_unit.name}</div>
            </div>
            <div>
                <div className="font-bold opacity-50 text-xs">AGE</div>
                <div>{caseData.worker_unit.age}</div>
            </div>
            <div>
                <div className="font-bold opacity-50 text-xs">OCCUPATION</div>
                <div>{caseData.worker_unit.occupation}</div>
            </div>
        </div>

        {/* Issue */}
        <div className="mb-8 border-l-4 border-[#5C0010] pl-4">
            <div className="font-bold opacity-50 text-xs mb-1">INCIDENT REPORT</div>
            <div className="text-lg">{caseData.issue}</div>
        </div>

        {/* System Note */}
        <div className="mb-12 bg-[#0A0A0F] text-[#00B8B0] p-4 italic text-sm shadow-inner">
            <TypewriterText text={caseData.system_note} speed={30} />
        </div>

        {/* Sections */}
        <div className="space-y-12">
            {caseData.sections.map(section => (
                <div key={section.id} className="border-t-2 border-[#0A0A0F] pt-8">
                    <h3 className="font-bold text-lg mb-6 uppercase tracking-wider">{section.title}</h3>
                    
                    <div className="space-y-8">
                        {section.fields.map(field => (
                            <div key={field.id} className="space-y-2">
                                <label className="block font-bold">{field.label}</label>
                                {field.description && <div className="text-sm opacity-70 mb-2">{field.description}</div>}
                                
                                {field.type === 'choice' && (
                                    <div className="space-y-3 mt-4">
                                        {(field as any).options.map((opt: any) => (
                                            <label
                                              key={opt.id}
                                              onClick={() => handleFieldChange(field.id, opt.id)}
                                              className={`flex items-start gap-3 cursor-pointer group p-2 transition-colors border ${formData[field.id] === opt.id ? 'border-[#0A0A0F]/30 bg-[#0A0A0F]/10' : 'border-transparent hover:bg-[#0A0A0F]/5'}`}
                                            >
                                                <div className="mt-1 flex-shrink-0 w-4 h-4 rounded-full border-2 border-[#0A0A0F] flex items-center justify-center">
                                                    {formData[field.id] === opt.id && (
                                                        <div className="w-2 h-2 rounded-full bg-[#0A0A0F]" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold">{opt.label}</div>
                                                    {opt.sublabel && <div className="text-xs opacity-60 mt-1">{opt.sublabel}</div>}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}

                                {field.type === 'slider' && (
                                    <div className="mt-4 flex flex-col gap-2">
                                        <input 
                                            type="range" 
                                            min={(field as any).min} 
                                            max={(field as any).max} 
                                            value={formData[field.id] ?? (field as any).default}
                                            onChange={(e) => handleFieldChange(field.id, Number(e.target.value))}
                                            className="w-full accent-[#0A0A0F]"
                                            data-testid={`slider-${field.id}`}
                                        />
                                        <div className="text-right text-xs font-bold">{formData[field.id] ?? (field as any).default} / {(field as any).max}</div>
                                    </div>
                                )}

                                {field.type === 'text' && (
                                    <textarea 
                                        className="w-full bg-transparent border-b-2 border-[#0A0A0F] outline-none p-2 resize-none focus:border-[#00B8B0] transition-colors"
                                        placeholder={(field as any).placeholder}
                                        rows={3}
                                        value={formData[field.id] || ''}
                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                        data-testid={`textarea-${field.id}`}
                                    />
                                )}

                                {field.type === 'toggle' && (
                                    <label className="flex items-center gap-3 cursor-pointer mt-2 p-2 hover:bg-[#0A0A0F]/5">
                                        <div className={`w-10 h-5 border-2 border-[#0A0A0F] rounded-full p-0.5 flex items-center transition-colors ${formData[field.id] ? 'bg-[#0A0A0F]' : ''}`}>
                                            <div className={`w-3 h-3 bg-[#0A0A0F] rounded-full transition-transform ${formData[field.id] ? 'translate-x-5 bg-[#F5EDE0]' : ''}`} />
                                        </div>
                                        <span className="font-bold text-sm">{(field as any).toggle_label}</span>
                                        <input 
                                            type="checkbox" 
                                            className="hidden"
                                            checked={!!formData[field.id]}
                                            onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                                            data-testid={`toggle-${field.id}`}
                                        />
                                    </label>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>

        {/* Footer / Submit */}
        <div className="mt-16 pt-8 border-t-4 border-[#0A0A0F] flex flex-col items-center">
            <button
                onClick={handleSubmit}
                disabled={!isFormComplete}
                className="w-full md:w-auto px-12 py-4 bg-[#0A0A0F] text-[#FFB000] font-bold text-xl tracking-widest hover:bg-[#FFB000] hover:text-[#0A0A0F] disabled:opacity-50 disabled:hover:bg-[#0A0A0F] disabled:hover:text-[#FFB000] transition-all uppercase"
                data-testid="button-submit-form"
            >
                Submit Form
            </button>
            {!isFormComplete && (
                <div className="mt-4 text-xs text-[#5C0010] font-bold">
                    INCOMPLETE FIELDS DETECTED
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
