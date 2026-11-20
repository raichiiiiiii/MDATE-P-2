# Design Specification (Revised): MDATE-P-2 ¿ Patient-Facing Experience

**Document path:** `docs/design-spec.md`  
**Target branch:** `main` (proposed revision on a dedicated branch, diff reviewed before merge)  
**Change boundary:** Documentation only. No Expo code changes. No backend changes. No changes to locked HLD architecture.

---

## 1. Document Control and Scope

### 1.1 Status

**Draft ¿ Pending design decisions and validation.**

This document is not implementation-ready. It is a **patient-facing product design contract**, not a styling document and not a clinical validation claim. It must not be described as clinically validated or universally aphasia-friendly until user testing has been performed (see §9.3 and §10.4).

### 1.2 Audience

- Frontend engineer implementing the patient-facing Expo application (web, iOS, Android).
- Designer and product owner resolving the open decisions in §10.1.
- Reviewer verifying that implemented screens satisfy the acceptance criteria in §9.

### 1.3 In scope

- Patient-facing screens that exist in the current Expo route structure.
- Accessibility preferences already exposed in account setup.
- Design tokens, interaction behaviour, system states, and verification criteria for those screens.

### 1.4 Out of scope

- Therapist portal interface (route group exists; entry screen is empty). Covered by a separate specification when implemented. See assumption A2.
- Backend session lifecycle implementation.
- Clinical efficacy claims and outcome measures.

### 1.5 Correction note

The previous version of this document contained widespread character corruption: `¿` was substituted for punctuation, arrows (`¿`), comparison symbols, and diagram characters throughout. This revision restores those characters. The defect was a document-quality issue, not a design issue.

### 1.6 Relationship to other documents

`docs/` currently contains only this file. The HLD and SRS referenced in prior project decisions are **not version-controlled** in this repository. That limits document-to-document traceability. Where this specification depends on HLD decisions, that dependency is flagged in §10.2.

---

## 2. Product Context and Design Principles

### 2.1 Patient characteristics

The primary user is a person living with aphasia, typically following stroke. Aphasia affects language comprehension and production, not general cognition. The user can understand concepts but may struggle with written words, sentence complexity, and rapid language-based interaction.

Co-occurring conditions are common and must be assumed rather than excluded:

- Right-sided weakness or hemiparesis (reaching, tapping, hold duration).
- Visual field loss (elements at screen edges may be missed).
- Reduced fine motor control (no precision gestures).
- Fatigue and reduced sustained attention.

### 2.2 Design principles

**P1. Support communication rather than remove words.**  
Aphasia-friendly design is not simply "less text." Supported Conversation principles combine appropriate spoken and written keywords, gestures, drawings, and pictographs, adapted to the individual rather than applied indiscriminately (Aphasia Institute, SCA). ASHA guidance similarly emphasises asking about individual communication preferences, allowing sufficient response time, and supporting communication through multiple modalities.

**P2. Icons support understanding; they do not replace it.**  
An icon is an aid to comprehension, not a guarantee of it. Icons must not be assumed to communicate an instruction independently. Critical instructions require at least two modalities.

**P3. Individual difference over assumed profile.**  
Accessibility is designed around individual needs, not a single universal aphasia profile. Preferences set by the user (text size, contrast, input mode, voice, speech rate) take precedence over fixed design values. See §6.

**P4. Predictable over minimal.**  
Minimalism here means low visual noise, not shallow navigation. Navigation must be predictable, with consistent back controls and clear progress indicators. Arbitrary structural limits (e.g. "two taps maximum") are removed; see §3.3.

**P5. No unnecessary time pressure.**  
The interface must not impose visible countdown pressure or arbitrary response deadlines. Backend session expiry is a real system behaviour and must be accommodated, not contradicted. See §7.4.

**P6. Readability takes precedence over aesthetic restraint.**  
"Minimalist" does not mean small type or subtle contrast.

**P7. Honest status labelling.**  
Unimplemented features are labelled **Planned** or **Proposed**, never presented as functioning.

---

## 3. Information Architecture and User Journeys

### 3.1 Implementation baseline

The Expo route structure is the baseline for all implemented journeys (assumption A3). The actual flow is hierarchical, not linear.

### 3.2 Implemented vs planned

The following table is normative. Every screen in §4 is marked with the same status.

| Area | Status | Current implementation | Notes |
|---|---|---|---|
| Auth | Implemented | `(auth)` route group | ¿ |
| Account setup | Implemented | `(account-setup)` route group; exposes accessibility preferences | Preferences list in §6.2 |
| Dashboard | Implemented | Profile header, carousel placeholder, metrics, action grid | Carousel and metrics appear placeholder |
| Module selection | Implemented | Module list | ¿ |
| Activity selection | Implemented | Activity list within module | ¿ |
| Practice set | Implemented | Practice set screen | ¿ |
| Challenge | Implemented | `ChallengeScreen.tsx` multimodal interaction | Full model in §4.6 |
| Progress | **Planned / placeholder** | Placeholder; reporting API not connected | Do not spec as functioning |
| Session summary | **Proposed** | Not present | See §10.1 |
| Help / support screen | **Proposed** | No dedicated help route | See §10.1 |
| Profile | Implemented | ¿ | ¿ |
| Settings | Implemented | Mirrors account-setup preferences | ¿ |
| Therapist portal | **Out of scope** | Route group exists; entry screen empty | Assumption A2 |
| Web viewport shell | Implemented | `AppViewport` defaults to 412 × 892 | See §8.1; proposed target 430 px max |

### 3.3 Patient-facing journey (as implemented)

```
Auth (sign in)
  ¿
  ¿
Account setup  (first use; accessibility preferences captured here)
  ¿
  ¿
Dashboard
  ¿   primary entry into therapy, profile header, metrics area
  ¿
  ¿
Module selection
  ¿
  ¿
Activity selection
  ¿
  ¿
Practice set
  ¿
  ¿
Challenge  ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
  ¿   picture clue             ¿  previous / next question
  ¿   optional hints           ¿  within the same challenge
  ¿   text answer              ¿
  ¿   microphone answer        ¿
  ¿   spoken prompt playback   ¿
  ¿   [pause] [exit]           ¿
  ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
  ¿
  ¿
(return up the hierarchy)

Global access: Profile · Settings (from dashboard header)
Planned:      Progress view · Session summary · Help screen
```

### 3.4 Navigation rules

1. **Hierarchical navigation is preserved.** Module ¿ activity ¿ practice set ¿ challenge is the therapy model (assumption A6). It must not be flattened.
2. **Predictable back controls.** Every screen below the dashboard provides a visible, consistently positioned back control returning to the immediate parent. No screen requires more than one back action to reach its parent.
3. **Clear progress indicators.** Within a challenge, the user must be able to tell how many questions exist and where they are (e.g. position indicator such as "3 of 8"), using non-lexical support where possible.
4. **No hidden navigation.** No hamburger menus, no swipe-only gestures, no navigation requiring long-press. All navigation is visible and tappable.
5. **Persistent escape.** Pause and exit controls are available on the challenge screen and do not move between questions.
6. **Deep-link safety.** Any deep link into a child route must render a valid parent chain or a safe recovery screen, not a dead end.

---

## 4. Screen-Level Specifications

Each screen entry defines: purpose, primary objective, hierarchy order, required components, and states. Components reference tokens in §5 and requirements in §6.

Visual priority in this section is assigned using the conventional framework in §4.0, not the undocumented scoring algorithm from the previous draft (see §4.0.3).

### 4.0 Visual priority framework

#### 4.0.1 Method

The previous draft referenced a scoring algorithm (T, M, I, thresholds 4.20 / 2.50) without formally documenting its formula, definitions, or tie-breaking rules. Frontend developers should not be asked to infer mathematics from example values.

Unless the original algorithm is supplied as an explicit project deliverable (§10.2), this document uses the following conventional framework.

**Step 1 ¿ Objective.** State the screen's single primary objective and its supporting objectives.

**Step 2 ¿ Inventory.** List every element and classify it as Content, Interaction, or Visual.

**Step 3 ¿ Group.** Assign elements to visual groups by shared purpose, proximity, similarity, shared container, and alignment.

**Step 4 ¿ Prioritise.** Assign each element a priority: **Primary**, **Secondary**, or **Supporting**, based on task contribution.

**Step 5 ¿ Cap focal groups.** No more than **two** focal groups may hold Primary emphasis on one screen. All other elements are demoted to Secondary or Supporting regardless of task contribution.

**Step 6 ¿ Apply treatment.** Map priority to the treatment tokens in §5.3. Dominance is produced by the combination of scale, contrast, whitespace, and position ¿ not size alone.

**Step 7 ¿ Validate.** Run the six checks in §9.1.

#### 4.0.2 Priority-to-treatment mapping

| Priority | Treatment summary |
|---|---|
| Primary | Largest type step, strongest contrast, accent surface permitted, generous whitespace, focal position |
| Secondary | Mid type step, strong neutral contrast, contained region, no accent fill |
| Supporting | Smallest permitted type step, muted contrast (still ¿ 4.5:1), compact spacing |

#### 4.0.3 Traceability

Every screen table below records priority per element. Priority is justified by the screen objective stated in that screen's entry. This replaces the previous algorithm references; if the original algorithm is later approved, §4.0.1 is the section to replace, and the per-screen priority tables must be re-derived and re-checked against §9.1.

### 4.1 Dashboard ¿ **Implemented**

- **Purpose:** Orient the user and provide the entry point into therapy.
- **Primary objective:** Begin or resume therapy.
- **Secondary objectives:** Confirm identity; review metrics; reach profile and settings.

| Element | Type | Group | Priority | Treatment |
|---|---|---|---|---|
| Primary therapy entry (module browse / resume) | Interaction | `therapy-entry` | **Primary** | Accent fill, largest type step, ¿ 56 px, icon + label |
| Profile header | Content + visual | `identity` | Secondary | Header region, mid type step, no accent |
| Metrics area | Content | `metrics` | Supporting | Compact, muted, contained |
| Carousel | Visual | `discovery` | Supporting | **Currently placeholder** ¿ must not compete with therapy entry until real content exists |
| Action grid | Interaction | `shortcuts` | Secondary | Grid, consistent cell sizing, ¿ 48 px targets |

- **Focal groups:** one Primary (`therapy-entry`). If the carousel receives real content later, it may become the second Primary group; it may not become a third.
- **Open item:** the dashboard's primary action is unresolved (§10.1, OD-2). Until resolved, `therapy-entry` is the specified primary.
- **States:** default, loading (metrics), empty (no modules), error (metrics fetch failed).

### 4.2 Module selection ¿ **Implemented**

- **Primary objective:** Choose a therapy module.
- **Hierarchy:** module list is Primary as a set; page title is Secondary; back control is Supporting but ¿ 48 px.
- **Components:** list of module cards, each with icon, short label, and optional completion indicator. Cards are equal weight within the list.
- **Rules:** no more than one module is visually emphasised. A recommended module, if introduced, must be flagged as a planned change and validated against §9.1 so it does not obscure the rest of the list.
- **States:** default, loading, empty (no modules assigned), error with retry.

### 4.3 Activity selection ¿ **Implemented**

- **Primary objective:** Choose an activity within the current module.
- **Hierarchy:** activity list Primary as a set; module context label Secondary; back control Supporting.
- **Components:** activity cards, consistent sizing, icon + short label.
- **States:** default, loading, empty, error.

### 4.4 Practice set ¿ **Implemented**

- **Primary objective:** Begin the challenge for the current activity.
- **Hierarchy:** start action Primary; practice-set contents Secondary; back control Supporting.
- **Components:** practice set summary (minimal text, icon-supported), start action, back control.
- **States:** default, loading, empty, error.

### 4.5 Challenge ¿ **Implemented** ¿ replaces the previous two-button model

The previous draft described a two-response-button interaction. That model is **outdated**. The implemented `ChallengeScreen.tsx` uses a multimodal answer process, and this specification describes that process.

- **Purpose:** Present a question and allow the patient to answer using the input mode that suits them.
- **Primary objective:** Answer the current question.
- **Secondary objectives:** Use a hint; play the prompt; navigate between questions; pause; exit.

| Element | Type | Group | Priority | Treatment |
|---|---|---|---|---|
| Picture clue | Visual | `stimulus` | **Primary** | Dominant area; high contrast; generous internal whitespace |
| Answer input (text field) | Interaction | `answer` | **Primary** | Largest interactive element, ¿ 56 px, clear boundary, no accent fill required |
| Microphone recording control | Interaction | `answer` | **Primary** | Adjacent to and grouped with text input; ¿ 56 px; icon + label; explicit idle / recording / transcribing states |
| Spoken prompt playback | Interaction | `stimulus-support` | Secondary | Grouped with stimulus; icon + label; visible playback state |
| Hint control and hint content | Interaction + content | `scaffold` | Secondary | Reveals progressively; never auto-reveals; does not displace the stimulus |
| Previous / next question | Interaction | `navigation` | Secondary | Consistent positions; previous disabled at first, next disabled or guarded at last |
| Question position indicator | Content | `progress` | Supporting | Non-lexical form preferred; must not read as a countdown |
| Pause | Interaction | `session-control` | Supporting | Fixed position; icon + label; ¿ 48 px |
| Exit | Interaction | `session-control` | Supporting | Fixed position; icon + label; ¿ 48 px; not sole-labelled by icon |

- **Focal groups:** two Primary groups are permitted ¿ `stimulus` and `answer`. These are the two things the patient must attend to. All controls are Secondary or Supporting.
- **Response time:** no arbitrary limit, no visible countdown. See §7.4.
- **Input mode:** the user may answer by text or by microphone. Both must be available unless the user has disabled an input mode in settings. Alternative-input preference (§6.2) must be respected.
- **Microphone states:** idle ¿ recording ¿ transcribing ¿ result ¿ editable. Each state needs a visible and non-colour-only indicator. Permission denial is an error state (§7.3), not a silent failure.
- **Speech output:** if voice output is enabled by preference, the prompt may be played automatically once, without repeating automatically and without auto-advancing the question.
- **Error tolerance:** an incorrect answer produces neutral, non-punitive feedback; retry is always available; exit is always available.
- **States:** loading question, default, hint revealed, recording, transcribing, empty (no questions in practice set), error (load failure, microphone permission denied, transcription failure, network interruption).

### 4.6 Profile ¿ **Implemented**

- **Primary objective:** View identity and account information.
- **Hierarchy:** identity summary Primary; account details Supporting.
- **States:** default, loading, error.

### 4.7 Settings ¿ **Implemented**

- **Purpose:** Adjust accessibility preferences (§6.2).
- **Primary objective:** Change a preference and confirm the effect.
- **Hierarchy:** preference controls are Primary as a set; section headings Secondary; explanatory text Supporting and minimal.
- **Rule:** a changed preference must take effect visibly (or offer an immediate preview) so the user can confirm the result without needing to read a description.
- **States:** default, saving, saved, error with retry.

### 4.8 Progress ¿ **Planned / placeholder**

- **Do not specify as functioning.** Reporting API is not connected.
- **When implemented, required:** visual and non-lexical progress representation as the Primary element; percentage and streak as Supporting; no punitive framing of regression.
- **Constraint:** must not depend on colour alone (§9.1, check 2).

### 4.9 Session summary ¿ **Proposed**

- **Status:** proposed; existence unconfirmed (§10.1, OD-3).
- **If implemented:** visual outcome summary Primary; continue and return actions Secondary; no score presented as failure.

### 4.10 Help / support ¿ **Proposed**

- **Status:** proposed; no dedicated help route exists (§10.1, OD-3).
- **If implemented:** must not be the only route to understanding an instruction. In-screen support (hints, playback) takes precedence over a separate help destination.

### 4.11 Therapist portal ¿ **Out of scope**

Route group exists with an empty entry screen. Not specified here (assumption A2).

---

## 5. Design System and Tokens

### 5.1 Colour ¿ **OPEN DECISION (OD-1)**

The colour palette is unresolved: the previous draft proposed a warm off-white background with a green accent; the current implementation uses a cool white background with a blue accent. **This is a product decision, not an engineering one.** It is a high-priority blocker (§10.2).

Until resolved, the following constraints apply to whichever palette is chosen:

- One accent hue only, reserved for Primary emphasis.
- Foreground/background contrast ¿ 4.5:1 for normal text and ¿ 3:1 for large text and UI components (WCAG 2.2 AA).
- Hierarchy must remain legible in grayscale; colour must never be the sole carrier of meaning (§9.1, check 2).
- A high-contrast mode must exist as a user preference (§6.2) and must raise contrast above the default rather than merely inverting colours.

Provisional token names (values pending OD-1):

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
| `color.border` | Dividers, non-critical |
| `color.focus` | Keyboard focus ring ¿ must be ¿ 3:1 against both bg and surface |

### 5.2 Typography ¿ Poppins

**Typeface:** Poppins remains the primary typeface (assumption A4). User text-size preference overrides the fixed scale (§6.2).

**Implementation requirement (corrects a prior gap):** registering Poppins font faces at the Expo root layout does **not** apply them to every `Text` component. Inspected screens import React Native `Text` directly, while a separate shared component provides Poppins-specific styling. The specification therefore requires a single typographic primitive:

- All patient-facing text must render through one shared text component (or one theme-level style) that applies the Poppins family and the type tokens below.
- Direct use of unstyled React Native `Text` for patient-facing content is a defect and must be verified against in §9.2.
- If Poppins fails to load, the layout must remain usable at the same sizes and line heights with a neutral sans-serif fallback. Font load failure must not cause layout collapse.

**Type scale (resolves the prior 15 px / 16 px / 17 px contradiction):**

The previous draft contained a 15 px caption token while simultaneously requiring a 16 px minimum and a 17 px patient-facing minimum. There is now one rule.

| Token | Size | Weight | Line height | Usage |
|---|---|---|---|---|
| `type.lg` | 28¿32 px | 600 | 1.25¿1.3 | Primary emphasis, Primary action labels |
| `type.md` | 22¿24 px | 500 | 1.4¿1.5 | Secondary headings, answer labels |
| `type.sm` | 18¿20 px | 400¿500 | 1.5 | Supporting text, secondary labels |
| `type.xs` | 16 px | 400 | 1.5 | Metadata only |

**Rules:**

- **16 px / 16 sp is the absolute minimum** for any patient-facing text.
- **17 px** is not a separate minimum; the patient-facing body floor is `type.sm` at 18 px. `type.xs` is reserved for non-instructional metadata.
- The caption role at 15 px is **removed**.
- Line height ¿ 1.5× for anything at `type.sm` and below.
- No negative letter spacing. No all-caps or italics for extended passages.

### 5.3 Priority-to-treatment tokens

| Token | Primary | Secondary | Supporting |
|---|---|---|---|
| Type step | `type.lg` | `type.md` | `type.sm` / `type.xs` |
| Weight | 600 | 500 | 400¿500 |
| Contrast | accent or strongest neutral | strong neutral | muted neutral (¿ 4.5:1) |
| Whitespace around | ¿ 32 px | ¿ 24 px | ¿ 16 px |
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

- Every Primary and Secondary interaction carries an icon plus a label; icons are placed leading in LTR layouts.
- Icons must not be the sole label for destructive or irreversible actions.
- Icon set must be visually consistent (single family, consistent stroke weight) and must pass the grayscale check in §9.1.
- Icons must be audited for cultural appropriateness before release.

### 5.6 Motion

- Motion is limited to meaningful transitions (e.g. progress fill, state change).
- No flashing content, no background motion, no decorative looping animation.
- `prefers-reduced-motion` (web) and `AccessibilityInfo.isReduceMotionEnabled()` (native) must be respected.
- Motion must never be the sole indicator of a state change.

---

## 6. Accessibility and Communication Requirements

### 6.1 Standards reference ¿ corrected

The previous draft presented 48 × 48 px as an accessibility standard. It is not. These are different criteria in different units, and the document must not conflate them.

| Reference | Requirement | Unit |
|---|---|---|
| WCAG 2.2 AA ¿ Target Size (Minimum), 2.5.8 | 24 × 24 | CSS px, with exceptions |
| WCAG 2.2 AAA ¿ Target Size (Enhanced), 2.5.5 | 44 × 44 | CSS px |
| Apple Human Interface Guidelines | 44 × 44 | pt (iOS / iPadOS default controls) |
| **MDATE requirement (DR-A11Y-01)** | **48 × 48** | **CSS px on web, dp on native** |

**DR-A11Y-01** is a **stricter MDATE design requirement**, chosen for the patient population. It is verified separately per platform:

- Web: measured in CSS px, including padding, at 100% zoom.
- Android: measured in dp.
- iOS: measured in pt, and separately against the Apple 44 pt baseline to confirm no regression.

### 6.2 Accessibility preferences ¿ first-class requirements

A fixed type scale and a fixed palette are **insufficient** to describe this product. Account setup already exposes the following preferences, and they are normative design requirements, not settings-panel details.

| Preference | Values | Design requirement |
|---|---|---|
| Text size | small / medium / large | Scales the type scale, not just the root font size. Minimum rendered size must never fall below 16 px equivalent at any setting. Layout must not clip or overlap at the largest setting. |
| Contrast | normal / high | High contrast raises contrast above default; it does not merely invert. Must still pass the grayscale check. |
| Alternative input | enabled / configured | Alternative input modes must be reachable from the challenge answer area without navigating away from the question. |
| Preferred voice | voice selection | Applies to spoken prompt playback. Changing it must be previewable. |
| Speech rate | adjustable | Applies to spoken prompt playback. Must persist. |
| Volume | adjustable | Applies to spoken prompt playback and must not override system mute silently. |
| Voice output | enabled / disabled | When disabled, no automatic speech playback. Manual playback controls follow the same preference or are hidden consistently. |

**Rules:**

- Preferences must take effect immediately or offer an immediate preview.
- Preferences must persist across sessions.
- Every screen specification in §4 must state how it behaves at the largest text setting and at high contrast. Where §4 does not state this, the default rule applies: layout reflows, does not clip, does not reduce text below the floor.
- No screen may depend on colour alone at either contrast setting.

### 6.3 Communication support

- **DR-A11Y-02 ¿ Multimodal redundancy.** Every instruction is conveyed in at least two modalities: visual (icon or picture) and textual (short label), with audio where voice output is enabled.
- **DR-A11Y-03 ¿ Response time.** No arbitrary response deadline. See §7.4.
- **DR-A11Y-04 ¿ Plain language.** Labels are single words or short phrases. Instructional text targets a readability grade of 5 or lower. No boilerplate, no marketing copy, no explanatory paragraphs.
- **DR-A11Y-05 ¿ Single-action interaction.** No double-tap, long-press, drag, or multi-finger gestures required for any action.
- **DR-A11Y-06 ¿ Error tolerance.** Incorrect answers produce neutral, non-punitive feedback. Retry and exit are always available.

### 6.4 Keyboard and screen reader

- All interactive elements are reachable and operable by keyboard on web, in an order matching visual order.
- Focus is always visible (`color.focus` ¿ 3:1 against adjacent colours).
- Semantic heading structure on web reflects priority (`h1` for the screen's Primary message, `h2` for Secondary groups). Headings are not used for styling alone.
- Every icon-only control has an accessible name (`aria-label` on web, `accessibilityLabel` on native).
- Live state changes (recording started, transcription complete, error) are announced via an appropriate live region or native announcement.
- Screen reader order must match the priority order stated in §4.

### 6.5 Edge-placement as an accessibility consideration ¿ not a universal rule

The previous draft stated as a universal rule that critical controls must never be placed within 16 px of the right screen edge.

This is **an accessibility consideration to validate, not a guarantee**. Right-sided weakness is common after stroke but not universal, and enforcing the rule unconditionally produces inconsistent layouts and may conflict with platform conventions or left-handed use.

**Revised requirement (DR-A11Y-07):**

- Critical controls (exit, pause, back) must have at least one instance reachable without requiring reach to the far right edge.
- The chosen placement must be validated in usability testing, and the validation result recorded in §9.3.
- If validation is not yet available, the default is: exit and pause placed on the leading side of their region, with mirrored placement available through a left-handed preference if that preference is later introduced (see OD-5).

---

## 7. Interaction and System States

### 7.1 State inventory

Every screen in §4 must define and implement these states where applicable:

| State | Requirement |
|---|---|
| Loading | Visible, non-flashing indicator. Layout does not jump when content arrives. |
| Empty | Explains the situation without blame, and offers the available next action. |
| Error | States what happened in plain language, offers retry, and never discards recoverable input. |
| Permission required | Explains why the permission is needed and what happens if it is denied. Never a silent failure. |
| Offline / network interruption | Preserves recoverable work where supported; shows a clear recovery path (§7.5). |
| Session expiry | Explained and recoverable (§7.4). |
| Reduced motion | All screens honour the platform setting. |

### 7.2 Loading

No skeleton shimmer that reads as motion. No content shift on load. Spinners are permitted but must not be the only signal of a state change.

### 7.3 Permissions

Microphone permission is required for the audio answer path in §4.5.

- Request is contextual: the prompt appears when the microphone control is first used, not at app launch.
- On denial: the answer area remains usable via text input, and the denial is stated in plain language with a route to change the setting.
- On permanent denial: the microphone control is present but clearly inactive, with an accessible explanation.

### 7.4 Timing ¿ separating UX from system behaviour

The previous draft stated "no timeouts," which conflicts with the application's session lifecycle and with any therapeutic timing that a module may specify. The requirement is split:

| Concern | Requirement |
|---|---|
| Visible exercise countdown | **Not mandatory.** No countdown pressure unless a specific therapy module requires timing as a therapeutic parameter, and in that case it is identified per module and flagged in §10.1. |
| Patient response time | **No arbitrary time limit.** The patient is never timed out of a question by the interface. |
| Pause and resume | **Clear and predictable.** Pause preserves the current question and any entered answer. Resume returns to the same state. |
| Session expiry | **Supported and explained.** If the backend expires the session, the interface explains in plain language what happened, preserves recoverable input where possible, and offers a safe, single-action recovery. It never silently discards an answer mid-recording or mid-transcription. |
| Network interruption | **Recoverable where supported.** In-progress text is preserved; in-progress recording states its outcome explicitly. |
| Reduced motion | **Respected.** |

Therapy modules that legitimately require timing must declare it explicitly. Until such a declaration exists, no module is timed.

### 7.5 Recovery paths

- Session expiry during a challenge: preserve the current answer, present a single recovery action, and return to the same question on success.
- Network failure during transcription: present the recorded audio state and allow retry or fall back to text, without losing entered text.
- Navigation into a child route with a broken parent chain: render the nearest valid parent, never a blank screen or an unhandled error.

---

## 8. Platform Implementation Rules

### 8.1 Web viewport ¿ revised

**Current implementation:** `AppViewport` defaults to 412 px width and 892 px height.  
**Previous draft:** fixed maximum 430 px with an implied fixed aspect ratio.

A fixed height/aspect ratio unnecessarily constrains shorter devices. The revised requirement separates width containment from height behaviour.

**DR-WEB-01 ¿ Width containment.**
The application shell is centred on desktop with a maximum content width of **430 CSS px**. On viewports narrower than 430 px, the shell fills the viewport width.

**DR-WEB-02 ¿ Fluid height, safe areas.**
The shell fills the visual viewport height using `100dvh` (or a JS-measured equivalent where `dvh` support is insufficient). A fixed pixel height is not permitted. Safe-area insets are respected:

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

**DR-WEB-03 ¿ Meta viewport.**
`<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.

**DR-WEB-04 ¿ Reconciliation note.**
The existing 412 × 892 default is retained until OD-4 is resolved. The specification target is 430 px maximum width with fluid height. The difference must be resolved deliberately in code, not left inconsistent between the shell and this document.

**DR-WEB-05 ¿ Native parity.**
On iOS and Android, the same shell behaviour is achieved with a full-screen `View` and `SafeAreaView`, not hard-coded pixel dimensions.

### 8.2 Expo web, Android, iOS

- Same component tree across platforms; platform differences confined to safe-area handling, permission flows, and speech APIs.
- No platform-specific navigation model. The hierarchy in §3.3 is identical across all three.
- Web keyboard access and focus visibility are required (§6.4) and have no native equivalent requirement, but must not be broken on web.

### 8.3 Responsive behaviour

Hierarchy must not invert between 320 px and 430 px. Text must not fall below the floor at any width or at any text-size preference setting. Touch targets must not fall below DR-A11Y-01 at any width.

---

## 9. Verification and Acceptance Criteria

Each criterion is testable by a developer who did not write the implementation.

### 9.1 Composition checks

| ID | Check | Method | Pass condition |
|---|---|---|---|
| V-01 | Squint test | Blur/reduce detail on each screen | The Primary group is identifiable first; no Secondary element draws the eye first |
| V-02 | Grayscale test | Render each screen in grayscale | Primary / Secondary / Supporting remain distinguishable without colour |
| V-03 | Reading sequence | Observe natural scan order | Matches the priority order in the §4 table for that screen |
| V-04 | Gestalt grouping | Inspect proximity, similarity, shared regions | Elements in the same group read as related; unrelated groups are separated by ¿ 24 px |
| V-05 | Responsive | 320, 375, 412, 430 px widths; largest text preference; high contrast | No clipping, no overlap, no text below floor, no target below DR-A11Y-01 |
| V-06 | Accessibility | Contrast audit; keyboard-only pass; screen reader pass | All §6.4 requirements met |

### 9.2 Implementation conformance

| ID | Requirement | Verification |
|---|---|---|
| V-07 | Poppins applied to all patient-facing text | Code inspection: no unstyled RN `Text` in patient-facing screens; spot-check rendered font on web |
| V-08 | Font fallback usable | Block Poppins network request; confirm layout and readability hold |
| V-09 | No patient-facing text below 16 px at any preference setting | Computed style audit at small / medium / large |
| V-10 | Touch targets meet DR-A11Y-01 per platform | Automated audit plus manual measurement on device |
| V-11 | Preferences persist and take effect | Change each preference in §6.2, restart app, confirm persisted and applied |
| V-12 | No visible countdown on any untimed module | Screen inspection |
| V-13 | Session expiry produces explained, recoverable state | Simulate expiry during a challenge; confirm answer preservation and single-action recovery |
| V-14 | Microphone denial leaves text path intact | Deny permission; confirm answer area remains usable and explanation is shown |
| V-15 | Reduced motion honoured | Enable platform setting; confirm no non-essential motion |
| V-16 | Planned features labelled | Inspect Progress, Session summary, Help; confirm status labelling matches §3.2 |
| V-17 | No corrupted characters in this document | Text scan for `¿` and other substitutions |

### 9.3 Validation prerequisite

Contrast, layout, and preference behaviour can be verified by a developer. **Aphasia-friendliness cannot.** Validation with people with aphasia and an appropriate clinician is a required prerequisite before any claim of aphasia-friendliness, and its results must be recorded against DR-A11Y-07 and §6.2 before those requirements are considered confirmed. Until then, this document's accessibility requirements are design intent, not validated outcome.

---

## 10. Open Decisions, Assumptions and References

### 10.1 Open decisions

| ID | Decision | Owner | Priority | Blocks |
|---|---|---|---|---|
| OD-1 | Green accent / warm background vs blue accent / cool background | Product | High | §5.1, all screens |
| OD-2 | Dashboard's true primary action | Product | High | §4.1 |
| OD-3 | Whether Help and Session summary are in scope | Product | Medium | §4.9, §4.10, §3.2 |
| OD-4 | Reconcile 412 × 892 shell default with 430 px target | Engineering + Product | Medium | §8.1 |
| OD-5 | Whether a left-handed / mirrored layout preference is introduced | Product | Low | DR-A11Y-07 |
| OD-6 | Whether any therapy module legitimately requires timing | Clinical + Product | Medium | §7.4 |
| OD-7 | Whether the original visual hierarchy algorithm is a project deliverable | Product | Medium | §4.0 |

### 10.2 Prerequisites and blockers

| Item | Type | Priority |
|---|---|---|
| Resolve OD-1 colour palette | Product decision | High |
| Confirm OD-2 dashboard primary action | Product decision | High |
| Confirm patient-only scope for this document | Scope decision | High |
| Establish authoritative research references in-repo | Evidence prerequisite | High |
| Validate accessibility with people with aphasia and a clinician | Validation prerequisite | High |
| Resolve OD-3 Help and Session summary scope | Product decision | Medium |
| Obtain the original visual hierarchy algorithm, or approve §4.0 | Documentation dependency | Medium |
| Include HLD/SRS in version control or provide traceable references | Documentation prerequisite | Medium |
| Resolve OD-4 shell dimensions | Engineering + Product | Medium |

**Repository limitation:** `docs/` currently contains only this file. The HLD and SRS referenced in prior project decisions are not version-controlled here, which limits document-to-document traceability. This does not block revision, but it blocks a claim of full traceability.

### 10.3 Assumptions

| ID | Assumption |
|---|---|
| A1 | Patient-facing MDATE is the primary scope of this document. |
| A2 | The therapist portal receives a separate specification when its interface is implemented. |
| A3 | The existing Expo route structure is the baseline for implemented user journeys. |
| A4 | Poppins remains the primary typeface; user accessibility preferences take priority over fixed typography. |
| A5 | English and Bahasa Melayu are the initial supported languages. |
| A6 | The module ¿ activity ¿ practice set ¿ challenge journey remains the therapy navigation model. |
| A7 | Visual design avoids unnecessary time pressure, while backend session expiry remains supported. |
| A8 | The web application retains a centred mobile canvas on desktop, with fluid viewport height and safe-area handling. |
| A9 | Unimplemented features are labelled Planned or Proposed, never presented as functioning. |
| A10 | Accessibility is designed around individual needs, not assumed disabilities or a single universal aphasia profile. |

### 10.4 References

- Aphasia Institute ¿ Supported Conversation for Adults with Aphasia (SCA). Keywords, gestures, drawings, and pictographs combined and adapted to the individual, not applied indiscriminately.
- American Speech-Language-Hearing Association (ASHA) ¿ guidance on individual communication preferences, sufficient response time, and multi-modality support.
- W3C ¿ WCAG 2.2, SC 2.5.8 Target Size (Minimum), SC 2.5.5 Target Size (Enhanced).
- Apple ¿ Human Interface Guidelines, layout and controls (44 × 44 pt baseline).
- Google ¿ Material accessibility guidance (48 dp touch target).

References must be mirrored into version control (§10.2) for traceability. External citations in this document are directional guidance, not substitute clinical validation.

---

## 11. Execution Plan for This Revision

| Stage | Description | Status |
|---|---|---|
| 1 | Document audit: specification, Expo routes, components, platform constraints, accessibility preferences | Complete (this review) |
| 2 | Correct information architecture: replace outdated flow, distinguish implemented from planned, confirm patient-facing scope | Complete in this revision (§3) |
| 3 | Rebuild design requirements: typography, colour, layout, touch targets, accessibility preferences, audio, motion, acceptance criteria | Complete in this revision (§5, §6, §9); colour pending OD-1 |
| 4 | Specify individual screens including loading, empty, error, recovery states | Complete in this revision (§4, §7) |
| 5 | Verification and documentation review: traceability, references, platform verification, consistency review, character correction | Pending ¿ requires OD resolution and user validation |

**Next step:** resolve the High-priority blockers in §10.2, then close Stage 5. Until then, this document remains **Draft ¿ Pending design decisions and validation**.
