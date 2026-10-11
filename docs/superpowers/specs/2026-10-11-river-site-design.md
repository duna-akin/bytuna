# bytuna redesign: the river site

Date: 2026-10-11
Status: draft for review
Reference prototype: `docs/superpowers/mockups/river-site-prototype.html` (open it in a browser; it is the approved look and feel)

## Intent

A personal site whose first five seconds say "this person is interesting and fun", built around the double meaning of the name: *tuna* is a fish in English and the Danube river in Turkish. Identity first: the name and one line about Tuna, nothing else competing for attention. It should be memorable and lightweight, with no framework.

What Tuna asked for:
- Start over in a fresh worktree; the React site goes away.
- The first screen is only the name and who Tuna is.
- Liquid name, deep-water mood (theme A), stirrable to the point of fully scrambling it, then reassembling.
- A quiet, low-detail fish so the focus stays on the name.
- Scroll down the river to a beach with links written in the sand and a message in a bottle for email.
- A shorter scroll, sound effects, and a different font for the sand writing.

Out of scope for now: projects, blog, Letterboxd feed, X link, a Python build step.

## Architecture

A static site with no build step and no dependencies.

```
index.html          all content and links, readable without JavaScript
styles.css          layout, typography, no-WebGL fallback styling
js/main.js          boot: feature detection, layout, render loop, input
js/gl.js            WebGL2 helpers: programs, textures, ping-pong targets
js/fluid.js         stable-fluids simulation that stirs the name
js/scene.js         the world shader (river, shallows, shore, beach, name, fish, bottle)
js/textures.js      draws the name and the sand words into textures from the DOM layout
js/fish.js          fish behaviour and skeleton
js/audio.js         Web Audio: ambience and effects, mute toggle
audio/              compressed sound files
fonts/              self-hosted font files (no Google Fonts request)
```

Each JS file is an ES module loaded with `<script type="module">`. The world shader stays a single full-screen pass; shader source lives in `scene.js` as template strings.

The HTML is the source of truth for text and positions. JavaScript measures the DOM (name, words, bottle) and draws matching textures, so changing copy or layout in HTML/CSS needs no shader changes.

## Experience

### Page structure

Three stacked regions, about 2.4 viewport heights in total:

1. **River (100vh):** hero.
2. **Passage (40vh):** open water.
3. **Beach (100vh):** links.

A fixed full-screen canvas renders one continuous world. Screen point `p` shows world point `p + (0, scrollY)`, so scrolling pans a camera down the river to the shore. The page scrolls normally; there is no scroll hijacking.

### River (hero)

- **Water:** deep teal (`#03141c` to `#07303d`), slow current flowing right, caustic light patterns, film grain, vignette.
- **Name:** "tuna" in Fraunces 700, `clamp(96px, 28vw, 420px)` (37vw on phones), rendered as liquid glass that refracts the water, with caustics inside the letters and a soft glow.
- **Stirring:** a GPU stable-fluids simulation (velocity, pressure, vorticity) advects an ink-displacement map that the letters are sampled through. The tuned values from the prototype are the spec:
  - curl 12, velocity dissipation 1.6, force 2600, splat radius 0.0013
  - single-flick cap of 36px
  - relaxation 0.35/s while stirring, rising to 2.55/s about 1.6s after the pointer stops, while swirls are damped
  - ink dilutes with distance travelled and with stretching
- **Clicking** drops a stone: a ripple plus an outward push on the ink.
- **Fish:**
  - the original top-down silhouette, muted `#9cc4c6` at 55% opacity, length `clamp(42px, 5.2vw, 96px)`
  - swims through the name, flees the cursor, and drags a little ink behind it
  - lives in the river only
- **Dictionary entry (HTML):**
  - **tu·na** /ˈtuː.nə/ *noun*
  - 1. a large, fast, restless fish.
  - 2. *Turkish.* the Danube, Europe's second-longest river.
  - 3. Tuna Akın, student @ Laf who builds things. ← you are here
- No corner labels, coordinates, or instructions anywhere.

### Scrolling away

- **While scrolling down:** rightward pushes along the name make the current carry the letters downstream.
- **Fade:** the name fades out between 8% and 58% of a viewport of scroll.
- **Scrolling back up:** the letters reassemble.
- **Simulation:** the fluid sim runs only while the name can be visible (scrollY < 1.2 viewports).

### Passage and shallows

- **Depth:** water depth decreases toward the shore, and colour blends from the deep teal to clear sea-glass green.
- **Sand bottom:** a sand bottom with caustics shows through the shallows.

### Beach

- **Shoreline:** a gently wavy line that laps in and out, with smooth foam, and a bigger wave about every 14s that leaves darker wet sand behind. This is the simple prototype version; the realistic surf experiment was rejected as too heavy.
- **Links:** "github" and "linkedin" are carved into the sand.
  - Real `<a>` elements sit at the carving positions with transparent text.
  - Hover or keyboard focus deepens the carving.
  - Waves reaching the words soften the carving.
- **Message in a bottle:** links to `mailto:tuna.akin@protonmail.com`.
  - Glass with a rolled note and a cork, rocking gently.
  - Hover or focus lifts it (bigger shadow) and reveals `tuna.akin@protonmail.com` beneath it.
- **Link targets:**
  - github: https://github.com/duna-akin
  - linkedin: https://www.linkedin.com/in/tuna-akin/

### Typography

- **Name and dictionary:** Fraunces (as in the prototype); mono details in JetBrains Mono.
- **Sand writing:** Caveat is dropped. The replacement is picked by Tuna from a side-by-side comparison screen built as the first implementation task. Candidates:
  1. Fraunces italic 600 (one type family for the whole site); this is the default if no preference emerges.
  2. Instrument Serif italic.
  3. JetBrains Mono 500 (a nod to "builds things").
  4. A hand-lettered display face such as Gloria Hallelujah.
- **Self-hosting:** all fonts are self-hosted WOFF2, subset to Latin plus Turkish characters (ı, ş, ğ, ç, ö, ü).

### Sound

- **Start:** audio starts after the visitor's first click, tap or key press, which is the earliest point browsers allow. It fades in over 1.5s.
- **Mute toggle:**
  - A small speaker button, fixed bottom-right, low contrast; the only UI chrome on the page.
  - Toggles mute, labelled for screen readers.
  - The choice persists in `localStorage` (wrapped in try/catch).
- **Ambience:**
  - A soft river murmur loop at the top crossfades into gentle surf as scroll approaches the beach, using equal-power crossfade on scroll progress.
- **Effects:**
  - Stirring: a watery swish whose gain follows pointer speed, at most one instance every 120ms.
  - Stones: a plop on click, slightly pitch-randomised.
- **Hidden tab:** audio pauses when the tab is hidden.
- **Sources:**
  - CC0 or self-recorded only; record source and licence in `audio/CREDITS.md`.
  - Opus in WebM with an MP3 fallback for Safari.
  - Total audio weight at most 600 KB.

### Phones and touch

- **Gestures:** dragging a finger across the name stirs it (`touch-action: none` on the name only), and tapping drops a stone. Scrolling works everywhere else.
- **Lighter rendering:** DPR is capped at 1 for the scene and 1.5 for text, the fluid grid is 96, and the ink map is 320.
- **Layout:** sand words and the bottle move to phone positions (see prototype media query).

## Fallbacks and accessibility

- **Without WebGL2 or float render targets:** the page shows the plain HTML (name in accent colour on the dark background; links styled as text). Stirring is disabled when float targets are missing, but rendering continues.
- **`prefers-reduced-motion`:** the current is frozen, the fish is hidden, and the "you are here" nudge stops; clicks still ripple.
- **Real HTML:** all text and links are real HTML, so screen readers and keyboard users get the full content. Focus styles are visible on the sand links and the bottle.
- **Without JavaScript:** the page is a readable, working single page.

## Performance budget

- **Frame rate:** 60fps on a typical laptop and at least 45fps on a mid-range phone, measured with the browser's performance tools.
- **Paused rendering:** nothing renders while the tab is hidden (the rAF loop stops on its own). The fluid sim is skipped once the name is scrolled away.
- **Page weight:** HTML, CSS and JS together under 120 KB uncompressed; fonts under 150 KB; audio under 600 KB, loaded after first interaction.

## Testing

- **Debug hook:** behind `?debug`, `window.__hero` lets a script step the simulation, stir, drop stones, hover, and scroll without a live mouse. This is the method used during design. It is never exposed without the flag.
- **Browser checklist,** run in Brave and on a real phone before merging:
  - no console errors
  - hero render and stir/reassemble
  - scroll fade and return
  - beach hover states
  - links open correct targets
  - mute toggle persists
  - reduced-motion mode
  - no-WebGL fallback (forced via `?nogl`)
- **Link check:** a small script checks that every link in `index.html` matches the spec above.

## Migration

- **Removals:** the React site (`src/`, `tweaks-panel/`, the old `index.html` and `styles.css`) is deleted in this branch.
- **Kept:** `assets/ghostnotes-logo.png` stays for the future projects section, and `README.md` is updated.
- **Hosting:** deployment is unchanged, as a static directory served as-is.
