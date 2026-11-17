# Design Document: D&D 2024 Beginner Character Generator ("HeroForge AI / Character Weave")

**Date:** 2026-11-17  
**Status:** Ready for User Approval  
**Target Project:** `C:\Users\Андрей\.gemini\antigravity\scratch\dnd-character-creator`

---

## 1. Intent and The "Why"
Dungeons & Dragons 2024 brings refined, modern rules, but for complete newcomers, character creation remains a formidable barrier: 300+ pages of the Player's Handbook, confusing jargon (AC, spell slots, saving throws, weapon mastery), and intimidating math. On the other hand, standard pre-generated character sheets feel sterile, generic, and uninspiring.

This service is a private, lightweight web tool ("сервис для своих") designed for rapid character creation. It empowers beginners to create a unique, deeply personal D&D 2024 character in minutes without reading the rulebook. The player expresses who they want to be through intuitive visual cards, writes their own unique custom ability in plain language (which the system balances against official 2024 mechanics), and uploads a selfie to be transformed into an epic fantasy portrait matching their character's race, class, and custom gear. The result is both an interactive smartphone-friendly character sheet for table play and an official downloadable D&D 2024 PDF. Characters can be saved and retrieved via a unique character access key/code.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **Frictionless Onboarding**: 3–4 visual archetype cards (Role, Source of Power, Species/Vibe) to automatically establish a valid D&D 2024 level 1 chassis (Class, Ability Scores, Background, Origin Feat, Equipment, HP, AC).
- **Narrative Backstory Generation**: An atmospheric 2–3 paragraph backstory generated in Russian, seamlessly weaving together the character's background, role, species heritage, personal motivation for adventuring, and their unique custom quirk.
- **Safe Custom Mechanics ("Balance Cards")**: Free-text prompt where the user describes any flavor or unique power they want. The system translates this into 2–3 balanced, rules-abiding mechanics replacing the background's Origin Feat or a starter Cantrip to ensure 100% table-legality without homebrew bloat.
- **Personalized Portrait ("D&D-ify Yourself")**: User uploads a photo/selfie; the system uses image-to-image AI to transform the user's likeness into a fantasy portrait reflecting their species traits, class armor, weapons, and custom flavor traits. Includes a graceful fallback: if no photo is uploaded, portrait is generated purely from lore or chosen from curated presets.
- **Dual Deliverables**:
  1. *Interactive Mobile Sheet*: Tap-to-roll/view interface designed for phone screens during live table sessions with human-friendly descriptions.
  2. *Official PDF Export*: Seamless export to the official D&D 2024 character sheet PDF with all stats, features, embedded Cyrillic font support (via `@pdf-lib/fontkit`), and the embedded portrait.
- **Key-Based Character Retrieval & Offline Access**: Characters are stored and retrieved using a unique secret key / short code (with local browser caching in `localStorage`), enabling quick sharing with the DM or loading on mobile devices without complex accounts.

### Non-Goals
- Full level 1–20 min-maxing leveling builder. V1 is strictly focused on Level 1 starter characters for beginners. Level 3 subclasses are deferred to a post-v1 update.
- Virtual Tabletop (VTT) engine with grid maps, fog of war, or dice physics.
- Heavy enterprise user registration / authentication / payment gateways.

### Anti-Goals
- Exposing raw D&D calculation formulas and rules jargon during the creation flow.
- Allowing game-breaking homebrew: all custom mechanics must fit within strict 2024 balance budgets.

---

## 3. Constraints
- **Ruleset**: Strictly D&D 2024 (Revised 5e / SRD 5.2). Backgrounds provide Ability Score Increases (+2/+1 or +1/+1/+1) and an Origin Feat; species do not grant ASIs; classes use 2024 weapon masteries and spell lists.
- **Language**: User interface and all generated descriptions in natural, welcoming Russian.
- **Cost & API Keys**: Private self-hosted tool ("для своих"). Central API keys (Gemini / Replicate) are managed securely via `.env`. A built-in mock mode allows development and full UI testing with zero API credit consumption.
- **Browser Compatibility**: Responsive design optimized for mobile screens (iOS Safari, Android Chrome) and desktop.

---

## 4. Architectural Approaches Considered

### Approach 1: Unified Modern Web App (Next.js / React + Tailwind CSS + TypeScript) — **SELECTED**
- **Architecture**: A single unified full-stack TypeScript application. Next.js App Router for frontend UI and serverless API endpoints:
  - `/api/generate-mechanic`: LLM prompt that takes user free-text and character context, returning structured JSON with 2–3 balanced D&D 2024 options.
  - `/api/generate-portrait`: Image-to-image pipeline transforming uploaded selfie + character prompt into a fantasy portrait.
  - `/api/characters`: Lightweight key-based character persistence (storing character JSON by unique access key / short code in a local JSON store or SQLite/Redis, plus browser `localStorage`).
  - Client/Server PDF generation via `pdf-lib` filling the official D&D 2024 form fields and embedding the portrait.
- **Pros**: Fastest time to market, single codebase, zero login friction (access via short key/code), trivial deployment to Vercel/VPS, superior mobile responsiveness.
- **Cons**: Requires external AI API credentials in production (configured centrally in `.env`).

### Approach 2: Python Backend (FastAPI) + React SPA Frontend — *REJECTED*
- **Architecture**: Separate React/Vite SPA and Python FastAPI backend running diffusers/Pydantic.
- **Pros**: Easier to host self-contained open-source models (e.g., local SDXL/ComfyUI) if self-hosting on a dedicated GPU server.
- **Cons**: Excessive operational complexity for MVP, two codebases to maintain, harder to deploy and demo quickly.

### Approach 3: Client-Only SPA with Direct Browser API Calls — *REJECTED*
- **Architecture**: Pure client-side React app calling AI APIs directly from the browser.
- **Pros**: Zero backend server required.
- **Cons**: Exposes secret API keys to the client; CORS and file upload limitations make robust image-to-image and PDF merging fragile.

---

## 5. Decisions Made with Human Partner
1. **Target Rules**: D&D 2024 Revised Rules.
2. **Target Audience**: Complete beginners who want an original, custom character without rulebook friction.
3. **Custom Mechanics Mechanism**: Hybrid model: User enters free-text fantasy $\rightarrow$ system generates 2–3 balanced "Balance Cards" based on 2024 rules $\rightarrow$ user picks their favorite.
4. **Onboarding Flow**: 3–4 visual archetype cards with friendly illustrations and role descriptions instead of mechanical lists.
5. **Portrait Generation**: User uploads their photo/selfie $\rightarrow$ system transforms the photo into a fantasy portrait infused with the character's species, armor, and custom gear.
6. **Final Deliverables**: Dual format — interactive mobile web sheet + official fillable D&D 2024 PDF with embedded portrait.

---

## 6. What's Left to the Builder
- Selection of specific UI animation tools (e.g. Framer Motion for card swipes, Lucide-React for icons, Tailwind for styling).
- Concrete prompt engineering templates for the LLM balance arbiter (ensuring strict JSON output schema: `{ title, trigger, effect, costOrTradeoff, ruleSource }`).
- PDF template field mapping for the official 2024 character sheet using `pdf-lib`.
- Fallback/mock generator for development so the entire app can be tested end-to-end without spending API credits.
- Local storage schema for persisting saved characters on the user's device.
