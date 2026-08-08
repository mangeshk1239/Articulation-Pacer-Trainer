# Articulation Pacer & Trainer

A mobile-first React app for structured articulation practice. It helps a user prepare a target sound, use a breathing cue, and read at a steady, adjustable pace.

## Features

- Daily articulation targets, physical-placement cues, and three practice passages per target
- Editable text area for custom practice text
- Three-second preparation cue: **Breathe In** followed by **Sigh Out**
- Word-by-word reading pacer with an adjustable 60–200 WPM rate
- Practice checklist for breath, light contact, rate control, and punctuation pauses
- Previous/next target navigation and passage shuffling
- Responsive dark UI designed for phone-sized screens

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite in a browser.

## Production build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

The project is configured to publish the generated `dist` folder to a `gh-pages` branch.

```bash
git init
git add .
git commit -m "Build articulation pacer"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
npm run deploy
```

In the repository’s **Settings → Pages**, select the `gh-pages` branch as the deployment source.

## Technology

- React + Vite
- Tailwind CSS
- Lucide React icons
- gh-pages

> This tool is for speech-practice support and is not a substitute for assessment or treatment by a qualified speech-language professional.
