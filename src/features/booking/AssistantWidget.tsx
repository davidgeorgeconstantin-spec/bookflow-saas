'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { answerClient } from '@/lib/assistant';
import type { Business, Service } from '@/types';

interface Msg { id: number; from: 'me' | 'bot'; text: string }
const SUGGESTIONS = ['What are your opening hours?', 'How much is a haircut?', 'Which services do you have?'];

/** Floating help chat. Demo mode: rule-based answers from the business data — no AI API. */
export function AssistantWidget({ business, services }: { business: Business; services: Service[] }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, from: 'bot', text: `Hi! I'm the ${business.name} assistant (demo). Ask about services, prices or hours.` }]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing]);

  function ask(q: string) {
    if (!q.trim() || typing) return;
    setMsgs((m) => [...m, { id: Date.now(), from: 'me', text: q }]);
    setText('');
    setTyping(true);
    setTimeout(() => {
      setMsgs((m) => [...m, { id: Date.now() + 1, from: 'bot', text: answerClient(q, business, services) }]);
      setTyping(false);
    }, 600);
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} style={{ transformOrigin: 'bottom right' }} className="mb-3 flex h-[440px] w-[min(92vw,340px)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <header className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
              <span className="text-sm font-semibold">Assistant <span className="ml-1 rounded bg-white/15 px-1.5 py-0.5 text-[10px] uppercase">demo · no AI API</span></span>
              <button onClick={() => setOpen(false)} aria-label="Close assistant">✕</button>
            </header>
            <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-3">
              {msgs.map((m) => (
                <motion.p key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${m.from === 'me' ? 'ml-auto bg-indigo-600 text-white' : 'bg-slate-100'}`}>{m.text}</motion.p>
              ))}
              {typing && (
                <p className="flex w-14 gap-1 rounded-2xl bg-slate-100 px-3 py-3" aria-label="Typing">
                  {[0, 1, 2].map((i) => <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-400" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }} />)}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-1 px-3">
              {SUGGESTIONS.map((s) => <button key={s} onClick={() => ask(s)} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">{s}</button>)}
            </div>
            <form onSubmit={(e) => (e.preventDefault(), ask(text))} className="flex gap-2 p-3">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask a question…" aria-label="Question" className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              <button className="rounded-xl bg-indigo-600 px-3 text-sm font-semibold text-white">Send</button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button onClick={() => setOpen((o) => !o)} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} className="ml-auto grid h-14 w-14 place-items-center rounded-full bg-indigo-600 text-2xl text-white shadow-lg" aria-label={open ? 'Close assistant' : 'Open assistant'}>
        {open ? '✕' : '💬'}
      </motion.button>
    </div>
  );
}
