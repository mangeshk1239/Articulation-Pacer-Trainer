# Application Context: Stuttering Pacer & Articulation Trainer

## Purpose

The application supports paced reading exercises commonly used in stuttering and speech-articulation practice. It combines a gentle pre-speech breath cue with a word-by-word visual pace, helping the user practise easier onsets, continuous airflow, light articulatory contact, and intentional pauses.

It is a self-guided practice aid, not a diagnostic or clinical treatment tool.

## User journey

1. The user chooses a day/target category.
2. The screen shows the target sounds, a related Hindi classification, and articulator/contact instructions.
3. While stopped, the practice passage is editable; users may write or paste their own material.
4. On Play, the app displays **Breathe In…** for 1.5 seconds, then **Sigh Out…** for 1.5 seconds.
5. The app reads the passage visually by highlighting one word at a time at the selected WPM.
6. At the end of the passage, the pacer resets to Ready. The user can reflect with the four practice checks, change the WPM, shuffle passages, or select another target.

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
| Ready | The pacer is stopped. | Shows an editable textarea. |
| Breathing | First 1.5 seconds after Play. | Shows the “Breathe In…” overlay. |
| Sighing | Second 1.5 seconds after Play. | Shows the “Sigh Out…” overlay; status remains presented as Breathing. |
| Running | Active practice. | Replaces the textarea with highlighted words. |

For a passage split on whitespace, the timer interval is `(60 / WPM) × 1000` milliseconds. Reaching the final word automatically returns the app to Ready and resets the active index.

## Code structure

- `src/App.jsx` — interface, local state, breathing sequence, pacing interval, and controls
- `src/data.js` — target and passage data
- `src/main.jsx` — React entry point
- `src/styles.css` — Tailwind import and base styles
- `vite.config.js` — Vite configuration, including `base: './'` for GitHub Pages

## Accessibility and design considerations

- Buttons have accessible labels and visible hover feedback.
- Checklists use native checkbox inputs, with custom pill visuals.
- The layout uses a narrow max-width and fluid vertical sizing to avoid horizontal scrolling on mobile.
- High-contrast dark and blue surfaces make the active word clear without creating a visually busy interface.

## Deployment

`npm run deploy` builds the project then publishes `dist` through the `gh-pages` package. GitHub Pages should be configured to serve the `gh-pages` branch.
