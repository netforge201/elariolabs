cat << 'INNER_EOF' > "src/components/FAQ.tsx"
'use client';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  { q: "Do you develop custom apps for clients?", a: "Currently, we focus exclusively on building our own independent products. However, we occasionally partner on highly selected projects." },
  { q: "Where can I download your apps?", a: "All of our applications are exclusively available on the Apple App Store for iPhone, iPad and Mac." },
  { q: "Are your apps free?", a: "We offer both free apps with optional premium features (freemium) and paid upfront apps. You can check the specific pricing on the App Store page for each app." },
  { q: "What technologies do you use?", a: "We use native technologies like Swift and SwiftUI to ensure the best performance, battery life, and integration with the Apple ecosystem." },
  { q: "How long does it take to launch an app?", a: "Depending on the complexity, it typically takes us between 2 to 6 months to go from the initial idea to the final release on the App Store." }
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  
  return (
    <div className="flex flex-col gap-3">
      {faqs.map((faq, i) => (
        <div key={i} className="rounded-2xl bg-white/5 border border-white/5 overflow-hidden transition-colors">
          <button 
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
          >
            <span className="font-medium text-sm text-zinc-200">{faq.q}</span>
            {open === i ? <Minus className="w-5 h-5 text-[#00e599] shrink-0 ml-4" /> : <Plus className="w-5 h-5 text-[#00e599] shrink-0 ml-4" />}
          </button>
          <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${open === i ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
            <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
INNER_EOF
