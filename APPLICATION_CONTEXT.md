# Application Context: Articulation Pacer & Trainer

## Purpose

The application supports paced reading exercises for speech-articulation practice. It combines a gentle pre-speech breath cue with visual pacing modes, helping the user practise easier onsets, continuous airflow, light articulatory contact, steady rhythm, and intentional pauses.

It is a self-guided practice aid, not a diagnostic or clinical treatment tool.

## User journey

1. The user chooses a day/target category.
2. The screen shows the target sounds, a related Hindi classification, and articulator/contact instructions.
3. While stopped, the practice passage is editable inside a fixed-height, scrollable text panel; users may write or paste their own material.
4. On Play, the app displays **Breathe In…** for 1.5 seconds, then **Sigh Out…** for 1.5 seconds.
5. The user chooses a practice mode: **Word Pacer** or **Syllable Metronome**.
6. In Word Pacer mode, the app highlights one word at a time at the selected WPM. In Syllable Metronome mode, the app approximates syllable breaks and highlights one syllable-like unit per beat at the selected BPM.
7. During playback, the fixed-height text panel automatically scrolls to keep the active unit in view.
8. At the end of the passage, the pacer resets to Ready. The user can reflect with the four practice checks, change the WPM/BPM, set a punctuation delay, toggle sound cues, shuffle passages, or select another target.

## Practice content

`src/data.js` stores all exercise content in `practiceData`. Each key represents a target category:

- Mon — K, G
- Tue — CH, J
- Wed — Hard T, D, R (retroflex)
- Thu — Soft T, D, N, TH (dental)
- Fri — P, B, M
- Sat — S, Z, L, W, H
- Sun — vowels
- Clusters — Str, Pl, Tr, Bl

Each category includes its target label, Hindi descriptor, articulator instruction, contact instruction, and three passages. The Shuffle action chooses another passage from the current category.

## Pacer states

| State | Meaning | UI behavior |
| --- | --- | --- |
| Ready | The pacer is stopped. | Shows an editable, fixed-height textarea with internal scrolling. |
| Breathing | First 1.5 seconds after Play. | Shows the “Breathe In…” overlay. |
| Sighing | Second 1.5 seconds after Play. | Shows the “Sigh Out…” overlay; status remains presented as Breathing. |
| Running | Active practice. | Replaces the textarea with highlighted words or syllable-like units in the same fixed-height panel and auto-scrolls to the active unit. |

In Word Pacer mode, the passage is split on whitespace and the base timer interval is `(60 / WPM) × 1000` milliseconds. In Syllable Metronome mode, each word is split into syllable-like units with a lightweight English heuristic and the base timer interval is `(60 / BPM) × 1000` milliseconds. The syllable splitter is intentionally dependency-free and approximate; it preserves the original text characters but may not produce perfect dictionary syllabification for every word.

If the active word or syllable-like unit ends with `.`, `,`, `;`, `:`, `!`, or `?`, the app adds the selected punctuation delay after that unit. The delay options are 2, 3, 5, 10, and 15 seconds. Reaching the final unit automatically returns the app to Ready and resets the active index.

## Controls and saved preferences

The main controls are:

- Start/Pause and Reset action buttons in the header
- Day/target selector with previous and next buttons
- Practice Mode segmented control with Word Pacer and Syllable Metronome options
- WPM/BPM slider from 60 to 200, depending on the selected mode
- Punctuation delay segmented control with 2s, 3s, 5s, 10s, and 15s options
- Sound cue toggle
- Shuffle practice text button
- Four reflection check pills

The app stores the selected day, WPM/BPM value, practice mode, punctuation delay, checklist state, and sound setting in `localStorage`.

## Code structure

- `src/App.jsx` — interface, local state, breathing sequence, word/syllable tokenization, pacing interval, auto-scroll behavior, sound cues, and controls
- `src/data.js` — target and passage data
- `src/main.jsx` — React entry point
- `src/styles.css` — Tailwind import and base styles
- `vite.config.js` — Vite configuration, including `base: './'` for GitHub Pages

## Accessibility and design considerations

- Buttons have accessible labels, titles where useful, visible hover feedback, and large tap targets.
- Checklists use native checkbox inputs, with custom colored pill visuals.
- The refreshed UI uses a dark, glassy dashboard style inspired by the reference design, with separate cards for target focus, practice text, and controls.
- The layout is responsive: desktop uses roomy horizontal grouping, while mobile stacks header actions, tightens card padding, keeps controls tappable, and avoids horizontal scrolling.
- The practice text area has stable dimensions with internal scrolling so long passages do not resize the page.
- High-contrast dark and blue surfaces make the active unit clear without creating a visually busy interface.

## Deployment

`npm run deploy` builds the project then publishes `dist` through the `gh-pages` package. GitHub Pages should be configured to serve the `gh-pages` branch.
