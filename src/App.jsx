import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Shuffle } from 'lucide-react'
import { practiceData } from './data'

const dayNames = Object.keys(practiceData)
const checklist = ['Full Breath Taken', 'Light Contact Used', 'Controlled Rate', 'Paused at Punctuation']

export default function App() {
  const [dayIndex, setDayIndex] = useState(0)
  const [text, setText] = useState(practiceData.Mon.texts[0])
  const [wpm, setWpm] = useState(100)
  const [status, setStatus] = useState('Ready')
  const [activeWordIndex, setActiveWordIndex] = useState(0)
  const [checks, setChecks] = useState([])
  const day = dayNames[dayIndex]
  const focus = practiceData[day]
  const words = useMemo(() => text.trim() ? text.trim().split(/\s+/) : [], [text])
  const isPlaying = status === 'Breathing' || status === 'Running'

  useEffect(() => {
    if (status === 'Breathing') {
      const timer = setTimeout(() => setStatus('Sighing'), 1500)
      return () => clearTimeout(timer)
    }
    if (status === 'Sighing') {
      const timer = setTimeout(() => { setActiveWordIndex(0); setStatus('Running') }, 1500)
      return () => clearTimeout(timer)
    }
  }, [status])

  useEffect(() => {
    if (status !== 'Running') return
    if (!words.length) { setStatus('Ready'); return }
    const interval = setInterval(() => {
      setActiveWordIndex((current) => {
        if (current >= words.length - 1) { clearInterval(interval); setStatus('Ready'); return 0 }
        return current + 1
      })
    }, (60 / wpm) * 1000)
    return () => clearInterval(interval)
  }, [status, wpm, words.length])

  const stop = () => { setStatus('Ready'); setActiveWordIndex(0) }
  const playPause = () => { isPlaying ? stop() : words.length && setStatus('Breathing') }
  const changeDay = (direction) => {
    stop()
    const next = (dayIndex + direction + dayNames.length) % dayNames.length
    setDayIndex(next); setText(practiceData[dayNames[next]].texts[0]); setChecks([])
  }
  const shuffle = () => { stop(); const choices = focus.texts.filter((item) => item !== text); setText(choices[Math.floor(Math.random() * choices.length)] || focus.texts[0]) }

  return <main className="min-h-dvh bg-slate-950 text-slate-100"><section className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-5 sm:px-6">
    <header className="mb-4 flex items-center justify-between gap-4">
      <h1 className="text-lg font-bold tracking-tight">Stuttering Pacer <span className="text-sky-400">Practice</span></h1>
      <div className="flex gap-1.5"><IconButton label={isPlaying ? 'Pause' : 'Play'} onClick={playPause}>{isPlaying ? <Pause /> : <Play fill="currentColor" />}</IconButton><IconButton label="Reset" onClick={stop}><RotateCcw /></IconButton></div>
    </header>
    <section className="mb-4 rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-lg shadow-black/10">
      <p className="text-xs font-bold tracking-widest text-sky-300">TARGET FOCUS: {day.toUpperCase()}</p>
      <p className="mt-2 text-xl font-bold">{focus.target} <span className="font-medium text-slate-300">/ {focus.hindi}</span></p>
      <p className="mt-3 text-sm leading-6 text-slate-300"><b className="text-slate-100">Articulator:</b> {focus.articulator}<br /><b className="text-slate-100">Practice:</b> {focus.contact}</p>
    </section>
    <section className="relative flex min-h-56 flex-1 overflow-hidden rounded-2xl border border-sky-500/40 bg-sky-900/65 shadow-xl shadow-sky-950/20">
      {isPlaying ? <PacerText words={words} activeWordIndex={activeWordIndex} /> : <textarea value={text} onChange={(e) => setText(e.target.value)} aria-label="Practice text" className="w-full resize-none bg-transparent p-5 text-lg leading-8 text-sky-50 outline-none placeholder:text-sky-200/50" placeholder="Paste or write your practice text…" />}
      {(status === 'Breathing' || status === 'Sighing') && <div className="absolute inset-0 grid place-items-center bg-slate-950/80 backdrop-blur-sm"><div className="text-center"><div className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-full border-4 border-sky-300 border-t-transparent" /><p className="text-2xl font-bold text-white">{status === 'Breathing' ? 'Breathe In…' : 'Sigh Out…'}</p><p className="mt-2 text-sm text-sky-200">Slow and gentle</p></div></div>}
    </section>
    <div className="my-4 flex flex-wrap gap-2">{checklist.map((item) => <label key={item} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition ${checks.includes(item) ? 'border-emerald-400 bg-emerald-400/20 text-emerald-100' : 'border-slate-700 bg-slate-800 text-slate-300'}`}><input className="sr-only" type="checkbox" checked={checks.includes(item)} onChange={() => setChecks((items) => items.includes(item) ? items.filter((value) => value !== item) : [...items, item])} />{checks.includes(item) ? '✓ ' : ''}{item}</label>)}</div>
    <footer className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex justify-between text-xs font-bold tracking-widest text-slate-400"><span>STATUS: <span className={status === 'Ready' ? 'text-slate-200' : 'text-sky-300'}>{status === 'Sighing' ? 'Breathing' : status}</span></span><span>WPM: <span className="text-sky-300">{wpm}</span></span></div>
      <div className="flex items-center justify-between rounded-xl bg-slate-800 p-1"><IconButton label="Previous day" onClick={() => changeDay(-1)}><ChevronLeft /></IconButton><span className="text-sm font-semibold">{day}</span><IconButton label="Next day" onClick={() => changeDay(1)}><ChevronRight /></IconButton></div>
      <div className="flex items-center gap-3"><span className="text-xs font-bold text-slate-400">60</span><input aria-label="Words per minute" type="range" min="60" max="200" value={wpm} onChange={(e) => setWpm(Number(e.target.value))} className="h-2 flex-1 cursor-pointer accent-sky-400" /><span className="text-xs font-bold text-slate-400">200</span></div>
      <button onClick={shuffle} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-sky-400"><Shuffle size={16} /> Shuffle practice text</button>
    </footer>
  </section></main>
}

function IconButton({ children, label, onClick }) { return <button onClick={onClick} aria-label={label} title={label} className="grid h-9 w-9 place-items-center rounded-lg text-sky-200 transition hover:bg-slate-700 hover:text-white">{children}</button> }
function PacerText({ words, activeWordIndex }) { return <div className="flex w-full flex-wrap content-center gap-x-1.5 gap-y-2 overflow-y-auto p-5 text-lg leading-8 text-sky-50">{words.map((word, index) => <span key={`${word}-${index}`} className={index === activeWordIndex ? 'rounded bg-white px-1.5 py-0.5 font-semibold text-sky-950 shadow' : ''}>{word}</span>)}</div> }
