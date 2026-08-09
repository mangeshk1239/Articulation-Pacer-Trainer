import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, Shuffle, Volume2, VolumeX } from 'lucide-react'
import { practiceData } from './data'

const dayNames = Object.keys(practiceData)
const checklist = ['Full Breath Taken', 'Light Contact Used', 'Controlled Rate', 'Paused at Punctuation']

function punctuationPauseMs(word, wpm, pauseScale) {
  const wordDuration = (60 / wpm) * 1000
  if (/[.!?][”"')\]]*$/.test(word)) return wordDuration * 0.85 * (pauseScale / 100)
  if (/[,;:][”"')\]]*$/.test(word)) return wordDuration * 0.45 * (pauseScale / 100)
  return 0
}

function savedValue(key, fallback) {
  if (typeof window === 'undefined') return fallback
  return window.localStorage.getItem(key) ?? fallback
}

export default function App() {
  const [dayIndex, setDayIndex] = useState(() => Math.max(0, dayNames.indexOf(savedValue('articulation-pacer-day', 'Mon'))))
  const [text, setText] = useState(() => practiceData[savedValue('articulation-pacer-day', 'Mon')]?.texts[0] || practiceData.Mon.texts[0])
  const [wpm, setWpm] = useState(() => Math.min(200, Math.max(60, Number(savedValue('articulation-pacer-wpm', 100)) || 100)))
  const [pauseScale, setPauseScale] = useState(() => Math.min(200, Math.max(0, Number(savedValue('articulation-pacer-pause-scale', 100)) || 0)))
  const [status, setStatus] = useState('Ready')
  const [activeWordIndex, setActiveWordIndex] = useState(0)
  const [checks, setChecks] = useState(() => { try { const value = JSON.parse(savedValue('articulation-pacer-checks', '[]')); return Array.isArray(value) ? value.filter((item) => checklist.includes(item)) : [] } catch { return [] } })
  const [completed, setCompleted] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(() => savedValue('articulation-pacer-sound', 'false') === 'true')
  const audioContextRef = useRef(null)
  const day = dayNames[dayIndex]
  const focus = practiceData[day]
  const words = useMemo(() => text.trim() ? text.trim().split(/\s+/) : [], [text])
  const isPlaying = status !== 'Ready'

  const playTone = useCallback((frequency, duration = 0.09, volume = 0.035) => {
    if (!soundEnabled || typeof window === 'undefined') return
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const context = audioContextRef.current || new AudioContext()
    audioContextRef.current = context
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.frequency.value = frequency
    oscillator.type = 'sine'
    gain.gain.setValueAtTime(volume, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + duration)
  }, [soundEnabled])

  useEffect(() => { window.localStorage.setItem('articulation-pacer-day', dayNames[dayIndex]) }, [dayIndex])
  useEffect(() => { window.localStorage.setItem('articulation-pacer-wpm', String(wpm)) }, [wpm])
  useEffect(() => { window.localStorage.setItem('articulation-pacer-pause-scale', String(pauseScale)) }, [pauseScale])
  useEffect(() => { window.localStorage.setItem('articulation-pacer-checks', JSON.stringify(checks)) }, [checks])
  useEffect(() => { window.localStorage.setItem('articulation-pacer-sound', String(soundEnabled)) }, [soundEnabled])

  useEffect(() => {
    if (status === 'Breathing') {
      const timer = setTimeout(() => setStatus('Sighing'), 1500)
      return () => clearTimeout(timer)
    }
    if (status === 'Sighing') {
      playTone(262, 0.25, 0.05)
      const timer = setTimeout(() => { setActiveWordIndex(0); setStatus('Running') }, 1500)
      return () => clearTimeout(timer)
    }
  }, [status, playTone])

  useEffect(() => {
    if (status === 'Running') playTone(660)
  }, [status, activeWordIndex, playTone])

  useEffect(() => {
    if (status !== 'Running') return
    if (!words.length) { setStatus('Ready'); return }
    const currentWord = words[activeWordIndex]
    const delay = (60 / wpm) * 1000 + punctuationPauseMs(currentWord, wpm, pauseScale)
    const timer = setTimeout(() => {
      if (activeWordIndex >= words.length - 1) { setStatus('Ready'); setActiveWordIndex(0); setCompleted(true); playTone(784, 0.35, 0.06); return }
      setActiveWordIndex((current) => current + 1)
    }, delay)
    return () => clearTimeout(timer)
  }, [status, wpm, pauseScale, words, activeWordIndex, playTone])

  const stop = () => { setStatus('Ready'); setActiveWordIndex(0) }
  const startPractice = () => { if (!words.length) return; setCompleted(false); setActiveWordIndex(0); playTone(392, 0.22, 0.05); setStatus('Breathing') }
  const playPause = () => { isPlaying ? stop() : startPractice() }
  const changeDay = (direction) => {
    stop()
    const next = (dayIndex + direction + dayNames.length) % dayNames.length
    setDayIndex(next); setText(practiceData[dayNames[next]].texts[0]); setChecks([]); setCompleted(false)
  }
  const shuffle = () => { stop(); setCompleted(false); const choices = focus.texts.filter((item) => item !== text); setText(choices[Math.floor(Math.random() * choices.length)] || focus.texts[0]) }

  return <main className="min-h-dvh bg-slate-950 text-slate-100"><section className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-5 sm:px-6">
    <header className="mb-4 flex items-center justify-between gap-4">
      <h1 className="text-lg font-bold tracking-tight">Articulation Pacer <span className="text-sky-400">Practice</span></h1>
      <div className="flex gap-1.5"><IconButton label={isPlaying ? 'Pause' : 'Play'} onClick={playPause}>{isPlaying ? <Pause /> : <Play fill="currentColor" />}</IconButton><IconButton label="Reset" onClick={stop}><RotateCcw /></IconButton></div>
    </header>
    <section className="mb-4 rounded-2xl border border-slate-700 bg-slate-800 p-4 shadow-lg shadow-black/10">
      <p className="text-xs font-bold tracking-widest text-sky-300">TARGET FOCUS: {day.toUpperCase()}</p>
      <p className="mt-2 text-xl font-bold">{focus.target} <span className="font-medium text-slate-300">/ {focus.hindi}</span></p>
      <p className="mt-3 text-sm leading-6 text-slate-300"><b className="text-slate-100">Articulator:</b> {focus.articulator}<br /><b className="text-slate-100">Practice:</b> {focus.contact}</p>
    </section>
    <section className="relative flex min-h-56 flex-1 overflow-hidden rounded-2xl border border-sky-500/40 bg-sky-900/65 shadow-xl shadow-sky-950/20">
      {isPlaying ? <PacerText words={words} activeWordIndex={activeWordIndex} /> : <textarea value={text} onChange={(e) => setText(e.target.value)} aria-label="Practice text" className="w-full resize-none bg-transparent p-5 text-lg leading-8 text-sky-50 outline-none placeholder:text-sky-200/50" placeholder="Paste or write your practice text…" />}
      {(status === 'Breathing' || status === 'Sighing') && <div className="absolute inset-0 grid place-items-center bg-slate-950/80 backdrop-blur-sm"><div className="text-center"><div className={`breath-orb mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full border-4 border-sky-200/90 ${status === 'Breathing' ? 'breathe-in' : 'sigh-out'}`}><div className="h-9 w-9 rounded-full bg-sky-300/35" /></div><p className="text-2xl font-bold text-white">{status === 'Breathing' ? 'Breathe In…' : 'Sigh Out…'}</p><p className="mt-2 text-sm text-sky-200">{status === 'Breathing' ? 'Let your breath fill slowly' : 'Release with a gentle, continuous sigh'}</p></div></div>}
      {completed && <div className="absolute inset-0 grid place-items-center bg-slate-950/82 p-5 backdrop-blur-sm"><div className="max-w-xs text-center"><p className="text-2xl font-bold text-white">Practice complete</p><p className="mt-2 text-sm text-sky-200">You paced through all {words.length} words. Notice what felt easy, then try again when ready.</p><div className="mt-5 flex justify-center gap-2"><button onClick={startPractice} className="rounded-lg bg-sky-400 px-3 py-2 text-sm font-bold text-slate-950">Practice again</button><button onClick={() => setCompleted(false)} className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold text-slate-100">Edit text</button></div></div></div>}
    </section>
    <div className="my-4 flex flex-wrap gap-2">{checklist.map((item) => <label key={item} className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition ${checks.includes(item) ? 'border-emerald-400 bg-emerald-400/20 text-emerald-100' : 'border-slate-700 bg-slate-800 text-slate-300'}`}><input className="sr-only" type="checkbox" checked={checks.includes(item)} onChange={() => setChecks((items) => items.includes(item) ? items.filter((value) => value !== item) : [...items, item])} />{checks.includes(item) ? '✓ ' : ''}{item}</label>)}</div>
    <footer className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="flex justify-between gap-2 text-xs font-bold tracking-widest text-slate-400"><span>STATUS: <span className={status === 'Ready' ? 'text-slate-200' : 'text-sky-300'}>{status === 'Sighing' ? 'Breathing' : status}</span></span><span>PROGRESS: <span className="text-sky-300">{words.length ? `${isPlaying ? activeWordIndex + 1 : 0}/${words.length}` : '0/0'}</span></span><span>WPM: <span className="text-sky-300">{wpm}</span></span></div>
      <div className="flex items-center justify-between rounded-xl bg-slate-800 p-1"><IconButton label="Previous day" onClick={() => changeDay(-1)}><ChevronLeft /></IconButton><span className="text-sm font-semibold">{day}</span><IconButton label="Next day" onClick={() => changeDay(1)}><ChevronRight /></IconButton></div>
      <div className="flex items-center gap-3"><span className="text-xs font-bold text-slate-400">60</span><input aria-label="Words per minute" type="range" min="60" max="200" value={wpm} onChange={(e) => setWpm(Number(e.target.value))} className="h-2 flex-1 cursor-pointer accent-sky-400" /><span className="text-xs font-bold text-slate-400">200</span></div>
      <div><div className="mb-2 flex justify-between text-xs font-bold tracking-wider text-slate-400"><label htmlFor="pause-scale">PUNCTUATION PAUSE</label><span className="text-sky-300">{pauseScale}%</span></div><input id="pause-scale" aria-label="Punctuation pause length" type="range" min="0" max="200" step="10" value={pauseScale} onChange={(e) => setPauseScale(Number(e.target.value))} className="h-2 w-full cursor-pointer accent-sky-400" /></div>
      <button onClick={() => setSoundEnabled((enabled) => !enabled)} className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-sm font-semibold transition ${soundEnabled ? 'border-sky-400 bg-sky-400/15 text-sky-100' : 'border-slate-700 bg-slate-800 text-slate-300'}`}>{soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}{soundEnabled ? 'Sound cues on' : 'Sound cues off'}</button>
      <button onClick={shuffle} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-sky-400"><Shuffle size={16} /> Shuffle practice text</button>
    </footer>
  </section></main>
}

function IconButton({ children, label, onClick }) { return <button onClick={onClick} aria-label={label} title={label} className="grid h-9 w-9 place-items-center rounded-lg text-sky-200 transition hover:bg-slate-700 hover:text-white">{children}</button> }
function PacerText({ words, activeWordIndex }) { return <div className="flex w-full flex-wrap content-center gap-x-1.5 gap-y-2 overflow-y-auto p-5 text-lg leading-8 text-sky-50">{words.map((word, index) => <span key={`${word}-${index}`} className={index === activeWordIndex ? 'rounded bg-white px-1.5 py-0.5 font-semibold text-sky-950 shadow' : ''}>{word}</span>)}</div> }
