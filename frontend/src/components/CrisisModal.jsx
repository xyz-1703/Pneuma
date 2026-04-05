import React from 'react';

const HELPLINES = [
  { name: "Vandrevala Foundation", number: "1860-2662-345", hours: "24/7", speciality: "Crisis & Suicide Support" },
  { name: "NIMHANS", number: "080-46110007", hours: "24/7", speciality: "Psychiatric Emergencies" },
  { name: "Fortis Stress Helpline", number: "8376804102", hours: "24/7", speciality: "Stress & Anxiety" },
  { name: "Snehi", number: "044-24640050", hours: "24/7", speciality: "Emotional Support" },
  { name: "iCall (TISS)", number: "9152987821", hours: "Mon–Sat, 8am–10pm", speciality: "General Mental Health" },
  { name: "iCall WhatsApp", number: "+91 9152987821", hours: "Mon–Sat", speciality: "Chat-based Support" }
];

export default function CrisisModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-slideIn">
      <div className="glass w-full max-w-3xl rounded-[2.5rem] flex flex-col shadow-2xl relative border border-roseleaf/20 overflow-hidden">
        {/* Header */}
        <div className="bg-roseleaf/10 p-6 md:px-8 border-b border-roseleaf/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">❤️‍🩹</span>
            <h2 className="text-2xl font-heading font-bold text-roseleaf">Crisis Helplines (India)</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-surface/50 text-ink/60 hover:text-ink hover:bg-surface hover:shadow-glass border border-ink/10 transition-all font-bold text-xl active:scale-95"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto max-h-[70vh] scroll-slim">
          <p className="text-ink/80 text-[15px] mb-8 font-medium leading-relaxed max-w-2xl mx-auto text-center border border-ink/5 bg-surface/30 p-4 rounded-xl">
            If you or someone you know is going through a tough time, please reach out for immediate support. These trained professionals are here to help you.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {HELPLINES.map((helpline, i) => (
              <div key={i} className="bg-surface/50 hover:bg-surface transition-colors p-5 rounded-[1.5rem] border border-ink/5 flex flex-col group">
                <h3 className="font-bold text-[16px] text-ink mb-1 group-hover:text-roseleaf transition-colors">{helpline.name}</h3>
                <p className="text-accent font-bold text-xl mb-4 tracking-wider">{helpline.number}</p>
                <div className="flex flex-col gap-2 text-[13px] text-ink/60 font-medium tracking-wide mt-auto">
                  <div className="flex justify-between border-b border-ink/5 pb-2">
                     <span>Hours:</span> <span className="text-ink/80 font-bold">{helpline.hours}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                     <span>Focus:</span> <span className="text-ink/80 text-right font-bold">{helpline.speciality}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
