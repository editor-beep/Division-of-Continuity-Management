import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { getCaseById } from '../data/cases';
import { SYSTEM_VOICE } from '../data/voiceLines';
import { TypewriterText } from '../components/TypewriterText';
import { RippleCard } from '../components/RippleCard';
import {
  Field,
  ChoiceField,
  SliderField,
  TextField,
  ToggleField,
  ChoiceOption,
  Ripple,
} from '../types';

function isChoice(f: Field): f is ChoiceField {
  return f.type === 'choice';
}
function isSlider(f: Field): f is SliderField {
  return f.type === 'slider';
}
function isText(f: Field): f is TextField {
  return f.type === 'text';
}
function isToggle(f: Field): f is ToggleField {
  return f.type === 'toggle';
}

type FormValues = Record<string, string | number | boolean>;

function computeEffectsAndRipples(
  fields: Field[],
  formData: FormValues
): { effects: Record<string, number>; flags: string[]; ripples: Ripple[] } {
  const effects: Record<string, number> = {};
  const flags: string[] = [];
  const ripples: Ripple[] = [];

  const addEffect = (key: string, delta: number) => {
    effects[key] = (effects[key] ?? 0) + delta;
  };

  for (const field of fields) {
    if (isChoice(field)) {
      const val = formData[field.id] as string | undefined;
      if (val) {
        const opt = field.options.find((o: ChoiceOption) => o.id === val);
        if (opt) {
          for (const [k, v] of Object.entries(opt.effects)) addEffect(k, v);
          flags.push(...opt.flags_set);
          ripples.push(...opt.ripples);
        }
      }
    } else if (isSlider(field)) {
      const val = (formData[field.id] as number) ?? field.default;
      const ratio = (val - field.min) / Math.max(1, field.max - field.min);
      const keysAtMax = Object.keys(field.effects_at_max);
      for (const k of keysAtMax) {
        const minVal = field.effects_at_min[k] ?? 0;
        const maxVal = field.effects_at_max[k];
        addEffect(k, minVal + (maxVal - minVal) * ratio);
      }
    } else if (isToggle(field)) {
      const val = formData[field.id] as boolean | undefined;
      const eff = val ? field.effects_on : field.effects_off;
      for (const [k, v] of Object.entries(eff)) addEffect(k, v);
      if (val) ripples.push(...field.ripples_on);
    }
  }
  return { effects, flags, ripples };
}

export function CaseFormScreen() {
  const store = useGameStore();
  const caseData = useMemo(
    () => getCaseById(store.active_case_id ?? ''),
    [store.active_case_id]
  );

  const [formData, setFormData] = useState<FormValues>({});
  const [submitted, setSubmitted] = useState(false);
  const [finalRipples, setFinalRipples] = useState<Ripple[]>([]);

  if (!caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono text-[#FFB000]">
        <button onClick={() => store.setGamePhase('terminal')}>← Return to Terminal</button>
      </div>
    );
  }

  const allFields = caseData.sections.flatMap((s) => s.fields);

  const requiredChoicesFilled = allFields
    .filter(isChoice)
    .filter((f) => f.required)
    .every((f) => formData[f.id] !== undefined);

  const previewResult = useMemo(
    () => computeEffectsAndRipples(allFields, formData),
    [formData, caseData.id]
  );

  const handleFieldChange = (fieldId: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleApprove = () => {
    if (!requiredChoicesFilled) return;
    const { effects, flags, ripples } = computeEffectsAndRipples(allFields, formData);
    const allFlags = [...flags];
    if (caseData.completion_flag) allFlags.push(caseData.completion_flag);
    store.completeCase(caseData.id, effects, allFlags, ripples);
    setFinalRipples(ripples);
    setSubmitted(true);
  };

  const handleDefer = () => {
    store.deferCase(caseData.id);
    store.setActiveCase(null);
    store.setGamePhase('terminal');
  };

  const handleReturn = () => {
    store.setActiveCase(null);
    store.setGamePhase('terminal');
  };

  const isEchoCase = caseData.worker_unit.name.toLowerCase().includes('echo') || caseData.id.startsWith('case_005') || caseData.id.startsWith('case_010') || caseData.id.startsWith('case_015');

  if (submitted) {
    return (
      <div className="min-h-screen p-8 font-mono flex flex-col items-center justify-center max-w-2xl mx-auto">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[#00B8B0] text-lg mb-8 tracking-[0.2em]"
        >
          [ FILING COMPLETE ]
        </motion.h2>

        <div className="w-full mb-8">
          <AnimatePresence>
            {finalRipples.map((rip, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.4 }}>
                <RippleCard text={rip.text} type={rip.type} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <button
          onClick={handleReturn}
          className="px-8 py-3 border border-[#FFB000] text-[#FFB000] text-sm tracking-widest hover:bg-[#FFB000] hover:text-[#0A0A0F] transition-all"
          data-testid="button-return-terminal"
        >
          [ RETURN TO TERMINAL ]
        </button>
      </div>
    );
  }

  const signatureDeltaKeys = ['dissolution_index', 'efficiency_score', 'mythic_residue', 'reality_stability', 'emotional_surplus'];

  return (
    <div className="min-h-screen p-4 md:p-6 font-mono text-[#F5EDE0] flex flex-col xl:flex-row gap-6 max-w-7xl mx-auto">
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={handleReturn}
            className="text-[#FFB000] text-xs hover:text-[#F5EDE0] tracking-widest transition-colors"
            data-testid="button-back"
          >
            ← TERMINAL
          </button>
          <div className="flex items-center gap-3">
            {isEchoCase && (
              <span className="text-xs border border-[#8C4EFF] text-[#8C4EFF] px-2 py-1 tracking-widest">
                ANOMALY
              </span>
            )}
            <span className="text-xs border border-[#FFB000]/40 text-[#FFB000] px-2 py-1 tracking-widest">
              {caseData.form_type}
            </span>
          </div>
        </div>

        <div className="bg-[#F5EDE0] text-[#0A0A0F] shadow-[0_0_30px_rgba(255,176,0,0.08)]">
          <div className="border-b-4 border-[#0A0A0F] p-8 text-center">
            <div className="text-xs tracking-[0.4em] opacity-40 mb-2">DIVISION OF CONTINUITY MANAGEMENT</div>
            <h1 className="text-2xl font-bold uppercase tracking-widest mb-1">{caseData.form_title}</h1>
            <h2 className="text-base uppercase tracking-wider opacity-70">{caseData.title}</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b-2 border-[#0A0A0F]/15 text-sm">
            <div><div className="text-xs opacity-40 mb-0.5">UNIT ID</div><div>{caseData.worker_unit.id}</div></div>
            <div><div className="text-xs opacity-40 mb-0.5">NAME</div><div>{caseData.worker_unit.name}</div></div>
            <div><div className="text-xs opacity-40 mb-0.5">AGE</div><div>{caseData.worker_unit.age || '—'}</div></div>
            <div><div className="text-xs opacity-40 mb-0.5">OCCUPATION</div><div>{caseData.worker_unit.occupation}</div></div>
          </div>

          <div className="p-6 border-b-2 border-[#0A0A0F]/15">
            <div className="text-xs opacity-40 mb-1 tracking-widest">INCIDENT REPORT</div>
            <p className="text-base leading-relaxed border-l-4 border-[#5C0010] pl-4">{caseData.issue}</p>
          </div>

          <div className="p-6 border-b-2 border-[#0A0A0F]/15">
            <div className="bg-[#0A0A0F] text-[#00B8B0] p-4 italic text-sm leading-relaxed">
              <TypewriterText text={caseData.system_note} speed={22} />
            </div>
          </div>

          <div className="p-6 space-y-10">
            {caseData.sections.map((section) => (
              <div key={section.id} className="border-t-2 border-[#0A0A0F]/15 pt-8">
                <h3 className="font-bold text-sm tracking-widest uppercase mb-6 opacity-80">{section.title}</h3>
                <div className="space-y-8">
                  {section.fields.map((field) => (
                    <div key={field.id}>
                      <label className="block font-bold text-sm mb-1">{field.label}</label>
                      {field.description && (
                        <p className="text-xs opacity-55 mb-3">{field.description}</p>
                      )}

                      {isChoice(field) && (
                        <div className="space-y-2 mt-3">
                          {field.options.map((opt) => {
                            const selected = formData[field.id] === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleFieldChange(field.id, opt.id)}
                                className={`w-full text-left flex items-start gap-3 p-3 border-2 transition-all ${
                                  selected
                                    ? 'border-[#0A0A0F] bg-[#0A0A0F]/6'
                                    : 'border-[#0A0A0F]/10 hover:border-[#0A0A0F]/40'
                                }`}
                              >
                                <div className="mt-0.5 flex-shrink-0 w-3.5 h-3.5 rounded-full border-2 border-[#0A0A0F] flex items-center justify-center">
                                  {selected && <div className="w-2 h-2 rounded-full bg-[#0A0A0F]" />}
                                </div>
                                <div>
                                  <div className="font-bold text-sm">{opt.label}</div>
                                  {opt.sublabel && (
                                    <div className="text-xs opacity-50 mt-0.5">{opt.sublabel}</div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {isSlider(field) && (
                        <div className="mt-3">
                          <input
                            type="range"
                            min={field.min}
                            max={field.max}
                            value={(formData[field.id] as number) ?? field.default}
                            onChange={(e) => handleFieldChange(field.id, Number(e.target.value))}
                            className="w-full accent-[#0A0A0F]"
                            data-testid={`slider-${field.id}`}
                          />
                          <div className="flex justify-between text-xs opacity-50 mt-1">
                            <span>{field.min}</span>
                            <span className="font-bold">
                              {(formData[field.id] as number) ?? field.default}
                            </span>
                            <span>{field.max}</span>
                          </div>
                        </div>
                      )}

                      {isText(field) && (
                        <textarea
                          className="w-full bg-transparent border-b-2 border-[#0A0A0F]/20 outline-none p-2 resize-none focus:border-[#00B8B0] transition-colors text-sm"
                          placeholder={field.placeholder ?? ''}
                          rows={3}
                          value={(formData[field.id] as string) || ''}
                          onChange={(e) => handleFieldChange(field.id, e.target.value)}
                          data-testid={`textarea-${field.id}`}
                        />
                      )}

                      {isToggle(field) && (
                        <button
                          type="button"
                          onClick={() => handleFieldChange(field.id, !formData[field.id])}
                          className="flex items-center gap-3 mt-2 p-2 hover:bg-[#0A0A0F]/5 transition-colors"
                          data-testid={`toggle-${field.id}`}
                        >
                          <div
                            className={`w-10 h-5 border-2 border-[#0A0A0F] rounded-full flex items-center px-0.5 transition-colors ${
                              formData[field.id] ? 'bg-[#0A0A0F]' : ''
                            }`}
                          >
                            <div
                              className={`w-3 h-3 rounded-full transition-transform ${
                                formData[field.id]
                                  ? 'translate-x-5 bg-[#F5EDE0]'
                                  : 'bg-[#0A0A0F]'
                              }`}
                            />
                          </div>
                          <span className="text-sm font-bold">{field.toggle_label}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t-4 border-[#0A0A0F] p-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                type="button"
                onClick={handleDefer}
                className="px-6 py-3 border-2 border-[#0A0A0F]/30 text-[#0A0A0F]/60 text-sm tracking-widest hover:border-[#0A0A0F]/60 hover:text-[#0A0A0F] transition-all uppercase"
                data-testid="button-defer"
              >
                [ DEFER PROCESSING ]
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={!requiredChoicesFilled}
                className="px-8 py-3 bg-[#0A0A0F] text-[#FFB000] text-sm font-bold tracking-widest hover:bg-[#FFB000] hover:text-[#0A0A0F] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[#0A0A0F] disabled:hover:text-[#FFB000] transition-all uppercase"
                data-testid="button-submit-form"
              >
                [ APPROVE FILING ]
              </button>
            </div>
            {!requiredChoicesFilled && (
              <p className="text-right text-xs text-[#5C0010] mt-2 tracking-widest">
                INCOMPLETE FIELDS DETECTED
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="w-full xl:w-64 shrink-0 flex flex-col gap-4">
        <div className="border border-[#FFB000]/30 p-4 bg-[#0A0A0F]/90">
          <h3 className="text-xs tracking-[0.2em] opacity-50 mb-4 border-b border-[#FFB000]/20 pb-2">
            CONTINUITY PREVIEW
          </h3>
          <p className="text-xs opacity-40 italic mb-4">
            {SYSTEM_VOICE.HOVER.CHOICE_GENTLE}
          </p>
          {signatureDeltaKeys.map((key) => {
            const delta = previewResult.effects[key];
            if (!delta) return null;
            const sign = delta > 0 ? '+' : '';
            const color = delta > 0 ? 'text-[#00B8B0]' : 'text-[#5C0010]';
            return (
              <div key={key} className={`flex justify-between text-xs mb-2 ${color}`}>
                <span className="opacity-70 uppercase tracking-wide">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="font-bold">
                  {sign}{delta.toFixed(1)}
                </span>
              </div>
            );
          })}
          {Object.values(previewResult.effects).every((v) => v === 0) && (
            <p className="text-xs opacity-30 italic text-center">
              Select choices to preview effects
            </p>
          )}
        </div>

        {previewResult.ripples.length > 0 && (
          <div className="border border-[#FFB000]/20 p-4 bg-[#0A0A0F]/90">
            <h3 className="text-xs tracking-widest opacity-50 mb-3">PENDING RIPPLES</h3>
            {previewResult.ripples.map((r, i) => {
              const color =
                r.type === 'major'
                  ? 'border-[#5C0010] text-[#5C0010]'
                  : r.type === 'medium'
                  ? 'border-[#00B8B0] text-[#00B8B0]'
                  : 'border-[#FFB000]/40 text-[#FFB000]';
              return (
                <div key={i} className={`text-xs border-l-2 pl-2 mb-2 leading-relaxed opacity-70 ${color}`}>
                  {r.text.substring(0, 80)}{r.text.length > 80 ? '…' : ''}
                </div>
              );
            })}
          </div>
        )}

        {previewResult.flags.length > 0 && (
          <div className="border border-[#8C4EFF]/20 p-4 bg-[#0A0A0F]/90">
            <h3 className="text-xs tracking-widest opacity-50 mb-3 text-[#8C4EFF]">FLAGS TO SET</h3>
            {previewResult.flags.map((flag) => (
              <div key={flag} className="text-xs text-[#8C4EFF] opacity-60 mb-1">
                + {flag}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
