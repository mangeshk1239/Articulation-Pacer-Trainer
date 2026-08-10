import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CirclePause,
  Feather,
  Gauge,
  GraduationCap,
  Library,
  Pause,
  Play,
  Rabbit,
  RotateCcw,
  Save,
  Shuffle,
  Target,
  Trash2,
  Turtle,
  UserRoundCog,
  Volume2,
  VolumeX,
  Wind,
} from 'lucide-react'
import { practiceData } from './data'

const dayNames = Object.keys(practiceData)
const checklist = [
  { label: 'Full Breath Taken', icon: Wind, tone: 'sky' },
  { label: 'Light Contact Used', icon: Feather, tone: 'violet' },
  { label: 'Controlled Rate', icon: Activity, tone: 'emerald' },
  { label: 'Paused at Punctuation', icon: CirclePause, tone: 'amber' },
]
const punctuationDelayOptions = [2, 3, 5, 10, 15]
const customPassagesStorageKey = 'articulation-pacer-custom-passages'
const practiceModes = [
  { id: 'words', label: 'Word Pacer', unitLabel: 'words', paceLabel: 'WPM' },
  { id: 'syllables', label: 'Syllable Metronome', unitLabel: 'syllables', paceLabel: 'BPM' },
]

function punctuationPauseMs(unit, punctuationDelaySeconds) {
  if (/[.,;:!?][”"')\]]*$/.test(unit)) return punctuationDelaySeconds * 1000
  return 0
}

function splitWordIntoSyllables(word) {
  const leading = word.match(/^[^A-Za-z]*/)?.[0] ?? ''
  const trailing = word.match(/[^A-Za-z]*$/)?.[0] ?? ''
  const core = word.slice(leading.length, word.length - trailing.length)

  if (!core || core.length <= 3) return [word]

  const syllables = core.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy](?![aeiouy]))?/gi)

  if (!syllables || syllables.length <= 1) return [word]

  const rebuilt = syllables.map((syllable, index) => {
    const prefix = index === 0 ? leading : ''
    const suffix = index === syllables.length - 1 ? trailing : ''
    return `${prefix}${syllable}${suffix}`
  })

  return rebuilt.filter(Boolean)
}

function splitTextIntoSyllables(text) {
  return text.trim() ? text.trim().split(/\s+/).flatMap(splitWordIntoSyllables) : []
}

function savedValue(key, fallback) {
  if (typeof window === 'undefined') return fallback
  return window.localStorage.getItem(key) ?? fallback
}

function loadCustomPassages() {
  try {
    const value = JSON.parse(savedValue(customPassagesStorageKey, '{}'))
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

    return Object.fromEntries(dayNames.map((day) => {
      const passages = Array.isArray(value[day]) ? value[day].filter((item) => typeof item === 'string' && item.trim()) : []
      return [day, passages]
    }))
  } catch {
    return {}
  }
}

function initialTextForDay(day, customPassages = loadCustomPassages()) {
  return customPassages[day]?.[0] || practiceData[day]?.texts[0] || practiceData.Mon.texts[0]
}

export default function App() {
  const [dayIndex, setDayIndex] = useState(() => Math.max(0, dayNames.indexOf(savedValue('articulation-pacer-day', 'Mon'))))
  const [customPassages, setCustomPassages] = useState(() => loadCustomPassages())
  const [text, setText] = useState(() => initialTextForDay(dayNames[Math.max(0, dayNames.indexOf(savedValue('articulation-pacer-day', 'Mon')))] || 'Mon'))
  const [wpm, setWpm] = useState(() => Math.min(200, Math.max(60, Number(savedValue('articulation-pacer-wpm', 100)) || 100)))
  const [practiceMode, setPracticeMode] = useState(() => practiceModes.some((mode) => mode.id === savedValue('articulation-pacer-practice-mode', 'words')) ? savedValue('articulation-pacer-practice-mode', 'words') : 'words')
  const [punctuationDelaySeconds, setPunctuationDelaySeconds] = useState(() => {
    const savedDelay = Number(savedValue('articulation-pacer-punctuation-delay-seconds', 2))
    return punctuationDelayOptions.includes(savedDelay) ? savedDelay : 2
  })
  const [status, setStatus] = useState('Ready')
  const [activeWordIndex, setActiveWordIndex] = useState(0)
  const [checks, setChecks] = useState(() => {
    try {
      const value = JSON.parse(savedValue('articulation-pacer-checks', '[]'))
      const checklistLabels = checklist.map((item) => item.label)
      return Array.isArray(value) ? value.filter((item) => checklistLabels.includes(item)) : []
    } catch {
      return []
    }
  })
  const [completed, setCompleted] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(() => savedValue('articulation-pacer-sound', 'false') === 'true')
  const audioContextRef = useRef(null)
  const day = dayNames[dayIndex]
  const focus = practiceData[day]
  const savedPassagesForDay = customPassages[day] || []
  const trimmedText = text.trim()
  const isSavedForDay = savedPassagesForDay.some((passage) => passage.trim() === trimmedText)
  const words = useMemo(() => text.trim() ? text.trim().split(/\s+/) : [], [text])
  const syllables = useMemo(() => splitTextIntoSyllables(text), [text])
  const paceUnits = practiceMode === 'syllables' ? syllables : words
  const selectedMode = practiceModes.find((mode) => mode.id === practiceMode) || practiceModes[0]
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
  useEffect(() => { window.localStorage.setItem(customPassagesStorageKey, JSON.stringify(customPassages)) }, [customPassages])
  useEffect(() => { window.localStorage.setItem('articulation-pacer-wpm', String(wpm)) }, [wpm])
  useEffect(() => { window.localStorage.setItem('articulation-pacer-practice-mode', practiceMode) }, [practiceMode])
  useEffect(() => { window.localStorage.setItem('articulation-pacer-punctuation-delay-seconds', String(punctuationDelaySeconds)) }, [punctuationDelaySeconds])
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
    if (status === 'Running') playTone(660, 0.1, 0.09)
  }, [status, activeWordIndex, playTone])

  useEffect(() => {
    if (status !== 'Running') return
    if (!paceUnits.length) { setStatus('Ready'); return }
    const currentUnit = paceUnits[activeWordIndex]
    const delay = (60 / wpm) * 1000 + punctuationPauseMs(currentUnit, punctuationDelaySeconds)
    const timer = setTimeout(() => {
      if (activeWordIndex >= paceUnits.length - 1) {
        setStatus('Ready')
        setActiveWordIndex(0)
        setCompleted(true)
        playTone(784, 0.35, 0.06)
        return
      }
      setActiveWordIndex((current) => current + 1)
    }, delay)
    return () => clearTimeout(timer)
  }, [status, wpm, punctuationDelaySeconds, paceUnits, activeWordIndex, playTone])

  const stop = () => { setStatus('Ready'); setActiveWordIndex(0) }
  const startPractice = () => { if (!paceUnits.length) return; setCompleted(false); setActiveWordIndex(0); playTone(392, 0.22, 0.05); setStatus('Breathing') }
  const playPause = () => { isPlaying ? stop() : startPractice() }
  const changePracticeMode = (mode) => { stop(); setCompleted(false); setPracticeMode(mode) }
  const changeDay = (direction) => {
    stop()
    const next = (dayIndex + direction + dayNames.length) % dayNames.length
    setDayIndex(next)
    setText(initialTextForDay(dayNames[next], customPassages))
    setChecks([])
    setCompleted(false)
  }
  const saveCurrentPassage = () => {
    if (!trimmedText) return
    stop()
    setCompleted(false)
    setCustomPassages((current) => {
      const currentDayPassages = current[day] || []
      const withoutDuplicate = currentDayPassages.filter((passage) => passage.trim() !== trimmedText)
      return { ...current, [day]: [trimmedText, ...withoutDuplicate] }
    })
    setText(trimmedText)
  }
  const loadSavedPassage = (passage) => {
    stop()
    setCompleted(false)
    setText(passage)
  }
  const deleteSavedPassage = (passageToDelete) => {
    stop()
    setCompleted(false)
    setCustomPassages((current) => {
      const nextDayPassages = (current[day] || []).filter((passage) => passage !== passageToDelete)
      return { ...current, [day]: nextDayPassages }
    })
  }
  const shuffle = () => {
    stop()
    setCompleted(false)
    const choices = [...savedPassagesForDay, ...focus.texts].filter((item) => item !== text)
    setText(choices[Math.floor(Math.random() * choices.length)] || focus.texts[0])
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#030b16] text-slate-100">
      <div className="app-shell mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-5 sm:px-8 sm:py-7 lg:px-10">
        <header className="mb-5 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">
            Articulation Pacer <span className="text-sky-400">Practice</span>
          </h1>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <ActionButton label={isPlaying ? 'Pause' : 'Start'} onClick={playPause}>{isPlaying ? <Pause /> : <Play />}</ActionButton>
            <ActionButton label="Reset" onClick={stop}><RotateCcw /></ActionButton>
          </div>
        </header>

        <section className="target-card mb-5 grid gap-6 rounded-2xl border border-sky-400/60 bg-slate-900/65 p-4 shadow-2xl shadow-sky-950/30 sm:mb-6 sm:p-7 md:grid-cols-[1fr_auto_1.15fr] md:items-center">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-sky-500/20 text-sky-300 shadow-inner shadow-sky-300/10 sm:h-24 sm:w-24">
              <Target className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-wider text-sky-300 sm:text-base">Target Focus</p>
              <p className="mt-2 text-3xl font-black text-white sm:mt-3 sm:text-4xl">{day}</p>
              <p className="mt-2 text-lg leading-7 text-slate-200 sm:mt-3 sm:text-xl sm:leading-8">{focus.target} / {focus.hindi}</p>
            </div>
          </div>
          <div className="hidden h-36 w-px bg-slate-600/70 md:block" />
          <div className="space-y-5 sm:space-y-6">
            <InfoRow icon={UserRoundCog} title="Articulator" titleClass="text-violet-300" iconClass="bg-violet-500/20 text-violet-300">
              {focus.articulator}
            </InfoRow>
            <InfoRow icon={GraduationCap} title="Practice" titleClass="text-emerald-300" iconClass="bg-emerald-500/18 text-emerald-300">
              {focus.contact}
            </InfoRow>
          </div>
        </section>

        <section className="panel-card mb-5 rounded-2xl border border-slate-700/80 bg-slate-900/68 p-4 shadow-2xl shadow-black/20 sm:mb-6 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-5">
            <p className="text-sm font-black uppercase tracking-wider text-blue-300 sm:text-base">Practice Text</p>
            <span className="rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-bold text-slate-200 sm:px-4 sm:py-2 sm:text-sm">{text.length} characters</span>
          </div>
          <section className="practice-text-panel relative flex overflow-hidden rounded-xl border border-cyan-300/80 bg-[#071827]/80 shadow-inner shadow-sky-950/40">
            {isPlaying ? (
              <PacerText units={paceUnits} activeUnitIndex={activeWordIndex} />
            ) : (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-label="Practice text"
                className="h-full w-full resize-none overflow-y-auto bg-transparent p-4 text-lg leading-8 text-sky-50 outline-none placeholder:text-sky-200/50 sm:p-5 sm:text-xl sm:leading-9"
                placeholder="Paste or write your practice text..."
              />
            )}
            {(status === 'Breathing' || status === 'Sighing') && <BreathOverlay status={status} />}
            {completed && <CompletedOverlay unitCount={paceUnits.length} unitLabel={selectedMode.unitLabel} startPractice={startPractice} setCompleted={setCompleted} />}
          </section>
          <div className="mt-5 flex flex-wrap gap-4">
            {checklist.map((item) => <ChecklistPill key={item.label} item={item} checks={checks} setChecks={setChecks} />)}
          </div>
          <PassageLibrary
            disabled={isPlaying}
            isSavedForDay={isSavedForDay}
            onDelete={deleteSavedPassage}
            onLoad={loadSavedPassage}
            onSave={saveCurrentPassage}
            passages={savedPassagesForDay}
            textHasContent={Boolean(trimmedText)}
          />
        </section>

        <footer className="panel-card space-y-5 rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 shadow-2xl shadow-black/20 sm:p-6">
          <div className="grid gap-4 text-sm font-black uppercase tracking-wider text-blue-300 sm:grid-cols-3 sm:items-center">
            <StatusMetric label="Status"><span className="inline-flex items-center gap-2 normal-case tracking-normal text-white"><span className="h-3 w-3 rounded-full border-2 border-emerald-400" />{status === 'Sighing' ? 'Breathing' : status}</span></StatusMetric>
            <StatusMetric label="Progress"><span className="normal-case tracking-normal text-white"><span className="text-sky-400">{paceUnits.length ? (isPlaying ? activeWordIndex + 1 : 0) : 0}</span> / {paceUnits.length}</span></StatusMetric>
            <StatusMetric label={selectedMode.paceLabel} className="sm:justify-end"><Gauge size={18} className="text-slate-300" /><span className="normal-case tracking-normal text-sky-300">{wpm}</span></StatusMetric>
          </div>

          <div>
            <div className="mb-3 flex justify-between gap-3 text-sm font-black uppercase tracking-wider text-blue-300 sm:text-base">
              <span>Practice Mode</span>
              <span className="text-sky-400">{selectedMode.unitLabel}</span>
            </div>
            <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/30">
              {practiceModes.map((mode) => (
                <button key={mode.id} type="button" onClick={() => changePracticeMode(mode.id)} className={`border-r border-slate-700 px-3 py-3 text-sm font-black transition last:border-r-0 sm:text-base ${practiceMode === mode.id ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'text-slate-200 hover:bg-slate-800'}`} aria-pressed={practiceMode === mode.id}>
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr_auto] items-center rounded-xl border border-slate-700/70 bg-slate-800/70 p-1">
            <IconButton label="Previous day" onClick={() => changeDay(-1)}><ChevronLeft /></IconButton>
            <div className="flex items-center justify-center gap-2 text-lg font-bold text-white sm:gap-3 sm:text-xl"><CalendarDays size={22} className="text-slate-300" />{day}</div>
            <IconButton label="Next day" onClick={() => changeDay(1)}><ChevronRight /></IconButton>
          </div>

          <div className="grid grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] items-center gap-2 sm:gap-3">
            <Turtle className="text-slate-300" size={24} />
            <span className="text-base font-bold text-slate-300">60</span>
            <input aria-label={selectedMode.paceLabel === 'BPM' ? 'Beats per minute' : 'Words per minute'} type="range" min="60" max="200" value={wpm} onChange={(e) => setWpm(Number(e.target.value))} className="h-2 min-w-0 w-full cursor-pointer accent-sky-400" />
            <span className="text-base font-bold text-slate-300">200</span>
            <Rabbit className="text-slate-300" size={24} />
          </div>

          <div className="border-t border-slate-700/70 pt-5">
            <div className="mb-4 flex justify-between gap-3 text-sm font-black uppercase tracking-wider text-blue-300 sm:text-base">
              <span>Punctuation Delay</span>
              <span className="text-sky-400">{punctuationDelaySeconds}s</span>
            </div>
            <div className="grid grid-cols-5 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/30">
              {punctuationDelayOptions.map((seconds) => (
                <button key={seconds} type="button" onClick={() => setPunctuationDelaySeconds(seconds)} className={`border-r border-slate-700 py-3 text-base font-black transition last:border-r-0 sm:py-4 sm:text-lg ${punctuationDelaySeconds === seconds ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'text-slate-200 hover:bg-slate-800'}`} aria-pressed={punctuationDelaySeconds === seconds}>
                  {seconds}s
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setSoundEnabled((enabled) => !enabled)} className={`flex w-full items-center justify-center gap-3 rounded-xl border py-3 text-base font-bold transition sm:py-3.5 sm:text-lg ${soundEnabled ? 'border-sky-400 bg-sky-500/15 text-sky-100' : 'border-slate-700 bg-slate-800/70 text-slate-200 hover:bg-slate-800'}`}>{soundEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}{soundEnabled ? 'Sound cues on' : 'Sound cues off'}</button>
          <button onClick={shuffle} className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-3 py-4 text-lg font-black text-white shadow-lg shadow-sky-950/30 transition hover:brightness-110 sm:gap-4 sm:py-5 sm:text-xl"><Shuffle size={25} /> Shuffle practice text</button>
        </footer>
      </div>
    </main>
  )
}

function ActionButton({ children, label, onClick }) {
  return <button onClick={onClick} aria-label={label} title={label} className="grid h-16 w-full place-items-center rounded-2xl border border-slate-700 bg-slate-900/60 text-slate-100 shadow-lg shadow-black/20 transition hover:border-sky-400 hover:text-sky-300 sm:h-24 sm:w-24"><span className="grid place-items-center gap-1 sm:gap-2">{children}<span className="text-xs font-medium sm:text-sm">{label}</span></span></button>
}

function IconButton({ children, label, onClick }) {
  return <button onClick={onClick} aria-label={label} title={label} className="grid h-12 w-12 place-items-center rounded-lg text-slate-200 transition hover:bg-slate-700 hover:text-white">{children}</button>
}

function InfoRow({ icon: Icon, title, children, iconClass, titleClass }) {
  return <div className="flex items-center gap-4 sm:gap-5"><div className={`grid h-14 w-14 shrink-0 place-items-center rounded-full sm:h-16 sm:w-16 ${iconClass}`}><Icon className="h-7 w-7 sm:h-[30px] sm:w-[30px]" /></div><div className="min-w-0"><p className={`text-base font-black sm:text-lg ${titleClass}`}>{title}</p><p className="mt-1 text-sm leading-6 text-slate-300 sm:mt-2 sm:text-base">{children}</p></div></div>
}

function ChecklistPill({ item, checks, setChecks }) {
  const Icon = item.icon
  const selected = checks.includes(item.label)
  return (
    <label className={`check-pill check-pill-${item.tone} ${selected ? 'is-selected' : ''}`}>
      <input className="sr-only" type="checkbox" checked={selected} onChange={() => setChecks((items) => items.includes(item.label) ? items.filter((value) => value !== item.label) : [...items, item.label])} />
      <Icon size={23} />
      <span>{item.label}</span>
    </label>
  )
}

function StatusMetric({ label, children, className = '' }) {
  return <div className={`flex items-center gap-3 ${className}`}><span>{label}</span>{children}</div>
}

function PassageLibrary({ disabled, isSavedForDay, onDelete, onLoad, onSave, passages, textHasContent }) {
  return (
    <section className="mt-5 border-t border-slate-700/70 pt-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-blue-300 sm:text-base">
          <Library size={18} />
          <span>Saved Passages</span>
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={disabled || !textHasContent || isSavedForDay}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-400/70 bg-sky-500/15 px-3 py-2 text-sm font-bold text-sky-100 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800/60 disabled:text-slate-500"
        >
          <Save size={16} />
          {isSavedForDay ? 'Saved' : 'Save passage'}
        </button>
      </div>
      {passages.length ? (
        <div className="grid gap-2">
          {passages.map((passage, index) => (
            <div key={`${passage}-${index}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-950/25 p-2">
              <button type="button" onClick={() => onLoad(passage)} disabled={disabled} className="min-w-0 truncate rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-500">
                {passage}
              </button>
              <button type="button" onClick={() => onLoad(passage)} disabled={disabled} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-sky-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-500">
                Load
              </button>
              <button type="button" onClick={() => onDelete(passage)} disabled={disabled} aria-label="Delete saved passage" title="Delete saved passage" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-700 text-slate-300 transition hover:border-rose-400 hover:bg-rose-500/15 hover:text-rose-200 disabled:cursor-not-allowed disabled:text-slate-600">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-slate-700/70 bg-slate-950/25 px-3 py-3 text-sm font-medium text-slate-400">No saved passages for this target yet.</p>
      )}
    </section>
  )
}

function BreathOverlay({ status }) {
  return <div className="absolute inset-0 grid place-items-center bg-slate-950/82 backdrop-blur-sm"><div className="text-center"><div className={`breath-orb mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full border-4 border-sky-200/90 ${status === 'Breathing' ? 'breathe-in' : 'sigh-out'}`}><div className="h-9 w-9 rounded-full bg-sky-300/35" /></div><p className="text-2xl font-bold text-white">{status === 'Breathing' ? 'Breathe In...' : 'Sigh Out...'}</p><p className="mt-2 text-sm text-sky-200">{status === 'Breathing' ? 'Let your breath fill slowly' : 'Release with a gentle, continuous sigh'}</p></div></div>
}

function CompletedOverlay({ unitCount, unitLabel, startPractice, setCompleted }) {
  return <div className="absolute inset-0 grid place-items-center bg-slate-950/84 p-5 backdrop-blur-sm"><div className="max-w-xs text-center"><p className="text-2xl font-bold text-white">Practice complete</p><p className="mt-2 text-sm text-sky-200">You paced through all {unitCount} {unitLabel}. Notice what felt easy, then try again when ready.</p><div className="mt-5 flex justify-center gap-2"><button onClick={startPractice} className="rounded-lg bg-sky-400 px-3 py-2 text-sm font-bold text-slate-950">Practice again</button><button onClick={() => setCompleted(false)} className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold text-slate-100">Edit text</button></div></div></div>
}

function PacerText({ units, activeUnitIndex }) {
  const scrollerRef = useRef(null)
  const unitRefs = useRef([])

  useEffect(() => {
    const scroller = scrollerRef.current
    const activeUnit = unitRefs.current[activeUnitIndex]
    if (!scroller || !activeUnit) return

    const targetTop = activeUnit.offsetTop - (scroller.clientHeight / 2) + (activeUnit.clientHeight / 2)
    scroller.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
  }, [activeUnitIndex])

  return <div ref={scrollerRef} className="h-full w-full overflow-y-auto p-4 text-lg leading-8 text-sky-50 sm:p-5 sm:text-xl sm:leading-9"><div className="flex min-h-full flex-wrap content-start gap-x-2 gap-y-2">{units.map((unit, index) => <span ref={(element) => { unitRefs.current[index] = element }} key={`${unit}-${index}`} className={`pace-unit ${index === activeUnitIndex ? 'is-active' : ''}`}>{unit}</span>)}</div></div>
}
