# Design Specification v3: MDATE-P-2 ¿ Patient-Facing Experience

**Document path:** `docs/design-spec-v3.md`  
**Canonical target:** replaces `docs/design-spec.md` only after this document is reviewed against the actual Expo code  
**Target branch:** `main` (revision on a dedicated branch; diff reviewed before merge)  
**Change boundary:** Documentation only. No Expo code changes. No backend changes. No changes to the locked HLD architecture.

---

## 0. Revision Ledger

| Version | Status | Notes |
|---|---|---|
| v1 | Superseded | Undocumented scoring algorithm; outdated two-button activity model; 181+ corrupted characters |
| v2 | Working document | Correct structure and design reasoning; **181 corrupted characters still present**; navigation and Challenge functionality inaccurate; cross-reference errors; preference integration not documented |
| **v3** | **Draft ¿ Pending design decisions and validation** | This document. Corrects C1¿C6 from the v2 review; adds implementation-gap tables; distinguishes implemented / integrated / planned; corrects metadata and cross-references |

### 0.1 What changed in v3

| Finding | Corrective action | Where |
|---|---|---|
| C1 ¿ 181 `¿` characters | Unicode restored throughout (arrows `¿`, `¿`, `×`, punctuation, box-drawing). V-17 acceptance criterion remains the automated check. | entire document |
| C2 ¿ Navigation inaccurate | Module and activity selection use carousels; practice sets are embedded inside Activity Selection; no separate Practice Set screen. Carousel¿list is labelled as a **proposed change**, not current functionality. | §3.2, §3.3, §4.2¿4.4 |
| C3 ¿ Challenge overstated | Functionality split into three levels: implemented interface / implemented interaction & API / planned assessment & session behaviour. Answer reset, missing pause/exit, no evaluation call, no persistence explicitly documented. | §4.5 |
| C4 ¿ Preferences not applied | Implementation-gap table added; `alternativeInputOn` semantics specified. | §6.2 |
| C5 ¿ Platform units inconsistent | CSS px / dp / pt separated per platform. | §6.1 |
| C6 ¿ Metadata / cross-refs | Corrected. Stage statuses in §11 now honest. | §1.4, §3.2, §3.3, §10.2, §11 |
| Design A ¿ Dashboard primary action | Start Training becomes the Primary; remaining seven shortcuts become Secondary. | §4.1 |
| Design B ¿ Voice playback | Manual playback default; automatic only as explicit preference. | §4.5, §6.2 |
| Design C ¿ Multimodal redundancy | Narrowed to important instructions, actions, and feedback. | DR-A11Y-02 |
| Design D ¿ Clinical assumptions | Target population separated from possible co-occurring impairments. | §2.1 |

---

## 1. Document Control and Scope

### 1.1 Status

**Draft ¿ Pending design decisions and validation.**

Not implementation-ready. Not a clinical validation claim. May not be described as clinically validated or universally aphasia-friendly until user testing is performed (§9.3).

### 1.2 Audience

- Frontend engineer implementing the patient-facing Expo application.
- Designer and product owner resolving §10.1 open decisions.
- Reviewer verifying acceptance criteria in §9.

### 1.3 In scope

Patient-facing screens existing in the Expo route structure; accessibility preferences exposed in account setup; design tokens, interaction behaviour, system states, and verification criteria for those screens.

### 1.4 Out of scope and repository inventory

Out of scope:

- Therapist portal interface (route group exists; entry screen empty). Separate specification. (A2)
- Backend session lifecycle implementation.
- Clinical efficacy claims.

**Repository documentation inventory (corrects v2 §10.2):**

`docs/` currently contains:

- `design-spec.md` (v1, superseded)
- `design-spec-v2.md` (working document, superseded by this file after review)

The HLD and SRS referenced in prior project decisions are **not version-controlled here**. This limits document-to-document traceability. Flagged in §10.2.

### 1.5 Encoding integrity

v1 and v2 both contain corrupted characters where punctuation, arrows (`¿`), comparison symbols (`¿`, `¿`, `×`), and box-drawing characters were replaced by `¿`. v2 §1.5 *claimed* this was corrected; it was not (181 occurrences remained).

This v3 was authored with Unicode restored from the first character. Acceptance criterion **V-17** in §9.2 is the automated gate: the document must contain zero `¿` characters at the time of approval. Reviewers must not approve if V-17 fails.

### 1.6 Relationship to other documents

No version-controlled HLD or SRS present in `docs/`. Dependencies on HLD decisions are flagged in §10.2. Where this document states a design intent that the HLD has already fixed differently, the HLD wins and this document must be corrected.

---

## 2. Product Context and Design Principles

### 2.1 Target population and co-occurring impairments ¿ corrected

v2 described the primary user as "a person living with aphasia, typically following stroke" and listed motor and visual impairment as if universal. **This conflates the target population with a possible impairment profile.** The corrected framing:

**Target population:** Adults with aphasia who are using MDATE as part of their therapy. Aphasia affects language comprehension and production; it does not reduce general cognition.

**Possible co-occurring impairments** ¿ to be *accommodated when present*, not *assumed*:

- Motor impairment (e.g. hemiparesis) affecting reach, tap precision, or sustained hold.
- Visual field loss or reduced visual acuity.
- Fatigue and reduced sustained attention.
- Hearing loss.
- Cognitive-communication differences beyond aphasia.

**Design implication:** The interface must *accommodate individual needs*, not design for an assumed universal disability profile (A10). Where v3 states a specific accommodation (e.g. DR-A11Y-07 edge placement), it is a candidate accommodation to be validated in usability testing, not a permanent assumption that every patient has that impairment.

### 2.2 Design principles

**P1. Support communication rather than remove words.**  
Aphasia-friendly design is not simply "less text." Supported Conversation principles combine spoken and written keywords, gestures, drawings, and pictographs, adapted to the individual. ASHA guidance emphasises individual communication preferences, sufficient response time, and multi-modality support.

**P2. Icons support understanding; they do not replace it.**  
Icons aid comprehension, not guarantee it. Critical instructions require more than an icon alone.

**P3. Individual difference over assumed profile.**  
User preferences (text size, contrast, input mode, voice, speech rate) take precedence over fixed design values (§6.2).

**P4. Predictable over minimal.**  
Navigation is hierarchical and predictable. Arbitrary structural limits are removed (§3.4).

**P5. No unnecessary time pressure.**  
No visible countdown pressure, no arbitrary response deadline. Backend session expiry is accommodated (§7.4).

**P6. Readability takes precedence over aesthetic restraint.**

**P7. Honest status labelling.**  
Every feature is labelled with one of three implementation levels (§3.3). No planned feature is presented as functioning.

---

## 3. Information Architecture and User Journeys

### 3.1 Implementation baseline

The Expo route structure is the baseline for all implemented journeys (A3).

### 3.2 Three-level implementation status ¿ new in v3

v2 used only "Implemented" / "Planned." That was insufficient, and led to the false claim that the challenge supports assessment, persistence, and pause/exit. v3 uses three levels.

| Level | Meaning | Example |
|---|---|---|
| **L1 ¿ Interface** | The visible UI exists and is navigable | Microphone button renders |
| **L2 ¿ Interaction & API** | User can complete the interaction; frontend calls the relevant API | Recording produces a transcription |
| **L3 ¿ Assessment & session behaviour** | Result is evaluated, persisted, and reflected in session state | Answer is scored by `/api/v1/speech/evaluate`; progress is saved; session summary is produced |

A screen may be L1-complete but L2- or L3-incomplete. v3 records the level per feature.

### 3.3 Actual navigation model ¿ corrected (C2)

The Expo implementation is hierarchical but uses **carousel-based selection with embedded practice sets**. There is no separate Practice Set screen.

**Evidence (v2 review, verified against `main`):**

- `ModuleSelectorScreen.tsx` uses `moduleIndex` and carousel arrows.
- `ActivitySelectorScreen.tsx` uses `activityIndex` and carousel arrows.
- Practice sets render via `practiceSets.map()` **inside** `ActivitySelectorScreen.tsx`.
- `app/(app)/q-sets/[qSetId].tsx` routes directly to `ChallengeScreen.tsx`.

**Corrected flow:**

```
Auth (sign in)
  ¿
  ¿
Account setup (first use; accessibility preferences captured)
  ¿
  ¿
Dashboard
  ¿   profile header, carousel placeholder, metrics, action grid
  ¿
  ¿
Module selection  (carousel, one module at a time)
  ¿
  ¿
Activity selection  (carousel, one activity at a time)
  ¿   ¿¿¿ practice sets embedded below the current activity
  ¿
  ¿
Challenge  (routed via q-sets/[qSetId])
  ¿   picture clue · hints · text answer · microphone · spoken prompt
  ¿   previous / next question
  ¿¿¿ (no separate Practice Set screen exists)
```

**Proposed change (not current functionality):** replacing the module and activity carousels with vertical lists is a **proposed design change**. It may be evaluated, but it must not be specified as current behaviour. Until approved, the carousel model is described in §4.2¿4.4.

### 3.4 Navigation rules

1. **Hierarchical navigation is preserved.** Module ¿ activity ¿ embedded practice sets ¿ challenge. Never flattened. (A6)
2. **Predictable back controls.** Every screen below the dashboard provides a visible, consistently positioned back control returning to the immediate parent.
3. **Clear progress indicators.** Within the challenge, position within the current question set must be visible (e.g. "3 of 8" or a non-lexical equivalent).
4. **No hidden navigation.** No hamburger menus, no swipe-only gestures, no long-press navigation.
5. **Persistent escape.** *(L3 target ¿ not yet implemented, see §4.5.)* Pause and exit must be available on the challenge screen and must not move between questions.
6. **Deep-link safety.** A deep link into a child route must render a valid parent chain or a safe recovery screen.

### 3.5 Implemented / L1 / L2 / L3 matrix ¿ corrected

| Area | L1 | L2 | L3 | Notes |
|---|---|---|---|---|
| Auth | Yes | Yes | Yes | ¿ |
| Account setup | Yes | Yes | Yes | Preferences stored |
| Dashboard | Yes | Partial | Partial | Carousel is placeholder; metrics depends on reporting API |
| Module selection | Yes | Yes | Yes | Carousel |
| Activity selection | Yes | Yes | Yes | Carousel; practice sets embedded |
| Challenge ¿ interface | Yes | ¿ | ¿ | Picture clue, hints, text input, mic, transcription, spoken prompt, prev/next |
| Challenge ¿ pause / exit | **No** | No | No | Not implemented as specified |
| Challenge ¿ evaluation | **No** | No | No | Does not call `/api/v1/speech/evaluate` |
| Challenge ¿ answer persistence | **No** | No | No | `changeQuestion()` calls `setAnswer("")`; Finish calls `router.back()` |
| Progress | No | No | No | Placeholder |
| Session summary | **No (proposed)** | No | No | Not implemented |
| Help | **No (proposed)** | No | No | No dedicated route |
| Profile | Yes | Yes | Yes | ¿ |
| Settings | Yes | Yes | Yes | Persists preferences (see §6.2 gap table) |
| Therapist portal | Yes (empty entry) | ¿ | ¿ | Out of scope |

---

## 4. Screen-Level Specifications

### 4.0 Visual priority framework

v1 used a scoring algorithm (T, M, I, thresholds 4.20 / 2.50) that was never formally documented. v2 replaced it with Primary / Secondary / Supporting. v3 retains that replacement.

#### 4.0.1 Method

1. **Objective** ¿ state the screen's single primary objective and its supporting objectives.
2. **Inventory** ¿ list every element; classify as Content / Interaction / Visual.
3. **Group** ¿ assign to visual groups by shared purpose, proximity, similarity, shared container, alignment.
4. **Prioritise** ¿ Primary / Secondary / Supporting, based on task contribution.
5. **Cap focal groups** ¿ no more than **two** focal groups may hold Primary emphasis on one screen. Others demote.
6. **Apply treatment** ¿ map priority ¿ tokens in §5.3. Dominance by scale + contrast + whitespace + position, not size alone.
7. **Validate** ¿ six checks in §9.1.

#### 4.0.2 Priority ¿ treatment

| Priority | Treatment |
|---|---|
| Primary | Largest type step, strongest contrast, accent surface permitted, generous whitespace, focal position |
| Secondary | Mid type step, strong neutral contrast, contained region, no accent fill |
| Supporting | Smallest permitted type step, muted contrast (still ¿ 4.5:1), compact spacing |

#### 4.0.3 Traceability

Every screen table below records priority per element, justified by that screen's objective. This replaces v1's algorithm references. If the original algorithm is later approved as a deliverable (OD-7), §4.0.1 is the section to replace.

### 4.1 Dashboard ¿ L1 implemented, L2/L3 partial

- **Purpose:** Orient the user and provide the entry point into therapy.
- **Primary objective:** Begin training.
- **Secondary objectives:** Resume in-progress training; reach profile, settings, and other shortcuts.

**Design decision A applied:** Start Training is the Primary action. The eight action-grid shortcuts are demoted to Secondary / Supporting. This is a design change from the current dashboard (which presents eight shortcuts with no dominant entry) and must be flagged as such for engineering.

| Element | Type | Group | Priority | Treatment | Current state |
|---|---|---|---|---|---|
| **Start Training** | Interaction | `therapy-entry` | **Primary** | Accent fill, `type.lg`, ¿ 56 px, icon + label | **Proposed primary** ¿ not currently dominant |
| Profile header | Content + visual | `identity` | Secondary | Header region, `type.md`, no accent | Implemented |
| Carousel | Visual | `discovery` | Supporting | Placeholder only | Placeholder ¿ must not compete with Start Training until real content exists |
| Metrics area | Content | `metrics` | Supporting | Compact, muted, contained | Depends on reporting API (L2 partial) |
| Shortcut grid (7 remaining) | Interaction | `shortcuts` | Secondary | Grid, consistent cell sizing, ¿ 48 px targets | Implemented |

- **Focal groups:** one Primary (`therapy-entry`). If the carousel receives real content later, it may become the second Primary group; not a third.
- **Open item:** dashboard primary action confirmed as "Start Training" pending OD-2 (still open for stakeholder sign-off).
- **States:** default, loading (metrics), empty (no modules), error (metrics fetch failed).

### 4.2 Module selection ¿ L1/L2/L3 implemented

- **Primary objective:** Choose a therapy module.
- **Current interaction:** **carousel** with `moduleIndex` and left/right arrows (one module visible at a time).
- **Hierarchy:** the current module card is Primary; the carousel arrows are Secondary (¿ 48 px); back control is Supporting.
- **Components:** current module card (icon + short label), previous/next arrows, back control, optional page indicator.
- **Proposed change (not current):** replacing the carousel with a vertical list ¿ must be labelled Proposed in any revision that introduces it.
- **States:** default, loading, empty (no modules assigned), error with retry.

### 4.3 Activity selection ¿ L1/L2/L3 implemented (practice sets embedded)

- **Primary objective:** Choose an activity within the current module.
- **Current interaction:** **carousel** with `activityIndex` and left/right arrows.
- **Practice sets are rendered via `practiceSets.map()` inside `ActivitySelectorScreen.tsx`. There is no separate Practice Set screen (C2).**
- **Hierarchy:** current activity card Primary; practice-set list Secondary as a set; carousel arrows Secondary; back control Supporting.
- **Components:** current activity card, previous/next arrows, embedded practice-set list, back control.
- **Proposed change (not current):** replacing the carousel with a list.
- **States:** default, loading, empty, error.

### 4.4 Practice set (embedded)

There is no standalone screen. The practice-set list is a section of Activity Selection (§4.3). Its specification is therefore inside §4.3.

- Selecting a practice set routes to `app/(app)/q-sets/[qSetId].tsx`, which renders `ChallengeScreen.tsx`.
- Practice-set items are Secondary; there is no Primary within this section ¿ the activity card remains the screen's Primary.
- **States:** same as §4.3.

### 4.5 Challenge ¿ corrected (C3)

v2 described a challenge with pause, exit, evaluation, retry, persistence, and recovery. **None of these L3 behaviours are implemented in the current `ChallengeScreen.tsx`.** v3 documents what exists, what does not, and what is planned.

#### 4.5.1 Implemented (L1)

- Picture-based question.
- Optional hints.
- Text-based answer.
- Microphone recording.
- Speech transcription (frontend API).
- Spoken prompt playback.
- Previous / next question navigation.

#### 4.5.2 Implemented but incomplete (L2 gaps)

| Behaviour | Current state | Corrective requirement |
|---|---|---|
| Answer submission | Not connected to backend evaluation | Wire to `/api/v1/speech/evaluate` (backend endpoint exists) ¿ **planned** |
| Assessment result feedback | Not connected | Show neutral, non-punitive feedback per DR-A11Y-06 ¿ **planned** |
| Pause / resume | Not implemented | Preserve question + answer + recording state ¿ **planned** |
| Explicit exit control | Not implemented as specified | Fixed position; must not move ¿ **planned** |
| Answer persistence across questions | **Reset on navigation** ¿ `changeQuestion()` calls `setAnswer("")` | Preserve per-question answer state ¿ **planned** |
| Finish Practice | Calls `router.back()` | Retain as minimal L1 finish until L3 summary exists |
| Session summary | Not implemented | Proposed (OD-3) |

#### 4.5.3 Design decision B applied ¿ voice playback

v2 permitted automatic prompt playback once. **v3 makes manual playback the default.** Automatic playback is available **only** as an explicit user preference (§6.2 voice output setting). Automatic speech must not interrupt or pressure the patient.

#### 4.5.4 Screen table

| Element | Type | Group | Priority | Treatment | Implementation |
|---|---|---|---|---|---|
| Picture clue | Visual | `stimulus` | **Primary** | Dominant area; high contrast; generous whitespace | L1 |
| Answer input (text) | Interaction | `answer` | **Primary** | Largest interactive, ¿ 56 px, clear boundary | L1 |
| Microphone recording control | Interaction | `answer` | **Primary** | Grouped with text input; ¿ 56 px; icon + label; explicit idle / recording / transcribing / result states | L1 (states partially) |
| Spoken prompt playback | Interaction | `stimulus-support` | Secondary | Manual by default; icon + label; visible playback state | L1 |
| Hint control + hint content | Interaction + content | `scaffold` | Secondary | Reveals progressively; never auto-reveals | L1 |
| Previous / next question | Interaction | `navigation` | Secondary | Consistent positions; disabled at bounds | L1 |
| Question position indicator | Content | `progress` | Supporting | Non-lexical preferred | L1 |
| **Pause** | Interaction | `session-control` | Supporting | Fixed position; ¿ 48 px | **Not implemented (planned)** |
| **Exit** | Interaction | `session-control` | Supporting | Fixed position; ¿ 48 px | **Not implemented as specified (planned)** |

- **Focal groups:** two Primary groups permitted ¿ `stimulus` and `answer`.
- **Response time:** no limit, no visible countdown (§7.4).
- **Input mode:** text and microphone both available unless disabled by preference. `alternativeInputOn` semantics specified in §6.2.
- **Microphone states:** idle ¿ recording ¿ transcribing ¿ result ¿ editable. Each state visible and non-colour-only.
- **Error tolerance:** retry always available; exit always available (when exit is implemented).
- **States:** loading question, default, hint revealed, recording, transcribing, empty, error (load, mic permission, transcription, network).

### 4.6 Profile ¿ L1/L2/L3 implemented

- **Primary objective:** View identity and account information.
- **Hierarchy:** identity summary Primary; account details Supporting.
- **States:** default, loading, error.

### 4.7 Settings ¿ L1/L2/L3 implemented

- **Purpose:** Adjust accessibility preferences (§6.2).
- **Primary objective:** Change a preference and confirm the effect.
- **Hierarchy:** preference controls Primary as a set; headings Secondary; explanatory text Supporting and minimal.
- **Rule:** A changed preference must visibly take effect (or offer an immediate preview).
- **Persistence:** confirmed stored. **Application throughout the app is not yet confirmed ¿ see §6.2 gap table.**
- **States:** default, saving, saved, error with retry.

### 4.8 Progress ¿ Planned / placeholder

- Not to be specified as functioning. Reporting API not connected (L1-only placeholder).
- **When implemented:** visual and non-lexical progress representation as Primary; percentage and streak as Supporting; no punitive framing of regression.
- **Constraint:** must not depend on colour alone (§9.1, check 2).

### 4.9 Session summary ¿ Proposed

- Existence unconfirmed (OD-3). If implemented: visual outcome summary Primary; continue and return actions Secondary; no score presented as failure.

### 4.10 Help / support ¿ Proposed

- No dedicated help route exists (OD-3). If implemented, in-screen support (hints, playback) takes precedence over a separate help destination.

### 4.11 Therapist portal ¿ Out of scope

Route group exists with an empty entry screen (A2).

---

## 5. Design System and Tokens

### 5.1 Colour ¿ OPEN DECISION (OD-1)

Unresolved: v1 proposed warm off-white + green accent; current implementation uses cool white + blue accent. **Product decision, not engineering.**

Until resolved, whichever palette is chosen must satisfy:

- One accent hue only, reserved for Primary.
- Contrast ¿ 4.5:1 normal text, ¿ 3:1 large text and UI components (WCAG 2.2 AA).
- Hierarchy legible in grayscale; colour never the sole carrier (§9.1, check 2).
- High-contrast preference exists (§6.2) and raises contrast above default ¿ inversion alone is insufficient.

Provisional tokens (values pending OD-1):

| Token | Role |
|---|---|
| `color.bg` | App background |
| `color.surface` | Cards, inputs, panels |
| `color.surface-muted` | Supporting regions |
| `color.text-primary` | Primary text |
| `color.text-secondary` | Secondary text |
| `color.text-tertiary` | Supporting text ¿ still ¿ 4.5:1 |
| `color.accent` | Primary emphasis only |
| `color.accent-text` | Text on accent fill |
| `color.border` | Dividers |
| `color.focus` | Keyboard focus ring ¿ ¿ 3:1 against bg and surface |

### 5.2 Typography ¿ Poppins

**Typeface:** Poppins (A4). User text-size preference overrides the fixed scale (§6.2).

**Implementation requirement:** registering Poppins font faces at the Expo root layout does **not** apply them to every `Text`. Inspected screens import React Native `Text` directly while a separate shared component provides Poppins styling. The specification therefore requires:

- All patient-facing text renders through **one shared text primitive** (component or theme-level style) applying Poppins and the type tokens below.
- Direct unstyled RN `Text` on patient-facing content is a defect, verified by V-07 (§9.2).
- If Poppins fails to load, layout must remain usable at the same sizes and line heights with a neutral sans-serif fallback (V-08).

**Type scale (v3 corrects the v1/v2 15 / 16 / 17 px contradiction ¿ one rule, no exceptions):**

| Token | Size | Weight | Line height | Usage |
|---|---|---|---|---|
| `type.lg` | 28¿32 px | 600 | 1.25¿1.3 | Primary emphasis, Primary actions |
| `type.md` | 22¿24 px | 500 | 1.4¿1.5 | Secondary headings, answer labels |
| `type.sm` | 18¿20 px | 400¿500 | 1.5 | Supporting text, secondary labels |
| `type.xs` | 16 px | 400 | 1.5 | Metadata only ¿ never instructions |

**Rules:**

- **16 px / 16 sp is the absolute minimum** for patient-facing text.
- **17 px is not a separate minimum.** The v1/v2 caption role at 15 px is **removed**. `type.xs` (16 px) is metadata only.
- Line height ¿ 1.5× for anything at `type.sm` and below.
- No negative letter spacing. No all-caps or italics for extended passages.

### 5.3 Priority ¿ treatment tokens

| Token | Primary | Secondary | Supporting |
|---|---|---|---|
| Type step | `type.lg` | `type.md` | `type.sm` / `type.xs` |
| Weight | 600 | 500 | 400¿500 |
| Contrast | accent or strongest neutral | strong neutral | muted neutral (¿ 4.5:1) |
| Whitespace | ¿ 32 px | ¿ 24 px | ¿ 16 px |
| Corner radius | 20¿24 px | 16¿20 px | 12¿16 px |
| Min interactive height | 56 px | 56 px | 48 px |
| Icon size | 28¿32 px | 24¿28 px | 20¿24 px |

### 5.4 Spacing and geometry

| Token | Value |
|---|---|
| `space.xs` | 8 px |
| `space.sm` | 16 px |
| `space.md` | 24 px |
| `space.lg` | 32 px |
| `space.xl` | 48 px |
| `radius.button` | 20 px |
| `radius.card` | 24 px |
| `touch.min` | 48 px |
| `touch.primary` | 56 px |

### 5.5 Iconography

- Primary and Secondary interactions carry icon + label; icons leading in LTR.
- Icons must not be the sole label for destructive or irreversible actions.
- Single icon family; consistent stroke weight; must pass the grayscale check (§9.1).
- Icons audited for cultural appropriateness before release.

### 5.6 Motion

- Motion limited to meaningful transitions (progress fill, state change).
- No flashing, no background motion, no decorative looping.
- `prefers-reduced-motion` (web) and `AccessibilityInfo.isReduceMotionEnabled()` (native) respected.
- Motion never the sole indicator of a state change.

---

## 6. Accessibility and Communication Requirements

### 6.1 Touch-target standards ¿ corrected (C5)

v2 mixed units ¿ 48 "CSS px on web, dp on native" then referred to iOS in points. Corrected:

| Reference | Requirement | Unit |
|---|---|---|
| WCAG 2.2 AA ¿ Target Size (Minimum), 2.5.8 | 24 × 24 | CSS px, with exceptions |
| WCAG 2.2 AAA ¿ Target Size (Enhanced), 2.5.5 | 44 × 44 | CSS px |
| Apple Human Interface Guidelines | 44 × 44 | **pt** (iOS / iPadOS default controls) |
| Google ¿ Android guidance | 48 × 48 | **dp** |
| **MDATE requirement (DR-A11Y-01)** | **48 × 48** | **CSS px (web) / dp (Android) / pt (iOS)** |

**DR-A11Y-01** is a stricter MDATE design requirement. Verified separately:

- **Web:** measured in CSS px including padding, at 100% zoom.
- **Android:** measured in dp.
- **iOS:** measured in pt, and additionally checked against Apple's 44 pt baseline to confirm the stricter target is met.

### 6.2 Accessibility preferences ¿ first-class requirements and integration gaps (C4)

v2 correctly treated preferences as product requirements. v3 corrects v2's implicit assumption that storing = applying. Account setup persists the following; **application throughout the app is a separate requirement.**

**Preference table (storage vs application):**

| Preference | Values | Storage / UI | Applied in Challenge | Application requirement |
|---|---|---|---|---|
| Text size | small / medium / large | Yes | **Missing** | Scale the type scale, not just root font size. Never below 16 px equivalent at any setting. No clipping or overlap at largest. |
| Contrast | normal / high | Yes | **Missing** | High contrast raises contrast above default (not inversion only). Must still pass grayscale check. |
| Alternative input | enabled / configured | Yes | **Missing** | See semantics below. Must be reachable from the challenge answer area without navigating away. |
| Preferred voice | voice selection | Yes | **Missing** ¿ challenge uses hardcoded speech rate 0.82; does not use saved voice or volume; does not check `voiceDisabled` when playing the prompt | Playback must use the saved voice, speech rate, and volume. |
| Speech rate | adjustable | Yes | **Missing** (hardcoded 0.82) | Playback must honour the stored rate. |
| Volume | adjustable | Yes | **Missing** | Playback must honour stored volume and must not silently override system mute. |
| Voice output | enabled / disabled | Yes | **Missing** (`voiceDisabled` not consulted) | When disabled, no automatic speech. Manual playback follows the same preference or is hidden consistently. |
| Manual vs automatic playback (design decision B) | per §4.5.3 | ¿ | ¿ | **Manual by default.** Automatic only when explicitly enabled. |

**`alternativeInputOn` semantics (C4 sub-issue ¿ previously ambiguous):**

`alternativeInputOn` is a feature flag whose exact scope was not defined in v2. v3 defines it as follows. This definition must be confirmed by the product owner (OD-8) before implementation.

- When `alternativeInputOn` is **true**, the Challenge must present:
  - the text input, **and**
  - the microphone control, **and**
  - any configured alternative input surfaces registered by the app.
- When `alternativeInputOn` is **false**, the Challenge must present **at least one** answer channel that is functional for the current user (text or microphone). It must not present zero answer channels.
- `alternativeInputOn` **must not** disable text input. Text input remains available at all times unless a specific activity explicitly declares text as not applicable (which must be flagged as a therapy design decision, not an accessibility toggle).

**Preference application rules:**

- Preferences take effect immediately or offer an immediate preview.
- Preferences persist across sessions (already confirmed for storage).
- Every screen specification in §4 must state how it behaves at the largest text setting and at high contrast. Default rule: layout reflows, does not clip, does not drop below the 16 px floor.
- No screen may depend on colour alone at either contrast setting.

### 6.3 Communication support

**DR-A11Y-02 (multimodal redundancy ¿ narrowed per design decision C):** *Important* instructions, *important* actions, and *important* feedback are conveyed in at least two modalities ¿ visual (icon or picture) and textual (short label), with audio where voice output is enabled. **Not every UI element requires two modalities.** The rule exists to serve the Supported Conversation principle of adapted, individual support ¿ not mechanical duplication of icons across every element.

**DR-A11Y-03 ¿ Response time.** No arbitrary response deadline (§7.4).

**DR-A11Y-04 ¿ Plain language.** Labels are single words or short phrases. Instructional text targets a readability grade of 5 or lower. No boilerplate, no marketing copy, no explanatory paragraphs.

**DR-A11Y-05 ¿ Single-action interaction.** No double-tap, long-press, drag, or multi-finger gestures for any action.

**DR-A11Y-06 ¿ Error tolerance.** Incorrect answers produce neutral, non-punitive feedback. Retry and exit are always available.

### 6.4 Keyboard and screen reader

- All interactive elements reachable and operable by keyboard on web, in an order matching visual order.
- Focus always visible (`color.focus` ¿ 3:1 against adjacent colours).
- Semantic headings on web reflect priority (`h1` for the Primary message, `h2` for Secondary groups). Not styled-only.
- Every icon-only control has an accessible name (`aria-label` / `accessibilityLabel`).
- Live state changes (recording started, transcription complete, error) announced via live region or native announcement.
- Screen reader order matches §4 priority order.

### 6.5 Edge-placement ¿ accessibility consideration, not a universal rule

v2 correctly demoted the earlier "never within 16 px of right edge" rule. v3 retains and clarifies DR-A11Y-07:

- **DR-A11Y-07.** Critical controls (exit, pause, back) must have **at least one instance** reachable without requiring reach to the far right edge.
- The chosen placement must be validated in usability testing (§9.3). Until validation, exit and pause default to the leading side of their region, with mirrored placement available if OD-5 introduces a left-handed preference.
- **Not universal.** The rule accommodates a common co-occurring impairment (right-sided weakness) without asserting that every patient has it. This aligns with §2.1's separation of target population from possible impairments.

---

## 7. Interaction and System States

### 7.1 State inventory

| State | Requirement |
|---|---|
| Loading | Visible, non-flashing. No layout shift on arrival. |
| Empty | Explains in plain language; offers the available next action. |
| Error | States what happened; offers retry; never discards recoverable input. |
| Permission required | Explains why; explains denial consequence. Never a silent failure. |
| Offline / network interruption | Preserves recoverable work; clear recovery path (§7.5). |
| Session expiry | Explained, recoverable (§7.4). |
| Reduced motion | Honoured everywhere. |

### 7.2 Loading

No skeleton shimmer reading as motion. No content shift on load. Spinners permitted but never the only signal.

### 7.3 Permissions

Microphone permission required for audio answer path in §4.5.

- **Contextual request** ¿ prompt on first microphone use, not at launch.
- **On denial** ¿ answer area remains usable via text; denial stated in plain language; route to change the setting.
- **On permanent denial** ¿ microphone control present but clearly inactive, with accessible explanation.

### 7.4 Timing ¿ separating UX from system behaviour

| Concern | Requirement |
|---|---|
| Visible exercise countdown | **Not mandatory.** Countdown pressure only if a specific therapy module legitimately requires timing as a therapeutic parameter; in that case identified per module and flagged under OD-6. |
| Patient response time | **No arbitrary time limit.** No interface-driven timeout. |
| Pause and resume | **Clear and predictable.** *(Currently not implemented ¿ §4.5.2.)* Must preserve question + answer + recording state on implementation. |
| Session expiry | **Supported and explained.** Backend expiry explained in plain language; recoverable input preserved where possible; single-action recovery. Never silently discards an answer mid-recording or mid-transcription. |
| Network interruption | **Recoverable where supported.** In-progress text preserved; in-progress recording outcome explicit. |
| Reduced motion | **Respected.** |

Therapy modules that legitimately require timing must **declare it explicitly**. Until such a declaration exists, no module is timed.

### 7.5 Recovery paths

- Session expiry during a challenge: preserve the current answer, present a single recovery action, return to same question on success.
- Network failure during transcription: present recorded audio state; allow retry or fall back to text without losing entered text.
- Broken parent chain: render nearest valid parent; never a blank screen or unhandled error.

---

## 8. Platform Implementation Rules

### 8.1 Web viewport ¿ corrected

**Current implementation:** `AppViewport` defaults to 412 × 892.  
**v3 target:** 430 CSS px maximum width with **fluid height** ¿ no fixed aspect ratio.

**DR-WEB-01 ¿ Width containment.** Shell centred on desktop, max 430 CSS px. Fills width below 430 px.

**DR-WEB-02 ¿ Fluid height, safe areas.** Shell fills visual viewport using `100dvh` (or JS-measured equivalent). Fixed pixel height not permitted.

```
html, body { margin: 0; height: 100%; background: #E8E5E0; display: flex; justify-content: center; }

#app-shell {
  width: 100%;
  max-width: 430px;
  height: 100dvh;
  overflow: hidden;
  position: relative;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

**DR-WEB-03 ¿ Meta viewport.** `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.

**DR-WEB-04 ¿ Reconciliation.** The 412 × 892 default is retained until OD-4 resolves the difference. The difference must not be left inconsistent between shell and document.

**DR-WEB-05 ¿ Native parity.** iOS and Android use full-screen `View` + `SafeAreaView`, no hard-coded pixel dimensions.

### 8.2 Expo web, Android, iOS

- Same component tree across platforms; differences confined to safe areas, permission flows, and speech APIs.
- No platform-specific navigation model. Hierarchy in §3.3 identical across platforms.
- Web keyboard access and focus visibility required (§6.4); must not be broken on web.

### 8.3 Responsive behaviour

Hierarchy must not invert between 320 px and 430 px. Text must never fall below the floor at any width or text-size preference. Touch targets never below DR-A11Y-01 at any width.

---

## 9. Verification and Acceptance Criteria

### 9.1 Composition checks

| ID | Check | Method | Pass condition |
|---|---|---|---|
| V-01 | Squint test | Blur / reduce detail per screen | Primary group identifiable first; no Secondary draws the eye first |
| V-02 | Grayscale test | Grayscale render | Primary / Secondary / Supporting distinguishable without colour |
| V-03 | Reading sequence | Observe natural scan order | Matches §4 priority order |
| V-04 | Gestalt grouping | Proximity, similarity, shared regions | Same-group elements read as related; unrelated groups ¿ 24 px apart |
| V-05 | Responsive | 320 / 375 / 412 / 430 px; largest text; high contrast | No clipping, no overlap, no below-floor text, no below-target target |
| V-06 | Accessibility | Contrast audit; keyboard-only pass; screen reader pass | All §6.4 requirements met |

### 9.2 Implementation conformance

| ID | Requirement | Verification |
|---|---|---|
| V-07 | Poppins applied to all patient-facing text | Code inspection: no unstyled RN `Text` on patient-facing screens |
| V-08 | Font fallback usable | Block Poppins network request; confirm layout holds |
| V-09 | No patient-facing text below 16 px at any preference | Computed style audit at small / medium / large |
| V-10 | Touch targets meet DR-A11Y-01 per platform | Automated audit + manual device measurement (CSS px / dp / pt) |
| V-11 | Preferences persist and take effect | Change each §6.2 preference, restart, confirm persisted **and applied** (see gap table) |
| V-12 | No visible countdown on any untimed module | Screen inspection |
| V-13 | Session expiry produces explained, recoverable state | Simulate expiry during challenge; confirm preservation and single-action recovery |
| V-14 | Microphone denial leaves text path intact | Deny permission; confirm text remains usable and explanation shown |
| V-15 | Reduced motion honoured | Enable platform setting; confirm no non-essential motion |
| V-16 | Planned features labelled | Inspect Progress, Session summary, Help; confirm status matches §3.5 |
| **V-17** | **No corrupted characters in this document** | **Automated scan for `¿` and other substitutions ¿ must return zero. Blocks approval.** |
| **V-18** | **Preference integration verified (new in v3)** | **Each row of §6.2 gap table verified as applied in the Challenge, not merely stored** |
| **V-19** | **Answer state preserved across questions (new in v3)** | **Navigate previous/next in Challenge; entered answer restored** |

### 9.3 Validation prerequisite

Contrast, layout, and preference behaviour can be verified by a developer. **Aphasia-friendliness cannot.** Validation with people with aphasia and an appropriate clinician is a required prerequisite before any claim of aphasia-friendliness, and its results must be recorded against DR-A11Y-07 and §6.2 before those requirements are considered confirmed. Until then, this document's accessibility requirements are design intent, not validated outcome.

---

## 10. Open Decisions, Assumptions and References

### 10.1 Open decisions

| ID | Decision | Owner | Priority | Blocks |
|---|---|---|---|---|
| OD-1 | Green accent / warm background vs blue accent / cool background | Product | High | §5.1, all screens |
| OD-2 | Confirm Start Training as dashboard primary (design decision A) | Product | High | §4.1 |
| OD-3 | Whether Help and Session summary are in scope | Product | Medium | §4.9, §4.10, §3.5 |
| OD-4 | Reconcile 412 × 892 shell default with 430 px target | Engineering + Product | Medium | §8.1 |
| OD-5 | Whether a left-handed / mirrored layout preference is introduced | Product | Low | DR-A11Y-07 |
| OD-6 | Whether any therapy module legitimately requires timing | Clinical + Product | Medium | §7.4 |
| OD-7 | Whether the original visual hierarchy algorithm is a project deliverable | Product | Medium | §4.0 |
| **OD-8** | **Confirm `alternativeInputOn` semantics (§6.2)** | **Product** | **High** | **§4.5, §6.2** |
| **OD-9** | **Confirm manual-by-default vs automatic prompt playback (§4.5.3)** | **Product + Clinical** | **Medium** | **§4.5, §6.2** |

### 10.2 Prerequisites and blockers

| Item | Type | Priority |
|---|---|---|
| Resolve OD-1 colour palette | Product decision | High |
| Confirm OD-2 dashboard primary | Product decision | High |
| Confirm OD-8 alternative-input semantics | Product decision | High |
| Establish authoritative research references in-repo | Evidence prerequisite | High |
| Validate accessibility with people with aphasia and a clinician | Validation prerequisite | High |
| Resolve OD-3 Help / Session summary scope | Product decision | Medium |
| Confirm OD-9 playback default | Product + Clinical | Medium |
| Obtain original visual hierarchy algorithm, or approve §4.0 | Documentation dependency | Medium |
| Include HLD/SRS in version control or provide traceable references | Documentation prerequisite | Medium |
| Resolve OD-4 shell dimensions | Engineering + Product | Medium |

**Repository documentation inventory (corrected):** `docs/` contains `design-spec.md` (v1) and `design-spec-v2.md`. This file (`design-spec-v3.md`) will replace `design-spec.md` only after review. The HLD and SRS referenced in prior project decisions are **not version-controlled here**.

### 10.3 Assumptions

| ID | Assumption |
|---|---|
| A1 | Patient-facing MDATE is the primary scope of this document. |
| A2 | The therapist portal receives a separate specification when its interface is implemented. |
| A3 | The existing Expo route structure is the baseline for implemented user journeys. |
| A4 | Poppins remains the primary typeface; user accessibility preferences take priority over fixed typography. |
| A5 | English and Bahasa Melayu are the initial supported languages. |
| A6 | The module ¿ activity ¿ embedded practice sets ¿ challenge journey is the therapy navigation model (carousel-based, per §3.3). |
| A7 | Visual design avoids unnecessary time pressure; backend session expiry is supported. |
| A8 | Web app retains a centred mobile canvas on desktop with fluid viewport height and safe-area handling. |
| A9 | Unimplemented features are labelled L1 / L2 / L3 (§3.2) or Planned / Proposed ¿ never presented as functioning. |
| A10 | Accessibility is designed around individual needs, not assumed disabilities or a single universal aphasia profile. |

### 10.4 References

- Aphasia Institute ¿ Supported Conversation for Adults with Aphasia (SCA). Keywords, gestures, drawings, and pictographs combined and adapted to the individual, not applied mechanically.
- American Speech-Language-Hearing Association (ASHA) ¿ individual communication preferences, sufficient response time, multi-modality support.
- W3C ¿ WCAG 2.2, SC 2.5.8 Target Size (Minimum), SC 2.5.5 Target Size (Enhanced).
- Apple ¿ Human Interface Guidelines, layout and controls (44 × 44 pt baseline).
- Google ¿ Material accessibility guidance (48 × 48 dp).

References must be mirrored into version control (§10.2) for traceability. External citations are directional guidance, not substitute clinical validation.

---

## 11. Execution Plan ¿ statuses corrected (C6)

v2 marked stages complete despite unresolved discrepancies. v3 uses honest statuses.

| Stage | Description | Status |
|---|---|---|
| 1 | Document audit: specification, Expo routes, components, platform constraints, accessibility preferences | **Complete** (v2 review) |
| 2 | Correct information architecture: actual carousels and embedded practice sets; implemented / L1 / L2 / L3 separated; patient-facing scope confirmed | **Complete in v3** (§3) |
| 3 | Rebuild design requirements: typography, colour, layout, touch targets, accessibility preferences, audio, motion, acceptance criteria | **Complete in v3** (§5, §6, §9) ¿ **colour pending OD-1**; `alternativeInputOn` pending OD-8 |
| 4 | Specify individual screens including loading, empty, error, recovery | **Complete in v3** (§4, §7) ¿ **Challenge L3 behaviours documented as planned, not implemented** |
| 5 | Verification and documentation review: traceability, references, platform verification, consistency review, encoding correction | **Partial** ¿ V-17 encoding check is the gate for approval; V-18 and V-19 newly added; user validation outstanding |

**Next step:** resolve High-priority blockers in §10.2 (OD-1, OD-2, OD-8, references, user validation), then close Stage 5. Until then, this document remains **Draft ¿ Pending design decisions and validation**. On approval, `design-spec-v3.md` replaces `design-spec.md` as the canonical specification; v1 and v2 move to `docs/archive/`.
