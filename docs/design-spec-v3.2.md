# Design Specification v3.2: MDATE-P-2 — Patient-Facing Experience

**Document path:** `docs/design-spec-v3.2.md`  
**Canonical target:** replaces `docs/design-spec.md` only after this document is reviewed and passes acceptance checks  
**Target branch:** `main` (revision on a dedicated branch; diff reviewed before merge)  
**Change boundary:** Documentation only. No Expo code changes. No backend changes. No changes to the locked HLD architecture.

---

## 0. Revision Ledger

| Version | Status | Notes |
|---|---|---|
| v1 | Superseded | Undocumented scoring algorithm; outdated two-button activity model; corrupted characters |
| v2 | Superseded | Correct structure; 181 corrupted characters; navigation and Challenge overstated; metadata errors |
| v3 | Superseded | 189 corrupted characters; L1/L2/L3 over-applied; speech evaluation treated as completed assessment |
| v3.1 | Superseded | Improved structure; **197 corrupted characters present**; L1/L2/L3 still over-classified local interactions as L2; therapist portal incorrectly marked L1 Yes; Poppins and font-size gaps missing; answer-integrity risk unaddressed; alternative-input semantics still ambiguous |
| **v3.2** | **Draft — Pending design decisions and validation** | This document. Controlled correction of v3.1 review P0/P1 items. No restructuring. |

### 0.1 What changed in v3.2 (mapped to review)

| Review item | Corrective action | Where |
|---|---|---|
| **P0-C1** — 197 corrupted characters | Document authored with proper Unicode arrows, mathematical symbols, punctuation, and box-drawing characters from the first character. V-17 remains the automated gate; approval requires zero occurrences. | Entire document |
| **P0-C2** — Filename and inventory inconsistent | Filename standardised to `docs/design-spec-v3.2.md`. §1.4 and §10.2 corrected to reflect the actual repository contents including v3.1. Canonical replacement instructions corrected. | §1.4, §10.2 |
| **P0-C3** — L1/L2/L3/N/A still over-classified | L2 redefined: **L2 = frontend calls a backend API successfully for that capability.** Local UI interactions that do not hit an API are L1 with **L2 = N/A**. Classification matrix in §3.5 fully reconciled with the review's proposal. | §3.2, §3.5 |
| **P0-C4** — Therapist portal classified as L1 Yes | Corrected to **L1: No, L2: N/A, L3: N/A.** An empty route stub is not an implemented interface. | §3.5, §4.11 |
| **P1-C5** — Server-side answer integrity | New §4.5.3 subsection: production assessment must resolve the expected answer server-side from a trusted question ID. Milestone 1 (prototype) must not trust a client-supplied `target`. | §4.5.3 |
| **P1-C6** — Poppins integration gaps | §9.4 extended: identified screens that still import `Text` directly from `react-native` instead of the shared `src/expo-test/src/shared/ui/native.tsx` wrapper. Required engineering remediation recorded. | §9.4 |
| **P1-C7** — Font-size violations | §9.4 extended with known violations: `DashboardActionGrid.tsx` 10 px, `TrainingHeader.tsx` 12 px, `ChallengeScreen.tsx` 12 px. V-09 remains the verification gate. | §9.4 |
| **P1-C8** — Alternative-input semantics ambiguous | §6.2 rewritten to state exactly what changes when `alternativeInputOn` is toggled, and that permission restrictions and voice output remain independent. OD-8 retained for product confirmation. | §6.2 |
| Review §5 — Product decisions | v3.2 does not close any OD; each remains open with the reviewer's recommendation recorded. | §10.1 |
| Review §7 — Canonical structure | On approval, `design-spec.md` is archived as `archive/design-spec-v1.md`; v2, v3, v3.1 move to `archive/`. v3.2 replaces the canonical file. | §10.2 |

### 0.2 Encoding integrity

This document is authored with Unicode throughout — arrows (`→`), comparison symbols (`≥`, `≤`, `×`), box-drawing characters, punctuation, and diacritics. **V-17 (§9.2) is the automated gate and must return zero `¿` occurrences before approval.** The v2 and v3 claims that encoding had been corrected were factually false; v3.1 repeated the claim while still containing 197 occurrences. v3.2 does not rely on a prose claim — the automated check is the sole acceptance criterion.

---

## 1. Document Control and Scope

### 1.1 Status

**Draft — Pending design decisions and validation.**

Not implementation-ready. Not a clinical validation claim. May not be described as clinically validated or universally aphasia-friendly until user testing is complete (§9.3).

### 1.2 Audience

- Frontend engineer implementing the patient-facing Expo application.
- Designer and product owner resolving §10.1 open decisions.
- Reviewer verifying acceptance criteria in §9.

### 1.3 In scope

Patient-facing screens existing in the Expo route structure; accessibility preferences exposed in account setup; design tokens, interaction behaviour, system states, and verification criteria for those screens.

### 1.4 Out of scope and repository documentation inventory — corrected (P0-C2)

**Out of scope:**

- Therapist portal interface. The route group exists but its entry screen is an **empty route stub**, not an implemented interface. Separate specification required. (A2)
- Backend session lifecycle implementation.
- Clinical efficacy claims.

**Repository documentation inventory (corrected to reflect actual contents):**

```
docs/
├── design-spec.md          (v1, superseded)
├── design-spec-v2.md       (superseded)
├── design-spec-v3.md       (superseded)
├── design-spec-v3.1.md     (superseded)
└── design-spec-v3.2.md     (this file, on review)
```

The HLD and SRS referenced in prior project decisions are **not version-controlled here**. This limits document-to-document traceability. Flagged in §10.2.

### 1.5 Relationship to other documents

No version-controlled HLD or SRS present in `docs/`. Dependencies on HLD decisions are flagged in §10.2. Where this document states a design intent the HLD has fixed differently, the HLD wins and this document must be corrected.

---

## 2. Product Context and Design Principles

### 2.1 Target population and co-occurring impairments

**Target population:** Adults with aphasia who are using MDATE as part of their therapy. Aphasia affects language comprehension and production; it does not reduce general cognition.

**Possible co-occurring impairments** — accommodated when present, not assumed:

- Motor impairment (hemiparesis) affecting reach, tap precision, or sustained hold.
- Visual field loss or reduced visual acuity.
- Fatigue and reduced sustained attention.
- Hearing loss.
- Cognitive-communication differences beyond aphasia.

**Design implication:** the interface accommodates individual needs, not an assumed universal profile (A10). Where a specific accommodation is stated (e.g. DR-A11Y-07 edge placement), it is a **candidate accommodation to be validated in usability testing**, not a permanent assumption that every patient has that impairment.

### 2.2 Design principles

**P1. Support communication rather than remove words.**  
Supported Conversation principles combine spoken and written keywords, gestures, drawings, and pictographs, adapted to the individual. ASHA guidance emphasises individual preferences, sufficient response time, and multi-modality support.

**P2. Icons support understanding; they do not replace it.**

**P3. Individual difference over assumed profile.**  
User preferences take precedence over fixed design values (§6.2).

**P4. Predictable over minimal.**  
Hierarchical, predictable navigation (§3.4).

**P5. No unnecessary time pressure.**

**P6. Readability takes precedence over aesthetic restraint.**

**P7. Honest status labelling.**  
Every feature carries an L1 / L2 / L3 / N/A status (§3.2). No planned feature is presented as functioning.

---

## 3. Information Architecture and User Journeys

### 3.1 Implementation baseline

The Expo route structure is the baseline for all implemented journeys (A3).

### 3.2 Three-level implementation model with N/A — corrected (P0-C3)

v3.1 introduced N/A but still over-classified local UI interactions as L2. v3.2 corrects this by tightening the definition of L2.

| Level | Meaning | Applies to |
|---|---|---|
| **L1 — Interface** | Visible UI exists and is navigable | Any feature with a UI |
| **L2 — Interaction & API** | User can complete the interaction **and the frontend calls a backend API successfully for that capability** | Features with a backend API call |
| **L3 — Therapeutic assessment & session behaviour** | Result is therapeutically assessed, persisted, and reflected in session state | Therapeutic features only |
| **N/A** | This level does not apply to this feature type | Non-therapeutic features; local UI-only interactions |

**Key rule (new in v3.2):** **L2 means backend integration, not user interaction.** A local UI interaction — typing text, revealing a hint, tapping previous/next, triggering a recording, triggering a spoken prompt — is **L1 only**. Its L2 is **N/A**, because no backend API call occurs for that capability. Only capabilities that actually hit a backend API (question retrieval, transcription, evaluation) can carry L2 = Yes.

**Second rule (retained from v3.1):** L3 may only be assigned to features whose result is a therapeutic assessment. Authentication, account setup, module selection, activity selection, profile, and settings are **not** therapeutic assessments; their L3 is **N/A**, not "Yes."

### 3.3 Actual navigation model

The Expo implementation is hierarchical but uses **carousel-based selection with embedded practice sets**. No separate Practice Set screen exists.

**Evidence (verified against `main`):**

- `ModuleSelectorScreen.tsx` uses `moduleIndex` and carousel arrows.
- `ActivitySelectorScreen.tsx` uses `activityIndex` and carousel arrows.
- Practice sets render via `practiceSets.map()` **inside** `ActivitySelectorScreen.tsx`.
- `app/(app)/q-sets/[qSetId].tsx` routes directly to `ChallengeScreen.tsx`.

**Corrected flow:**

```
Auth (sign in)
  │
  ▼
Account setup (first use; accessibility preferences captured)
  │
  ▼
Dashboard
  │   profile header · carousel placeholder · metrics · action grid (8 shortcuts)
  │
  ▼
Module selection  (carousel, one module at a time)
  │
  ▼
Activity selection  (carousel, one activity at a time)
  │   └── practice sets embedded below the current activity
  │
  ▼
Challenge  (routed via q-sets/[qSetId])
  │   picture clue · hints · text answer · microphone · spoken prompt
  │   previous / next question
  └── (no separate Practice Set screen exists)
```

**Proposed change (not current functionality):** replacing the module and activity carousels with vertical lists is a **Proposed** design change. It may be evaluated, but must not be specified as current behaviour. Until approved, §4.2–4.4 describe the carousel model.

### 3.4 Navigation rules

1. **Hierarchical navigation is preserved.** Module → activity → embedded practice sets → challenge. Never flattened. (A6)
2. **Predictable back controls.** Every screen below the dashboard provides a visible, consistently positioned back control returning to the immediate parent. **(Current implementation gap — see §3.7.)**
3. **Clear progress indicators.** Within the challenge, position within the current question set must be visible (e.g. "3 of 8" or a non-lexical equivalent).
4. **No hidden navigation.** No hamburger menus, no swipe-only gestures, no long-press navigation.
5. **Persistent escape.** *(Planned.)* Pause and exit must be available on the challenge screen and must not move between questions.
6. **Deep-link safety.** A deep link into a child route must render a valid parent chain or a safe recovery screen.

### 3.5 Implemented / L1 / L2 / L3 / N/A matrix — corrected (P0-C3, P0-C4)

| Feature | L1 | L2 | L3 | Notes |
|---|---|---|---|---|
| Authentication | Yes | Yes | **N/A** | API authentication |
| Account setup | Yes | Yes | **N/A** | Preferences stored via API |
| Module selection | Yes | Yes | **N/A** | Carousel; module list from API |
| Activity selection | Yes | Yes | **N/A** | Carousel; activities and practice sets from API |
| Question retrieval | Yes | Yes | No | Question load via API |
| Challenge — picture clue | Yes | **N/A** | No | Local render of returned asset |
| Challenge — hints | Yes | **N/A** | No | Local reveal of returned hint text |
| Challenge — text input | Yes | **N/A** | No | Local text entry; no API call at entry time |
| Challenge — microphone recording | Yes | **N/A** | No | Local recording; transcription is a separate capability |
| Challenge — speech transcription | Yes | **Yes** | No | Frontend speech API integrated |
| Challenge — spoken prompt | Yes | **N/A** | No | Local trigger of bundled or returned audio (manual only, §4.5.4) |
| Challenge — previous / next | Yes | **N/A** | No | Local navigation |
| Challenge — answer evaluation | **No** | No | **No** | Prototype endpoint exists; not integrated (§4.5.3) |
| Challenge — assessment persistence | **No** | No | No | Not implemented |
| Challenge — pause / resume | **No** | **N/A** | No | Not implemented |
| Challenge — explicit exit | **No** | **N/A** | No | Not implemented as specified |
| Challenge — session summary | **No** | **N/A** | No | Proposed (OD-3) |
| Progress reporting | **Yes (placeholder)** | No | **N/A** | `progress.tsx` renders a placeholder card |
| Profile | Yes | Yes | **N/A** | — |
| Settings | Yes | Yes | **N/A** | Persists preferences via API; **application gaps §6.2** |
| Help | **No** | **N/A** | **N/A** | No dedicated route |
| Therapist portal | **No** | **N/A** | **N/A** | Empty route stub; not an implemented interface (P0-C4) |

**Verification:** the Challenge feature matrix in §4.5 is the authoritative implementation record for that screen. §3.5 is the summary matrix; it must not contradict §4.5. Where they differ, §4.5 wins and §3.5 must be corrected.

### 3.6 Dashboard action count

The dashboard currently has **eight** action-grid shortcuts including Start Training. v3 stated both "eight demoted" and "seven remaining." The intent is explicit:

- **Extract Start Training** from the action grid and present it as the **dedicated Primary action** (§4.1).
- **Keep the remaining seven shortcuts** as Secondary navigation.
- **"Resume in-progress training" is not implemented** in the current dashboard and is not part of v3.2's secondary objectives for §4.1. It may return as a **Proposed** feature only if a session persistence model exists.

### 3.7 Back-control and touch-target implementation gaps

v3.2 records the current implementation gaps explicitly, because a specification that a codebase silently violates is not verifiable.

| Screen | Back control | Current size | Target (§6.1) |
|---|---|---|---|
| ModuleSelectorScreen | **Missing** — `onBack` not passed to TrainingHeader | N/A | 48 × 48 |
| ActivitySelectorScreen | Present | 44 × 44 in TrainingHeader | 48 × 48 |
| SettingsScreen | **Missing** — no explicit back control | N/A | 48 × 48 |
| Challenge | Present — "Return to Activities" | 40 px min height | 56 px for controls in a session-control group; 48 px otherwise |
| TrainingHeader language control | Present | 40 px height | 48 × 48 |

These are implementation gaps, not design gaps. Fixing them is in scope for engineering. §9.4 records the full gap register, including Poppins integration and font-size violations.

---

## 4. Screen-Level Specifications

### 4.0 Visual priority framework

v1 used an undocumented scoring algorithm; v2 through v3.1 replaced it with Primary / Secondary / Supporting. v3.2 retains that replacement.

#### 4.0.1 Method

1. **Objective** — state the screen's single primary objective and its supporting objectives.
2. **Inventory** — classify elements as Content / Interaction / Visual.
3. **Group** — by purpose, proximity, similarity, shared container, alignment.
4. **Prioritise** — Primary / Secondary / Supporting, by task contribution.
5. **Cap focal groups** — no more than **two** Primary groups on one screen.
6. **Apply treatment** — map priority → tokens in §5.3.
7. **Validate** — six checks in §9.1.

#### 4.0.2 Priority → treatment

| Priority | Treatment |
|---|---|
| Primary | Largest type step, strongest contrast, accent surface permitted, focal position |
| Secondary | Mid type step, strong neutral contrast, contained region, no accent fill |
| Supporting | Smallest permitted type step, muted contrast (still ≥ 4.5:1), compact spacing |

#### 4.0.3 Traceability

Every screen table records priority per element, justified by that screen's objective. If the original algorithm is later approved as a deliverable (OD-7), §4.0.1 is the section to replace.

### 4.1 Dashboard — L1/L2 partial, L3 N/A

- **Purpose:** Orient the user and provide the entry point into therapy.
- **Primary objective:** Begin training.
- **Secondary objectives:** Reach profile, settings, and the seven remaining shortcuts.

**Proposed change:** **extract Start Training** as the dedicated Primary action. The current dashboard has eight shortcuts with no dominant entry. The other seven become Secondary navigation.

| Element | Type | Group | Priority | Treatment | Current state |
|---|---|---|---|---|---|
| **Start Training** | Interaction | `therapy-entry` | **Primary** | Accent fill, `type.lg`, ≥ 56 px, icon + label | **Proposed primary** — currently one of eight equal shortcuts |
| Profile header | Content + visual | `identity` | Secondary | Header region, `type.md`, no accent | Implemented |
| Carousel | Visual | `discovery` | Supporting | Placeholder only | Placeholder — must not compete with Start Training |
| Metrics area | Content | `metrics` | Supporting | Compact, muted, contained | Depends on reporting API (L2 partial) |
| Remaining 7 shortcuts | Interaction | `shortcuts` | Secondary | Grid, consistent sizing, ≥ 48 px targets | Implemented |

- **Focal groups:** one Primary (`therapy-entry`). The carousel, if it later receives real content, may become the second Primary group; never a third.
- **Open item:** dashboard primary action confirmed as Start Training pending OD-2.
- **States:** default, loading (metrics), empty (no modules), error (metrics fetch failed).

### 4.2 Module selection — L1/L2, L3 N/A

- **Primary objective:** Choose a therapy module.
- **Current interaction:** **carousel** with `moduleIndex` and left/right arrows.
- **Hierarchy:** current module card Primary; carousel arrows Secondary (≥ 48 px); back control Supporting — **currently missing (§3.7).**
- **Components:** current module card (icon + short label), previous/next arrows, back control, optional page indicator.
- **Proposed change (not current):** replacing the carousel with a vertical list — must be labelled Proposed in any revision that introduces it.
- **States:** default, loading, empty (no modules assigned), error with retry.

### 4.3 Activity selection — L1/L2, L3 N/A (practice sets embedded)

- **Primary objective:** Choose an activity within the current module.
- **Current interaction:** **carousel** with `activityIndex` and left/right arrows.
- **Practice sets render via `practiceSets.map()` inside `ActivitySelectorScreen.tsx`. No separate Practice Set screen exists (§3.3).**
- **Hierarchy:** current activity card Primary; practice-set list Secondary as a set; carousel arrows Secondary; back control Supporting.
- **Components:** current activity card, previous/next arrows, embedded practice-set list, back control.
- **Proposed change (not current):** replacing the carousel with a list.
- **States:** default, loading, empty, error.

### 4.4 Practice set (embedded)

There is no standalone screen. Practice-set selection is a section of Activity Selection (§4.3).

- Selecting a practice set routes to `app/(app)/q-sets/[qSetId].tsx`, which renders `ChallengeScreen.tsx`.
- Practice-set items are Secondary; no Primary within this section.
- **States:** same as §4.3.

### 4.5 Challenge — feature matrix

v3 described Challenge as a single screen-level status; v3.1 converted to a feature matrix; v3.2 retains the matrix and adds answer-integrity (P1-C5).

#### 4.5.1 Feature matrix

| Capability | Current implementation | L1 | L2 | L3 | Required next step |
|---|---|---|---|---|---|
| Question retrieval | Integrated | Yes | Yes | No | Maintain |
| Picture clue | Implemented | Yes | N/A | No | Maintain |
| Hints | Implemented | Yes | N/A | No | Maintain |
| Text input | Implemented | Yes | N/A | No | **Preserve answer state across questions** (§4.5.2) |
| Microphone recording | Implemented | Yes | N/A | No | Maintain |
| Speech transcription | Integrated | Yes | Yes | No | Maintain |
| Spoken prompt playback | Implemented | Yes | N/A | No | **Manual-only for first release** (§4.5.4) |
| Previous / next question | Implemented | Yes | N/A | No | Preserve answer state (§4.5.2) |
| Answer evaluation | **Prototype endpoint exists** — not integrated | No | No | No | Integrate prototype with integrity safeguards (§4.5.3 milestone 1) |
| Assessment persistence | **Missing** | No | No | No | Implement (milestone 2) |
| Pause / resume | **Missing** | No | N/A | No | Implement |
| Session exit | Return navigation exists; no explicit session exit | No | N/A | No | Define behaviour; implement fixed-position control |
| Session summary | **Missing** | No | N/A | No | Product decision (OD-3) |
| Alternative-input routing | **Preference stored, not applied** | — | — | — | Apply `alternativeInputOn` (§6.2) |
| Preferred language | **Stored, not applied** — Challenge initialises to English | — | — | — | Apply saved preference (§6.2) |

#### 4.5.2 Answer-state preservation — confirmed gap

`changeQuestion()` calls `setQuestionIndex(nextIndex); setAnswer("");`. **Entered answer state is discarded on navigation.** The Finish Practice button calls `router.back()`. Neither persistence nor confirmation is implemented.

**Required behaviour (planned):** navigating previous/next preserves the answer per question; Finish Practice confirms or preserves the current answer. Verified by V-19.

#### 4.5.3 Speech evaluation — prototype, integrity-safeguarded (P1-C5)

`POST /api/v1/speech/evaluate` exists. `SpeechAssessmentService.ts` describes its evaluation as **prototype lexical comparison only**:

- Compares normalised words.
- Returns `EXACT_MATCH`, `PARTIAL_MATCH`, or `NO_MATCH`.
- **Does not** produce a therapeutic score.

**Integrity concern (new in v3.2):** the current endpoint accepts a **client-provided target**:

```json
{ "answer": "apple", "target": "apple", "language": "en" }
```

The server does not independently resolve the expected answer from a trusted published question. This is acceptable for a prototype demonstration but **must not be trusted for therapeutic scoring, XP awards, or clinical progress updates**. A client can submit any `target` it chooses.

**Two milestones, with integrity constraints made explicit:**

**Milestone 1 — Prototype integration.**
- Integrate the existing endpoint into the Challenge for prototype lexical comparison.
- Display the returned match result with neutral, non-punitive feedback (DR-A11Y-06).
- **Do not** treat the result as a therapeutic assessment.
- **Do not** drive progression, XP, or clinical reporting from a Milestone 1 result.
- L3 remains **No** for the Challenge until Milestone 2 completes.

**Milestone 2 — Production therapeutic assessment.**
- Resolve the question from a trusted question ID, not a client-supplied target.
- Resolve the expected answer **server-side**.
- Apply therapist-configured assessment rules.
- Persist the assessment result.
- Reflect the result in session state.
- Connect progression and session reporting.

**Rule (new in v3.2):** production assessment **must not trust a client-supplied expected answer**. The `target` field in the current request payload is a prototype convenience only. Milestone 2 must replace it with a server-resolved expected answer.

Relevant files (for engineering reference):

- `src/express-test/src/main/http/controllers/speechController.ts`
- `src/express-test/src/application/speech/SpeechAssessmentService.ts`

#### 4.5.4 Voice playback — manual-only for first release

**No `autoPlayPrompt` field exists** in the current persisted preferences (`preferredVoiceId`, `audioRate`, `audioVolume`, `voiceDisabled`). Introducing one would require a new preference, storage, and UI.

**v3.2 decision (unchanged from v3.1):** **manual-only playback for the first release.** Automatic playback is not a supported option until such time as:

- a product decision introduces an explicit preference with its own storage and UI, and
- clinical validation has confirmed that automatic speech does not pressure the patient.

`voiceDisabled` must be respected: when true, manual playback is hidden or clearly inactive with an accessible explanation. Manual playback uses saved `preferredVoiceId`, `audioRate`, and `audioVolume` (§6.2).

#### 4.5.5 Screen table

| Element | Type | Group | Priority | Treatment | Implementation |
|---|---|---|---|---|---|
| Picture clue | Visual | `stimulus` | **Primary** | Dominant area; high contrast; generous whitespace | L1 |
| Answer input (text) | Interaction | `answer` | **Primary** | Largest interactive, ≥ 56 px, clear boundary | L1; state preservation pending |
| Microphone recording control | Interaction | `answer` | **Primary** | Grouped with text; ≥ 56 px; explicit idle / recording / transcribing / result states | L1 |
| Spoken prompt playback (manual) | Interaction | `stimulus-support` | Secondary | Manual only (§4.5.4); icon + label; visible playback state | L1 |
| Hint control + content | Interaction + content | `scaffold` | Secondary | Reveals progressively; never auto-reveals | L1 |
| Previous / next question | Interaction | `navigation` | Secondary | Consistent positions; disabled at bounds | L1; state preservation pending |
| Question position indicator | Content | `progress` | Supporting | Non-lexical preferred | L1 |
| **Pause** | Interaction | `session-control` | Supporting | Fixed position; ≥ 48 px | **Not implemented (planned)** |
| **Exit** | Interaction | `session-control` | Supporting | Fixed position; ≥ 48 px | **Not implemented as specified (planned)** |

- **Focal groups:** two Primary groups permitted — `stimulus` and `answer`.
- **Response time:** no limit, no visible countdown (§7.4).
- **Input mode:** text and microphone both available unless disabled by preference. `alternativeInputOn` semantics in §6.2.
- **Microphone states:** idle → recording → transcribing → result → editable. Each state visible and non-colour-only.
- **Error tolerance:** retry always available; exit always available (when exit is implemented).
- **States:** loading question, default, hint revealed, recording, transcribing, empty, error.

### 4.6 Profile — L1/L2, L3 N/A

- **Primary objective:** View identity and account information.
- **Hierarchy:** identity summary Primary; account details Supporting.
- **States:** default, loading, error.

### 4.7 Settings — L1/L2, L3 N/A

- **Purpose:** Adjust accessibility preferences (§6.2).
- **Primary objective:** Change a preference and confirm the effect.
- **Hierarchy:** preference controls Primary as a set; headings Secondary; explanatory text Supporting and minimal.
- **Rule:** A changed preference must visibly take effect (or offer an immediate preview).
- **Persistence:** confirmed stored. **Application throughout the app is not confirmed — see §6.2 gap table.**
- **Back control:** currently missing (§3.7).
- **States:** default, saving, saved, error with retry.

### 4.8 Progress — L1 Yes (placeholder), L2 No, L3 N/A

- `progress.tsx` renders a **placeholder card**. Reporting API is not connected.
- **Not to be specified as functioning.**
- **When implemented:** visual and non-lexical progress representation as Primary; percentage and streak as Supporting; no punitive framing of regression.
- **Constraint:** must not depend on colour alone (§9.1, check 2).

### 4.9 Session summary — Proposed

Existence unconfirmed (OD-3). If implemented: visual outcome summary Primary; continue and return actions Secondary; no score presented as failure.

### 4.10 Help / support — Proposed

No dedicated help route exists (OD-3). In-screen support (hints, playback) takes precedence over a separate help destination.

### 4.11 Therapist portal — L1 No, L2 N/A, L3 N/A — corrected (P0-C4)

The route group exists with an **empty entry screen** — not an implemented interface. Out of scope for this specification (A2). A separate specification is required when it is implemented.

---

## 5. Design System and Tokens

### 5.1 Colour — OPEN DECISION (OD-1)

Unresolved: v1 proposed warm off-white + green accent; current implementation uses cool white + blue accent. **Product decision.** v3.2 retains v3.1's recommendation: retain the current blue temporarily; validate alternatives in the accessibility review.

Whichever palette is chosen must satisfy:

- One accent hue only, reserved for Primary.
- Contrast ≥ 4.5:1 normal text, ≥ 3:1 large text and UI components (WCAG 2.2 AA).
- Hierarchy legible in grayscale; colour never the sole carrier (§9.1, check 2).
- High-contrast preference raises contrast above default — inversion alone is insufficient.

Provisional tokens (values pending OD-1):

| Token | Role |
|---|---|
| `color.bg` | App background |
| `color.surface` | Cards, inputs, panels |
| `color.surface-muted` | Supporting regions |
| `color.text-primary` | Primary text |
| `color.text-secondary` | Secondary text |
| `color.text-tertiary` | Supporting text — still ≥ 4.5:1 |
| `color.accent` | Primary emphasis only |
| `color.accent-text` | Text on accent fill |
| `color.border` | Dividers |
| `color.focus` | Keyboard focus ring — ≥ 3:1 against bg and surface |

### 5.2 Typography — Poppins

**Typeface:** Poppins (A4). User text-size preference overrides the fixed scale (§6.2).

**Implementation requirement:** registering Poppins font faces at the Expo root does **not** apply them to every `Text`. A shared typography wrapper exists at `src/expo-test/src/shared/ui/native.tsx`, but several patient-facing screens still import `Text` directly from `react-native` — see §9.4 for the gap register.

Requirement:

- All patient-facing text renders through the shared typography wrapper (or an equivalent single primitive applying Poppins and the tokens below).
- Direct unstyled RN `Text` on patient-facing content is a defect (V-07).
- If Poppins fails to load, layout remains usable at the same sizes and line heights with a neutral sans-serif fallback (V-08).

**Type scale:**

| Token | Size | Weight | Line height | Usage |
|---|---|---|---|---|
| `type.lg` | 28–32 px | 600 | 1.25–1.3 | Primary emphasis, Primary actions |
| `type.md` | 22–24 px | 500 | 1.4–1.5 | Secondary headings, answer labels |
| `type.sm` | 18–20 px | 400–500 | 1.5 | Supporting text, secondary labels |
| `type.xs` | 16 px | 400 | 1.5 | Metadata only — never instructions |

**Rules:**

- **16 px / 16 sp is the absolute minimum** for patient-facing text.
- The 15 px caption role from v1 is removed.
- Line height ≥ 1.5× for anything at `type.sm` and below.
- No negative letter spacing. No all-caps or italics for extended passages.

### 5.3 Priority → treatment tokens

| Token | Primary | Secondary | Supporting |
|---|---|---|---|
| Type step | `type.lg` | `type.md` | `type.sm` / `type.xs` |
| Weight | 600 | 500 | 400–500 |
| Contrast | accent or strongest neutral | strong neutral | muted neutral (≥ 4.5:1) |
| Whitespace | ≥ 32 px | ≥ 24 px | ≥ 16 px |
| Corner radius | 20–24 px | 16–20 px | 12–16 px |
| Min interactive height | 56 px | 56 px | 48 px |
| Icon size | 28–32 px | 24–28 px | 20–24 px |

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

### 6.1 Touch-target standards

| Reference | Requirement | Unit |
|---|---|---|
| WCAG 2.2 AA — SC 2.5.8 | 24 × 24 | CSS px, with exceptions |
| WCAG 2.2 AAA — SC 2.5.5 | 44 × 44 | CSS px |
| Apple Human Interface Guidelines | 44 × 44 | pt (iOS / iPadOS default controls) |
| Google — Android guidance | 48 × 48 | dp |
| **MDATE requirement (DR-A11Y-01)** | **48 × 48** | **CSS px (web) / dp (Android) / pt (iOS)** |

DR-A11Y-01 is stricter than WCAG 2.2 AA and matches Google's 48 dp guidance while being tighter than Apple's 44 pt baseline. Verified per platform:

- **Web:** CSS px including padding, at 100% zoom.
- **Android:** dp.
- **iOS:** pt, additionally checked against Apple's 44 pt baseline to confirm the stricter target is met.

Existing implementation gaps against DR-A11Y-01 are recorded in §3.7.

### 6.2 Accessibility preferences — storage vs application, alternative-input clarified (P1-C8)

Account setup persists the following. **Application throughout the app is a separate requirement.** v3.2 corrects v3.1's implicit assumption that storing equals applying.

| Preference | Values | Storage / UI | Applied in Challenge | Application requirement |
|---|---|---|---|---|
| Text size | small / medium / large | Yes | **Missing** | Scale the type scale. Never below 16 px equivalent at any setting. No clipping at largest. |
| Contrast | normal / high | Yes | **Missing** | High contrast raises contrast above default (not inversion only). Passes grayscale check. |
| Alternative input | on / off | Yes | **Missing** | See semantics below. |
| Preferred voice | voice selection | Yes | **Missing** | Playback uses saved voice. |
| Speech rate | adjustable | Yes | **Missing** — hardcoded 0.82 | Playback honours stored rate. |
| Volume | adjustable | Yes | **Missing** | Playback honours stored volume; must not silently override system mute. |
| Voice disabled | enabled / disabled | Yes | **Missing** — `voiceDisabled` not consulted | When disabled, manual playback hidden or clearly inactive with accessible explanation (§4.5.4). |
| **Preferred language** | language code | **Yes** | **Missing** — module / activity / challenge initialise local language state to English | Content and prompts use the saved preference. |

**Alternative-input semantics — clarified (P1-C8):**

The prior definition ("true → text + microphone + configured alternative surfaces; false → at least one functional channel") did not state what actually changes when the toggle is flipped. v3.2 makes the behaviour explicit.

When **`alternativeInputOn = true`**:
- Text input remains available (never disabled by the toggle).
- Microphone control is exposed **when microphone permission is granted**. Permission remains independent of the toggle; denying permission does not flip the toggle.
- Any other configured input surfaces (defined by the app, not by this document) are exposed when supported by the platform.
- Voice output controls follow the **voice output** preference independently. The toggle does not force or suppress speech.

When **`alternativeInputOn = false`**:
- Text input remains available — **the text path is never removed by the toggle**.
- Microphone control is hidden or clearly inactive with an accessible explanation.
- Other configured input surfaces are hidden.

**Invariants that the toggle must not affect:**
- Microphone **permission** state — permission prompts occur regardless of toggle state.
- Voice output preferences — playback of spoken prompt follows `voiceDisabled`, `preferredVoiceId`, `audioRate`, `audioVolume` independently.
- Preferred language — content language is independent of the toggle.

**Rationale:** the toggle expresses the user's answer-method preference. It must not become a safety switch that removes the only usable answer channel, and it must not silently control unrelated preferences.

**Product owner confirmation required (OD-8)** before implementation.

**Preference application rules:**

- Preferences take effect immediately or offer an immediate preview.
- Preferences persist across sessions (confirmed for storage).
- Every screen specification must state largest-text and high-contrast behaviour. Default: reflow, no clip, no text below the 16 px floor.
- No screen may depend on colour alone at either contrast setting.

### 6.3 Communication support

**DR-A11Y-02 (multimodal redundancy):** *Important* instructions, *important* actions, and *important* feedback are conveyed in at least two modalities — visual (icon or picture) and textual (short label), with audio where voice output is enabled. **Not every UI element requires two modalities.** The rule serves Supported Conversation, not mechanical duplication.

**DR-A11Y-03 — Response time.** No arbitrary response deadline (§7.4).

**DR-A11Y-04 — Plain language.** Labels are single words or short phrases. Instructional text targets a readability grade of 5 or lower. No boilerplate, no marketing copy.

**DR-A11Y-05 — Single-action interaction.** No double-tap, long-press, drag, or multi-finger gestures.

**DR-A11Y-06 — Error tolerance.** Incorrect answers produce neutral, non-punitive feedback. Retry and exit are always available.

### 6.4 Keyboard and screen reader

- All interactive elements reachable and operable by keyboard on web, in an order matching visual order.
- Focus always visible (`color.focus` ≥ 3:1 against adjacent colours).
- Semantic headings reflect priority (`h1` for Primary message, `h2` for Secondary groups). Not styled-only.
- Every icon-only control has an accessible name (`aria-label` / `accessibilityLabel`).
- Live state changes announced via live region or native announcement.
- Screen reader order matches §4 priority order.

### 6.5 Edge-placement — accessibility consideration, not a universal rule

**DR-A11Y-07.** Critical controls (exit, pause, back) must have **at least one instance** reachable without requiring reach to the far right edge. Placement validated in usability testing (§9.3). Until validation, exit and pause default to the leading side of their region. Not universal; accommodates a common co-occurring impairment (§2.1).

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

Microphone permission required for audio answer path (§4.5).

- **Contextual request** — first microphone use, not launch.
- **On denial** — text path remains usable; denial stated in plain language; route to change the setting. Permission state does not affect `alternativeInputOn` (§6.2).
- **On permanent denial** — microphone present but clearly inactive, with accessible explanation.

### 7.4 Timing — separating UX from system behaviour

| Concern | Requirement |
|---|---|
| Visible exercise countdown | **Not mandatory.** Countdown only if a specific therapy module legitimately requires timing as a therapeutic parameter, identified per module and flagged under OD-6. |
| Patient response time | **No arbitrary time limit.** No interface-driven timeout. |
| Pause and resume | **Clear and predictable.** *(Currently not implemented — §4.5.1.)* Must preserve question + answer + recording state on implementation. |
| Session expiry | **Supported and explained.** Backend expiry explained in plain language; recoverable input preserved where possible; single-action recovery. Never silently discards an answer mid-recording or mid-transcription. |
| Network interruption | **Recoverable where supported.** In-progress text preserved; in-progress recording outcome explicit. |
| Reduced motion | **Respected.** |

Therapy modules that legitimately require timing must **declare it explicitly**. Until such a declaration exists, no module is timed.

### 7.5 Recovery paths

- Session expiry during a challenge: preserve the current answer, present a single recovery action, return to same question on success. Verified by **V-22**.
- Network failure during transcription: present recorded audio state; allow retry or fall back to text without losing entered text. Verified by **V-23**.
- Broken parent chain: render nearest valid parent; never a blank screen or unhandled error. Verified by **V-20** and **V-21**.

---

## 8. Platform Implementation Rules

### 8.1 Web viewport

**Current implementation:** `AppViewport` defaults to 412 × 892.  
**v3.2 target:** 430 CSS px maximum width with **fluid height** — no fixed aspect ratio. Reconciliation pending OD-4.

**DR-WEB-01 — Width containment.** Shell centred on desktop, max 430 CSS px. Fills width below 430 px.

**DR-WEB-02 — Fluid height, safe areas, and box-sizing.** Shell fills visual viewport using `100dvh`. Fixed pixel height not permitted. **`box-sizing: border-box` is required** so that safe-area padding does not push the shell past its intended viewport height.

**DR-WEB-03 — Meta viewport.** `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.

**DR-WEB-04 — Reconciliation.** The 412 × 892 default is retained until OD-4 resolves the difference.

**DR-WEB-05 — Native parity.** iOS and Android use full-screen `View` + `SafeAreaView`, no hard-coded pixel dimensions.

**Illustrative web-equivalent CSS.** The following is the web equivalent of the Expo implementation. It is **illustrative**, not a file that currently exists. The selector name `#app-shell` is a placeholder for whatever container element the web build uses.

```css
/* Web equivalent of the Expo viewport shell. Illustrative only. */

html, body {
  margin: 0;
  height: 100%;
  background: #E8E5E0;   /* desktop backdrop; final value pending OD-1 */
  display: flex;
  justify-content: center;
}

#app-shell {
  box-sizing: border-box;               /* required — see DR-WEB-02 */
  width: 100%;
  max-width: 430px;
  height: 100dvh;
  overflow: hidden;
  position: relative;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

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
| V-04 | Gestalt grouping | Proximity, similarity, shared regions | Same-group elements read as related; unrelated groups ≥ 24 px apart |
| V-05 | Responsive | 320 / 375 / 412 / 430 px; largest text; high contrast | No clipping, no overlap, no below-floor text, no below-target target |
| V-06 | Accessibility | Contrast audit; keyboard-only pass; screen reader pass | All §6.4 requirements met |

### 9.2 Implementation conformance

| ID | Requirement | Verification |
|---|---|---|
| V-07 | Poppins applied to all patient-facing text | Code inspection: no unstyled RN `Text` on patient-facing screens; rendered font confirmed on web and native |
| V-08 | Font fallback usable | Block Poppins network request; confirm layout holds |
| V-09 | No patient-facing text below 16 px at any preference | Computed style audit at small / medium / large. **Expected to fail against current implementation** (§9.4) — failure opens a code-change ticket, not a document change |
| V-10 | Touch targets meet DR-A11Y-01 per platform | Automated audit + manual device measurement (CSS px / dp / pt). **Expected to fail against current implementation** (§3.7) |
| V-11 | Preferences persist and take effect | Change each §6.2 preference, restart, confirm persisted **and applied** |
| V-12 | No visible countdown on any untimed module | Screen inspection |
| V-13 | Session expiry produces explained, recoverable state | Simulate expiry during challenge; confirm preservation and single-action recovery |
| V-14 | Microphone denial leaves text path intact | Deny permission; confirm text remains usable and explanation shown |
| V-15 | Reduced motion honoured | Enable platform setting; confirm no non-essential motion |
| V-16 | Planned features labelled | Inspect Progress, Session summary, Help; confirm status matches §3.5 |
| **V-17** | **No corrupted characters in this document** | **Automated scan for `¿` and other substitutions — must return zero. Blocks approval.** |
| **V-18** | **Preference integration verified** | **Each row of §6.2 gap table verified as applied in the Challenge, including `preferredLanguage`** |
| **V-19** | **Answer state preserved across questions** | **Navigate previous/next in Challenge; entered answer restored** |

### 9.3 Validation prerequisite

Contrast, layout, and preference behaviour can be verified by a developer. **Aphasia-friendliness cannot.** Validation with people with aphasia and an appropriate clinician is a required prerequisite before any claim of aphasia-friendliness, and its results must be recorded against DR-A11Y-07 and §6.2 before those requirements are considered confirmed. Until then, this document's accessibility requirements are design intent, not validated outcome.

### 9.4 Existing implementation gap register — extended (P1-C6, P1-C7)

These are recorded as facts about the current codebase, not as specification requirements. They are inputs to a code-change ticket, not document revisions.

**Navigation and controls:**

| Gap | Where | Required corrective (engineering) |
|---|---|---|
| Missing back control | `ModuleSelectorScreen` (`onBack` not passed to TrainingHeader) | Pass `onBack` and render back control per §3.4 |
| Missing back control | `SettingsScreen` | Add explicit back control per §3.4 |
| Touch target below 48 | `TrainingHeader` back button (44 × 44) | Enlarge to 48 × 48 |
| Touch target below 48 | `TrainingHeader` language control (40 px height) | Enlarge to 48 × 48 |
| Touch target below 48 | `ChallengeScreen` "Return to Activities" (40 px min height) | Enlarge to 48 px (or 56 px if grouped as session-control) |

**Typography (P1-C6):**

| Gap | Where | Required corrective (engineering) |
|---|---|---|
| Direct RN `Text` import bypassing shared typography wrapper | Patient-facing screens still importing `Text` from `react-native` instead of `src/expo-test/src/shared/ui/native.tsx` | Replace direct imports with the shared typography wrapper; audit each patient-facing screen for Poppins and type-token conformance |
| No rendered-font verification on web | Web build | Confirm rendered font is Poppins (not fallback) at small / medium / large text preference; include in V-07 |

**Font-size violations (P1-C7) — known violations of §5.2:**

| Component | Existing font size | Minimum (§5.2) | Required corrective (engineering) |
|---|---|---|---|
| `DashboardActionGrid.tsx` | 10 px | 16 px | Enlarge label to `type.xs` (16 px) minimum, or restructure layout to accommodate |
| `TrainingHeader.tsx` | 12 px | 16 px | Enlarge header text to `type.xs` minimum, or reduce header content density |
| `ChallengeScreen.tsx` | 12 px | 16 px | Enlarge secondary labels to `type.xs` minimum; structural changes if needed |

V-09 remains the verification gate for these violations.

**Preference application gaps (retained from v3.1):**

| Gap | Where | Required corrective (engineering) |
|---|---|---|
| Answer state reset | `ChallengeScreen.tsx` `changeQuestion()` | Preserve per-question answer state (§4.5.2) |
| Preference not applied — text size | Challenge | Consume saved text size (§6.2) |
| Preference not applied — contrast | Challenge | Consume saved contrast (§6.2) |
| Preference not applied — alternative input | Challenge | Consume `alternativeInputOn` (§6.2) |
| Preference not applied — voice / rate / volume / voiceDisabled | Challenge | Consume saved values (§6.2, §4.5.4) |
| Preference not applied — preferred language | Module / Activity / Challenge | Consume saved `preferredLanguage` (§6.2) |

### 9.5 Deep-link and recovery tests

| ID | Test | Expected result |
|---|---|---|
| **V-20** | Deep link directly to `q-sets/[qSetId]` without visiting parent routes | Either renders the full parent chain, or redirects to a safe recovery screen. Never a blank screen or unhandled error. |
| **V-21** | Deep link directly to `q-sets/[qSetId]` with an invalid / deleted ID | Renders a plain-language error state with a single safe action (return to nearest valid parent). Never a blank screen. |
| **V-22** | Simulate backend session expiry mid-challenge | Current answer preserved; plain-language explanation shown; single recovery action returns to same question on success. |
| **V-23** | Simulate network failure during transcription | Recorded audio state preserved; user can retry or fall back to text; entered text not lost. |

### 9.6 Answer-integrity acceptance test — new in v3.2 (P1-C5)

| ID | Test | Expected result |
|---|---|---|
| **V-24** | Submit a request to `/api/v1/speech/evaluate` with a client-supplied `target` that differs from the actual question's expected answer | Milestone 1: prototype endpoint may return a match against the client `target`; **no** progression, XP, or clinical reporting is driven from the result. Milestone 2: the request is rejected or the server ignores the client `target` and resolves the expected answer from the question ID. |

**Gate:** production assessment (Milestone 2) must not ship while V-24 fails for the client-supplied `target`.

---

## 10. Open Decisions, Assumptions and References

### 10.1 Open decisions

| ID | Decision | Owner | Priority | Reviewer recommendation | Blocks |
|---|---|---|---|---|---|
| OD-1 | Blue vs green palette | Product | High | Retain existing blue temporarily; validate alternatives | §5.1, all screens |
| OD-2 | Start Training as dashboard primary | Product | High | Approve | §4.1 |
| OD-3 | Help and Session Summary scope | Product | Medium | Defer dedicated screens; retain in-screen help | §4.9, §4.10, §3.5 |
| OD-4 | 412 vs 430 viewport | Engineering + Product | Medium | Adopt fluid height, 430 px maximum width | §8.1 |
| OD-5 | Left-handed / mirrored layout preference | Product | Low | — | DR-A11Y-07 |
| OD-6 | Whether any therapy module legitimately requires timing | Clinical + Product | Medium | — | §7.4 |
| OD-7 | Whether the original visual hierarchy algorithm is a project deliverable | Product | Medium | — | §4.0 |
| OD-8 | Alternative-input semantics (refined §6.2) | Product | High | Clarify behaviour before implementation | §4.5, §6.2 |
| OD-9 | Preferred-language integration scope | Product + Engineering | High | Read saved language preference globally | §6.2, §4.5.1 |

### 10.2 Prerequisites and blockers

| Item | Type | Priority |
|---|---|---|
| Resolve OD-1 colour palette | Product decision | High |
| Confirm OD-2 dashboard primary | Product decision | High |
| Confirm OD-8 alternative-input semantics (refined §6.2) | Product decision | High |
| Resolve OD-9 preferred-language application | Product + Engineering | High |
| Establish authoritative research references in-repo | Evidence prerequisite | High |
| Validate accessibility with people with aphasia and a clinician | Validation prerequisite | High |
| Resolve OD-3 Help / Session summary scope | Product decision | Medium |
| Obtain original visual hierarchy algorithm, or approve §4.0 | Documentation dependency | Medium |
| Include HLD/SRS in version control or provide traceable references | Documentation prerequisite | Medium |
| Resolve OD-4 shell dimensions | Engineering + Product | Medium |

**Repository documentation inventory (corrected):** `docs/` currently contains `design-spec.md` (v1), `design-spec-v2.md`, `design-spec-v3.md`, and `design-spec-v3.1.md`. This file (`design-spec-v3.2.md`) is added when this revision is committed. The HLD and SRS referenced in prior project decisions are **not version-controlled here**.

**Canonical replacement plan (on approval):**

```
docs/
├── design-spec.md              (canonical = content of design-spec-v3.2.md)
└── archive/
    ├── design-spec-v1.md       (current design-spec.md)
    ├── design-spec-v2.md
    ├── design-spec-v3.md
    └── design-spec-v3.1.md
```

v1 is archived (renamed from `design-spec.md` to `archive/design-spec-v1.md`), not discarded. No documentation file is deleted.

### 10.3 Assumptions

| ID | Assumption |
|---|---|
| A1 | Patient-facing MDATE is the primary scope of this document. |
| A2 | The therapist portal receives a separate specification when its interface is implemented. |
| A3 | The existing Expo route structure is the baseline for implemented user journeys. |
| A4 | Poppins remains the primary typeface; user accessibility preferences take priority over fixed typography. |
| A5 | English and Bahasa Melayu are the initial supported languages. |
| A6 | The module → activity → embedded practice sets → challenge journey is the therapy navigation model (carousel-based, per §3.3). |
| A7 | Visual design avoids unnecessary time pressure; backend session expiry is supported. |
| A8 | Web app retains a centred mobile canvas on desktop with fluid viewport height and safe-area handling. |
| A9 | Unimplemented features are labelled L1 / L2 / L3 / N/A (§3.2) or Planned / Proposed — never presented as functioning. |
| A10 | Accessibility is designed around individual needs, not assumed disabilities or a single universal aphasia profile. |

### 10.4 References

- Aphasia Institute — Supported Conversation for Adults with Aphasia (SCA).  
  https://www.aphasia.ca/health-care-professionals/supported-conversation-training/
- American Speech-Language-Hearing Association (ASHA) — Aphasia practice portal and person-centred care guidance.  
  https://www.asha.org/practice-portal/clinical-topics/aphasia/
- W3C — Web Content Accessibility Guidelines 2.2, SC 2.5.8 (Target Size, Minimum) and SC 2.5.5 (Target Size, Enhanced).  
  https://www.w3.org/TR/WCAG22/
- Apple — Human Interface Guidelines, Layout and Controls (44 × 44 pt baseline).  
  https://developer.apple.com/design/human-interface-guidelines/layout
- Google — Material Design 3, Accessibility (48 × 48 dp touch target).  
  https://m3.material.io/foundations/accessible-design/accessibility-basics

References must be mirrored into version control (§10.2) for traceability. External citations are directional guidance, not substitute clinical validation.

---

## 11. Execution Plan — honest statuses

| Stage | Description | Status |
|---|---|---|
| 1 | Document audit: specification, Expo routes, components, platform constraints, accessibility preferences | **Complete** |
| 2 | Correct information architecture: carousels and embedded practice sets; L1/L2/L3/N/A matrix reconciled; therapist portal status corrected; back-control and touch-target gaps recorded | **Complete in v3.2** (§3) |
| 3 | Rebuild design requirements: typography, colour, layout, touch targets, accessibility preferences, audio, motion, acceptance criteria | **Complete in v3.2** (§5, §6, §9) — colour pending OD-1; `alternativeInputOn` pending OD-8; preferred-language application pending OD-9 |
| 4 | Specify individual screens including loading, empty, error, recovery | **Complete in v3.2** (§4, §7) — Challenge documented as feature matrix with answer-integrity milestones |
| 5 | Verification and documentation review: traceability, references, platform verification, consistency review, encoding correction | **Partial** — V-17 is the approval gate; V-18 through V-24 added; user validation outstanding; implementation gap register (§9.4) complete for known gaps |

**Next step:** resolve High-priority blockers in §10.2 (OD-1, OD-2, OD-8, OD-9, references, user validation) and run V-17 through V-24, then close Stage 5. Until then, this document remains **Draft — Pending design decisions and validation**. On approval, `design-spec-v3.2.md` replaces `design-spec.md` as the canonical specification; v1, v2, v3, and v3.1 move to `docs/archive/`.
