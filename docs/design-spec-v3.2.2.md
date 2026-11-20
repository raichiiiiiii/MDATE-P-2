# Design Specification v3.2.2: MDATE-P-2 — Patient-Facing Experience

**Document path:** `docs/design-spec-v3.2.2.md`  
**Document state:** Targeted correction of v3.2.1 (blob `ac33c4a170d622c65dadf0b2d0cd5d11951290fb`). This revision is committed to `main` as a review snapshot. See §1.4 and §10.2 for the workflow note.  
**Change boundary:** Documentation only. No Expo code changes. No backend changes. No changes to the locked HLD architecture.  
**Approval gates:** separated into A (documentation), B (product & accessibility), and C (engineering implementation). Only Gate A blocks documentation approval. See §11.

---

## 0. Revision Ledger

| Version | Status | Notes |
|---|---|---|
| v1 | Superseded | Undocumented scoring algorithm; outdated two-button activity model; corrupted characters |
| v2 | Superseded | Correct structure; character corruption; navigation and Challenge overstated; metadata errors |
| v3 | Superseded | Character corruption; L1/L2/L3 over-applied; speech evaluation treated as completed assessment |
| v3.1 | Superseded | Character corruption; L1/L2/L3 still over-classified; therapist portal incorrectly marked L1 Yes |
| v3.2 | Superseded | Committed to `main` at `9d055247…`; V-17 self-defeating; L2 granularity inconsistent; alternative-input/microphone permission contradiction; Milestone 1 not labelled Proposed |
| v3.2.1 | Superseded | Committed to `main` at `ac33c4a1…`; V-17 fixed; L1/L2/L3 reconciled; permission lifecycle clarified; per-question answer model added; preferred-language single source of truth added. **Remaining defects:** branch workflow mismatched repository state; merge gate contradicted documentation-only boundary; §7.5 referenced wrong acceptance tests; typography gap register incomplete (19+ known violations not listed); spoken-prompt described as returned audio (actual implementation is device TTS); evaluation-API classification inconsistent; type scale not platform-specific; multimodal terminology imprecise; screen-reader semantics conflated web/native; mid-session language transitions incomplete |
| **v3.2.2** | **Draft — Pending design decisions and validation** | This document. Targeted corrections of v3.2.1 review P0-C1, P0-C2, P1-C3 through P1-C7, and P2-C8 through P2-C10. No restructuring. |

### 0.1 What changed in v3.2.2 (mapped to review)

| Review item | Corrective action | Where |
|---|---|---|
| **P0-C1** — Dedicated review branch does not exist | Metadata and §1.4 now state the actual repository state: v3.2.1 was committed to `main` at `ac33c4a1…` as a review snapshot. §10.2 recommends a dedicated review branch for future revisions but records what actually happened. | Metadata, §1.4, §10.2 |
| **P0-C2** — Merge gate contradicted documentation-only boundary | §11 now defines **three separate gates** (A documentation, B product & accessibility, C engineering implementation). Only **Gate A** blocks documentation approval. V-tests belong to Gate C and apply when the corresponding functionality exists. | §11, §9.2 header, §10.2 |
| **P1-C3** — §7.5 referenced wrong tests | §7.5 references corrected: session expiry → V-25; broken parent chain → V-23 and V-24; network failure during transcription → **V-27 (new)**. §9.2 V-13 notes V-25 as its specific test. | §7.5, §9.2, §9.5 |
| **P1-C4** — Evaluation-API classification inconsistent | R17 split into **R17 (backend endpoint)** and **R17a (frontend integration)**. R8 and R13 L3 corrected to **N/A** (upstream operations, not therapeutic assessments). §4.5.1 aligned. | §3.5, §4.5.1, §4.5.3 |
| **P1-C5** — Typography gap register incomplete | §9.4 expanded with all known below-16 style names and sizes across `ChallengeScreen.tsx` (19 declarations), `TrainingHeader.tsx` (2), `DashboardActionGrid.tsx` (1). | §9.4 |
| **P1-C6** — Spoken prompt described as returned audio | R14 and §4.5.4 corrected: current implementation uses **Expo Speech device text-to-speech**, not returned audio. `preferredVoiceId` selects a supported TTS voice, not an audio asset. | §3.5, §4.5.4, §6.2 |
| **P1-C7** — Type scale not platform-specific | §5.2 type scale and V-09 now specify Web CSS px / Android sp / iOS pt. | §5.2, §9.2 |
| **P2-C8** — Multimodal terminology imprecise | DR-A11Y-02 distinguishes **visual redundancy** (icon/picture + text) from **cross-modal support** (visual + audio/gesture). Does not require audio for every control. | §6.3 |
| **P2-C9** — Screen-reader semantics conflated | §6.4 split into web (semantic HTML heading hierarchy) and native (platform heading roles). | §6.4 |
| **P2-C10** — Mid-session language transitions incomplete | §6.2 specifies what happens to current question, revealed hints, entered text, active recording, and currently speaking prompt when language changes mid-session. Remaining open items recorded in §9.7. | §6.2, §9.7 |

### 0.2 Encoding integrity

This document is authored with proper Unicode throughout: arrows (U+2192 RIGHTWARDS ARROW), comparison symbols (U+2265 GREATER-THAN OR EQUAL, U+2264 LESS-THAN OR EQUAL, U+00D7 MULTIPLICATION SIGN), box-drawing characters (U+2500 to U+257F), and diacritics as needed. This document contains **zero** instances of U+00BF INVERTED QUESTION MARK.

**V-17 (§9.2)** remains the automated gate. V-17 constructs the target codepoint at test time (for example via `String.fromCharCode(0x00BF)` or `\u00BF`) and requires zero occurrences. v3.2.1 passed V-17; v3.2.2 must pass it too.

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

### 1.4 Out of scope and repository documentation inventory — corrected (P0-C1)

**Out of scope:**

- Therapist portal interface. The route group exists but its entry screen is an **empty route stub**, not an implemented interface. Separate specification required. (A2)
- Backend session lifecycle implementation.
- Clinical efficacy claims.

**Repository documentation inventory (actual state at time of v3.2.2 authoring):**

```
docs/
├── design-spec.md          (v1, superseded)
├── design-spec-v2.md       (superseded)
├── design-spec-v3.md       (superseded)
├── design-spec-v3.1.md     (superseded)
├── design-spec-v3.2.md     (review snapshot at 9d055247…)
├── design-spec-v3.2.1.md   (review snapshot at ac33c4a1…)
└── design-spec-v3.2.2.md   (this file)
```

**Workflow note (corrected — actual state):** v3.2.1 was **committed to `main` at `ac33c4a1…` as a review snapshot**, not developed on a dedicated review branch. v3.2.2 is also committed to `main` for the same reason (it corrects findings in a review of the previous document). The recommended workflow for **future substantive revisions** (see §10.2) is to develop on a dedicated review branch and merge to `main` only after Gate A passes. The workflow description must reflect what happened, not what should have happened.

The HLD and SRS referenced in prior project decisions are **not version-controlled here**. Traceability gap recorded in §10.2.

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

**P4. Predictable over minimal.**

**P5. No unnecessary time pressure.**

**P6. Readability takes precedence over aesthetic restraint.**

**P7. Honest status labelling.** Every feature carries an L1 / L2 / L3 / N/A status (§3.2). No planned feature is presented as functioning.

---

## 3. Information Architecture and User Journeys

### 3.1 Implementation baseline

The Expo route structure is the baseline for all implemented journeys (A3).

### 3.2 Three-level model with N/A and consistent granularity

The model is defined once, then applied once per feature in §3.5. **Data retrieval** and **local presentation / interaction** are separate rows.

| Level | Meaning |
|---|---|
| **L1 — Interface** | Visible UI exists and is navigable |
| **L2 — Interaction & API** | For frontend-integration rows: the frontend successfully calls a backend API for that capability. For **backend-endpoint rows** (rare; used only where the endpoint is the feature): the backend endpoint exists and responds successfully. Row type is stated explicitly. |
| **L3 — Therapeutic assessment & session behaviour** | Result is therapeutically assessed, persisted, and reflected in session state. Only therapeutic capabilities carry L3 = No when unimplemented. Non-therapeutic and upstream operations carry L3 = N/A. |
| **N/A** | This level does not apply to this row |

**Rules:**

1. **Data retrieval is its own row.** Loading modules, activities, practice sets, and questions from the backend are separate rows carrying L2 = Yes. The presentation of that data is a separate row carrying L2 = N/A.
2. **Local presentation and local interaction carry L2 = N/A.** Revealing a hint, typing an answer, triggering a recording, playing a spoken prompt, navigating previous/next, and rendering a picture clue are local capabilities.
3. **L3 = No is reserved for therapeutic capabilities** that *could* have L3 but do not yet. Upstream operations (question retrieval, speech transcription) and non-therapeutic features carry **L3 = N/A**.
4. **Backend-endpoint rows state that explicitly.** An API endpoint is not a visible UI. Where a row is a **backend endpoint**, its L1 is N/A and its L2 = Yes if the endpoint exists and responds. Frontend integration is tracked as a **separate row**.

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

### 3.5 Implemented / L1 / L2 / L3 / N/A matrix — reconciled (P1-C4)

Data retrieval rows are separate from local presentation / interaction rows. L3 is N/A where it does not apply. **Backend-endpoint rows are marked explicitly.**

| Row | Feature | Type | L1 | L2 | L3 | Notes |
|---|---|---|---|---|---|---|
| R1 | Authentication | Frontend | Yes | Yes | **N/A** | API authentication |
| R2 | Account setup — data | Frontend | Yes | Yes | **N/A** | Preferences stored via API |
| R3 | Account setup — local form | Local | Yes | **N/A** | **N/A** | Local input |
| R4 | Module data retrieval | Frontend | Yes | Yes | **N/A** | Module list from API |
| R5 | Module carousel interaction | Local | Yes | **N/A** | **N/A** | Local carousel |
| R6 | Activity data retrieval | Frontend | Yes | Yes | **N/A** | Activities and practice sets from API |
| R7 | Activity carousel interaction | Local | Yes | **N/A** | **N/A** | Local carousel |
| R8 | Question retrieval | Frontend | Yes | Yes | **N/A** | **Corrected from v3.2.1**: upstream operation, not a therapeutic assessment — L3 = N/A |
| R9 | Picture clue rendering | Local | Yes | **N/A** | **N/A** | Local render of returned asset |
| R10 | Hint interaction | Local | Yes | **N/A** | **N/A** | Local reveal of returned hint |
| R11 | Text answer entry | Local | Yes | **N/A** | **N/A** | Local text entry |
| R12 | Microphone recording | Local | Yes | **N/A** | **N/A** | Local recording |
| R13 | Speech transcription | Frontend | Yes | Yes | **N/A** | **Corrected from v3.2.1**: upstream operation, not a therapeutic assessment — L3 = N/A |
| R14 | Spoken prompt playback (manual, **device TTS**) | Local | Yes | **N/A** | **N/A** | **Corrected from v3.2.1**: implementation uses Expo Speech device TTS on prompt text, not returned audio (§4.5.4) |
| R15 | Previous / next navigation | Local | Yes | **N/A** | **N/A** | Local navigation |
| R16 | Answer evaluation UI | Frontend | **No** | **No** | **No** | Not implemented (§4.5.3) |
| R17 | Answer evaluation **backend endpoint** | **Backend endpoint** | **N/A** | **Yes** | **N/A** | Endpoint exists and responds with prototype lexical comparison. **L1 is N/A** because an endpoint is not a visible UI. L3 is N/A because the endpoint is not the therapeutic assessment. |
| R17a | Frontend evaluation integration | Frontend | **No** | **No** | **N/A** | **New in v3.2.2**: frontend does not call the endpoint yet. Milestone 1 (§4.5.3) — Proposed / Planned. |
| R18 | Therapeutic assessment | Frontend + backend | **No** | **No** | **No** | Not implemented (§4.5.3 Milestone 2) |
| R19 | Assessment persistence | Frontend + backend | **No** | **No** | **No** | Not implemented |
| R20 | Pause / resume | Local | **No** | **N/A** | **N/A** | Not implemented |
| R21 | Explicit exit | Local | **No** | **N/A** | **N/A** | Not implemented as specified |
| R22 | Session summary | Frontend | **No** | **N/A** | **N/A** | Proposed (OD-3) |
| R23 | Progress reporting | Frontend | **Yes (placeholder)** | **No** | **N/A** | `progress.tsx` placeholder card; reporting API not connected |
| R24 | Profile | Frontend | Yes | Yes | **N/A** | — |
| R25 | Settings | Frontend | Yes | Yes | **N/A** | Persists preferences; **application gaps §6.2** |
| R26 | Help | Frontend | **No** | **N/A** | **N/A** | No dedicated route |
| R27 | Therapist portal | — | **No** | **N/A** | **N/A** | Empty route stub; not an implemented interface |

**Verification:** §4.5.1 is the authoritative implementation record for the Challenge screen. §3.5 must not contradict §4.5.1. Where they differ, §4.5.1 wins and §3.5 must be corrected.

### 3.6 Dashboard action count

The dashboard currently has **eight** action-grid shortcuts including Start Training. The intent is explicit:

- **Extract Start Training** from the action grid and present it as the **dedicated Primary action** (§4.1).
- **Keep the remaining seven shortcuts** as Secondary navigation.
- **"Resume in-progress training" is not implemented** and is not part of v3.2.2's secondary objectives for §4.1.

### 3.7 Back-control and touch-target implementation gaps (P1-C7 — platform units)

Implementation gaps are recorded explicitly. **Units are per platform** (web CSS px, Android dp, iOS pt). The **interactive hit area** is distinguished from the **visible artwork** — the hit area may extend beyond the visible icon boundary.

| Screen | Back control | Current hit area | MDATE target |
|---|---|---|---|
| ModuleSelectorScreen | **Missing** — `onBack` not passed to TrainingHeader | N/A | ≥ 48 (web: CSS px / Android: dp / iOS: pt) |
| ActivitySelectorScreen | Present | 44 × 44 (native pt on iOS; dp on Android) | ≥ 48 (per platform) |
| SettingsScreen | **Missing** — no explicit back control | N/A | ≥ 48 (per platform) |
| Challenge | Present — "Return to Activities" | 40 (min height, native units) | ≥ 48 (per platform); ≥ 56 when grouped in a session-control group |
| TrainingHeader language control | Present | 40 (min height) | ≥ 48 (per platform) |

These are implementation gaps, not design gaps. Fixing them is in scope for engineering (§9.4).

---

## 4. Screen-Level Specifications

### 4.0 Visual priority framework

v1 used an undocumented scoring algorithm; v2 onward replaced it with Primary / Secondary / Supporting. v3.2.2 retains that replacement.

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
| **Start Training** | Interaction | `therapy-entry` | **Primary** | Accent fill, `type.lg`, hit area ≥ 56 (per platform), icon + label | **Proposed primary** — currently one of eight equal shortcuts |
| Profile header | Content + visual | `identity` | Secondary | Header region, `type.md`, no accent | Implemented |
| Carousel | Visual | `discovery` | Supporting | Placeholder only | Placeholder — must not compete with Start Training |
| Metrics area | Content | `metrics` | Supporting | Compact, muted, contained | Depends on reporting API (L2 partial) |
| Remaining 7 shortcuts | Interaction | `shortcuts` | Secondary | Grid, consistent sizing, hit area ≥ 48 (per platform) | Implemented |

- **Focal groups:** one Primary (`therapy-entry`). The carousel, if it later receives real content, may become the second Primary group; never a third.
- **Open item:** dashboard primary action confirmed as Start Training pending OD-2.
- **States:** default, loading (metrics), empty (no modules), error (metrics fetch failed).

### 4.2 Module selection — L1/L2, L3 N/A

- **Primary objective:** Choose a therapy module.
- **Current interaction:** **carousel** with `moduleIndex` and left/right arrows.
- **Hierarchy:** current module card Primary; carousel arrows Secondary (hit area ≥ 48 per platform); back control Supporting — **currently missing (§3.7).**
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

v3.1 converted Challenge to a feature matrix; v3.2.2 retains the matrix and reconciles it with the corrected L1/L2/L3 granularity of §3.2, including the R17/R17a split.

#### 4.5.1 Feature matrix (reconciled with §3.5)

| Capability | Row in §3.5 | Current implementation | L1 | L2 | L3 | Required next step |
|---|---|---|---|---|---|---|
| Question retrieval | R8 | Integrated | Yes | Yes | N/A | Maintain |
| Picture clue rendering | R9 | Implemented | Yes | N/A | N/A | Maintain |
| Hint interaction | R10 | Implemented | Yes | N/A | N/A | Maintain |
| Text answer entry | R11 | Implemented | Yes | N/A | N/A | **Per-question state storage** (§4.5.2) |
| Microphone recording | R12 | Implemented | Yes | N/A | N/A | Maintain |
| Speech transcription | R13 | Integrated | Yes | Yes | N/A | Maintain |
| Spoken prompt playback (manual, device TTS) | R14 | Implemented | Yes | N/A | N/A | **Manual-only for first release** (§4.5.4); device TTS, not returned audio |
| Previous / next navigation | R15 | Implemented | Yes | N/A | N/A | Preserve per-question state (§4.5.2) |
| Answer evaluation UI | R16 | **Not implemented** | No | No | No | **Proposed / Planned** — see §4.5.3 |
| Answer evaluation backend endpoint | R17 | **Implemented** (prototype lexical only) | N/A | Yes | N/A | Prototype endpoint; not a therapeutic assessment |
| Frontend evaluation integration | R17a | **Not implemented** | No | No | N/A | Milestone 1 (§4.5.3) — Proposed / Planned |
| Therapeutic assessment | R18 | **Not implemented** | No | No | No | Milestone 2 (§4.5.3) |
| Assessment persistence | R19 | **Not implemented** | No | No | No | Milestone 2 (§4.5.3) |
| Pause / resume | R20 | **Missing** | No | N/A | N/A | Implement |
| Session exit | R21 | Return navigation exists; no explicit session exit | No | N/A | N/A | Define behaviour; implement fixed-position control |
| Session summary | R22 | **Missing** | No | N/A | N/A | Product decision (OD-3) |
| Alternative-input routing | — | **Preference stored, not applied** | — | — | — | Apply `alternativeInputOn` (§6.2) |
| Preferred language | — | **Stored, not applied** — Challenge initialises to English | — | — | — | Apply saved preference via single source of truth (§6.2) |

#### 4.5.2 Answer-state model

The current defect: `changeQuestion()` calls `setQuestionIndex(nextIndex); setAnswer("");`, so entering the previous question again loses the earlier answer. V-19 asserts "entered answer restored" but the storage model must be specified.

**Required storage model:**

- Answer state is **keyed by question identity**, not held in a single shared `answer` variable.
- Example shape: `answersByQuestionId[questionId] = answer`.
- Behaviour:
  - Navigating previous/next **restores** the answer for the target question from `answersByQuestionId`.
  - Answers remain **isolated between questions** — typing a new answer for question B does not overwrite question A's stored answer.
  - Text is **not lost** on navigation.
- **Scope of persistence:** `answersByQuestionId` is **local UI state**. It is **not** persisted to the backend unless a separate persistence capability is implemented (R19). No implementation may imply backend persistence merely because local state survives question navigation.
- **Question-set change or reload:** when the question set changes, `answersByQuestionId` for that set is cleared. When a question set is updated while the user is in it, answers keyed by question IDs that no longer exist are discarded; answers for surviving question IDs are retained. Exact update-handling behaviour recorded as open work in §9.7.
- **Session expiry:** answer-state lifecycle after backend session expiry recorded as open work in §9.7; must be specified before Milestone 2 ships.

#### 4.5.3 Speech evaluation — prototype, integrity-safeguarded

`POST /api/v1/speech/evaluate` exists. `SpeechAssessmentService.ts` describes its evaluation as **prototype lexical comparison only**:

- Compares normalised words.
- Returns `EXACT_MATCH`, `PARTIAL_MATCH`, or `NO_MATCH`.
- **Does not** produce a therapeutic score.

**Current status (authoritative — do not conflate the rows):**

| Item | Row in §3.5 | Status |
|---|---|---|
| Evaluation UI in Challenge | R16 | **Not implemented** |
| Evaluation backend endpoint | R17 | **Implemented** (prototype lexical comparison) |
| Frontend evaluation integration | R17a | **Not implemented** |
| Therapeutic assessment (therapeutic score, therapist rules) | R18 | **Not implemented** |
| Assessment persistence | R19 | **Not implemented** |

**Integrity concern:** the current endpoint accepts a **client-provided target**:

```json
{ "answer": "apple", "target": "apple", "language": "en" }
```

The server does not independently resolve the expected answer from a trusted published question. This is acceptable for a prototype demonstration but **must not be trusted for therapeutic scoring, XP awards, or clinical progress updates**.

**Milestone 1 — Prototype integration (Proposed / Planned, not current functionality).**

- **Status label:** Proposed / Planned.
- Integrate the existing endpoint into the Challenge for prototype lexical comparison.
- Display the returned match result with neutral, non-punitive feedback (DR-A11Y-06).
- **Do not** treat the result as a therapeutic assessment.
- **Do not** drive progression, XP, or clinical reporting from a Milestone 1 result.
- **Do not** create a trusted assessment record merely because the endpoint returns `EXACT_MATCH`. The client-supplied `target` makes such a record untrustworthy.
- L3 remains **No** for the Challenge until Milestone 2 completes.

**Milestone 2 — Production therapeutic assessment (Planned).**

- Resolve the question from a trusted question ID, not a client-supplied target.
- Resolve the expected answer **server-side**.
- Apply therapist-configured assessment rules.
- Persist the assessment result.
- Reflect the result in session state.
- Connect progression and session reporting.

**Rule:** production assessment **must not trust a client-supplied expected answer**. Milestone 2 must replace the client-supplied `target` with a server-resolved expected answer.

Relevant files (for engineering reference):

- `src/express-test/src/main/http/controllers/speechController.ts`
- `src/express-test/src/application/speech/SpeechAssessmentService.ts`

#### 4.5.4 Voice playback — manual-only, device TTS (P1-C6)

**Corrected (P1-C6):** the current implementation does **not** play returned audio. It calls **Expo Speech** device text-to-speech on the prompt text:

```ts
Speech.speak(spokenPrompt, {
  language: language === "ms" ? "ms-MY" : "en-US",
  rate: 0.82,
});
```

That is:

- **Prompt text** is passed to the device TTS engine.
- **Playback is manually triggered** by the patient.
- The **locale** is selected from the active language.
- The **rate is hardcoded at 0.82** — it does not yet consume the saved `audioRate` preference.
- **Saved voice, rate, and volume preferences are not yet applied.**
- `voiceDisabled` is **not yet consulted**.

**Consequence for the spec:** `preferredVoiceId` selects a **supported TTS voice** — it does **not** imply that the app receives a pre-generated audio asset. Language support and voice-preference integration must be described in TTS terms.

**Decision (unchanged from v3.1, v3.2, v3.2.1):** **manual-only playback for the first release.** No `autoPlayPrompt` field exists in persisted preferences. Automatic playback is not a supported option until:

- a product decision introduces an explicit preference with its own storage and UI, and
- clinical validation has confirmed that automatic speech does not pressure the patient.

When `voiceDisabled` is true, manual playback must be hidden or clearly inactive with an accessible explanation. Manual playback must use saved `preferredVoiceId`, `audioRate`, and `audioVolume` once preference integration is implemented (§6.2, §9.4).

#### 4.5.5 Screen table

| Element | Type | Group | Priority | Treatment | Implementation |
|---|---|---|---|---|---|
| Picture clue | Visual | `stimulus` | **Primary** | Dominant area; high contrast; generous whitespace | L1 |
| Answer input (text) | Interaction | `answer` | **Primary** | Largest interactive, hit area ≥ 56 (per platform), clear boundary | L1; per-question state model pending (§4.5.2) |
| Microphone recording control | Interaction | `answer` | **Primary** | Grouped with text; hit area ≥ 56 (per platform); explicit idle / recording / transcribing / result states | L1 |
| Spoken prompt playback (manual, device TTS) | Interaction | `stimulus-support` | Secondary | Manual only (§4.5.4); icon + label; visible playback state | L1 |
| Hint control + content | Interaction + content | `scaffold` | Secondary | Reveals progressively; never auto-reveals | L1 |
| Previous / next question | Interaction | `navigation` | Secondary | Consistent positions; disabled at bounds | L1; per-question state pending (§4.5.2) |
| Question position indicator | Content | `progress` | Supporting | Non-lexical preferred | L1 |
| **Pause** | Interaction | `session-control` | Supporting | Fixed position; hit area ≥ 48 (per platform); ≥ 56 when grouped in session-control | **Not implemented (planned)** |
| **Exit** | Interaction | `session-control` | Supporting | Fixed position; hit area ≥ 48 (per platform); ≥ 56 when grouped in session-control | **Not implemented as specified (planned)** |

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

### 4.11 Therapist portal — L1 No, L2 N/A, L3 N/A

The route group exists with an **empty entry screen** — not an implemented interface. Out of scope for this specification (A2).

---

## 5. Design System and Tokens

### 5.1 Colour — OPEN DECISION (OD-1)

Unresolved: v1 proposed warm off-white + green accent; current implementation uses cool white + blue accent. **Product decision.** Reviewer recommendation: retain the current blue temporarily; validate alternatives in the accessibility review.

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

### 5.2 Typography — Poppins, platform-specific units (P1-C7)

**Typeface:** Poppins (A4). User text-size preference overrides the fixed scale (§6.2).

**Implementation requirement:** registering Poppins font faces at the Expo root does **not** apply them to every `Text`. A shared typography wrapper exists at `src/expo-test/src/shared/ui/native.tsx`, but several patient-facing screens still import `Text` directly from `react-native` — see §9.4 for the gap register.

Requirement:

- All patient-facing text renders through the shared typography wrapper (or an equivalent single primitive applying Poppins and the tokens below).
- Direct unstyled RN `Text` on patient-facing content is a defect (V-07).
- If Poppins fails to load, layout remains usable at the same sizes and line heights with a neutral sans-serif fallback (V-08).

**Type scale — platform-specific units (corrected, P1-C7):**

Web uses CSS px; Android uses sp; iOS uses pt. The numeric values are **intended to produce approximate visual parity across platforms** at typical mobile viewing distances. The implementation should map each token to its platform unit explicitly; a token value is not a literal substitution from one platform to another.

| Token | Web (CSS px) | Android (sp) | iOS (pt) | Weight | Line height | Usage |
|---|---|---|---|---|---|---|
| `type.lg` | 28–32 | 28–32 | 28–32 | 600 | 1.25–1.3 | Primary emphasis, Primary actions |
| `type.md` | 22–24 | 22–24 | 22–24 | 500 | 1.4–1.5 | Secondary headings, answer labels |
| `type.sm` | 18–20 | 18–20 | 18–20 | 400–500 | 1.5 | Supporting text, secondary labels |
| `type.xs` | 16 | 16 | 16 | 400 | 1.5 | Metadata only — never instructions |

**Rules:**

- **16 (per platform unit) is the absolute minimum** for patient-facing text.
- The 15 px caption role from v1 is removed.
- Line height ≥ 1.5× for anything at `type.sm` and below.
- No negative letter spacing. No all-caps or italics for extended passages.
- **Verification must measure the rendered font size** on each platform, not merely the declared value in the StyleSheet.

### 5.3 Priority → treatment tokens (platform units)

The interactive **hit area** is distinct from the **visible artwork**. The hit area may extend beyond the visible icon or button boundary.

| Token | Primary | Secondary | Supporting |
|---|---|---|---|
| Type step | `type.lg` | `type.md` | `type.sm` / `type.xs` |
| Weight | 600 | 500 | 400–500 |
| Contrast | accent or strongest neutral | strong neutral | muted neutral (≥ 4.5:1) |
| Whitespace | ≥ 32 | ≥ 24 | ≥ 16 |
| Corner radius | 20–24 | 16–20 | 12–16 |
| **Min hit area (interactive)** | **≥ 56 (web: CSS px / Android: dp / iOS: pt)** | **≥ 56 (per platform)** | **≥ 48 (per platform)** |
| Icon artwork size | 28–32 | 24–28 | 20–24 |

### 5.4 Spacing and geometry

| Token | Value |
|---|---|
| `space.xs` | 8 |
| `space.sm` | 16 |
| `space.md` | 24 |
| `space.lg` | 32 |
| `space.xl` | 48 |
| `radius.button` | 20 |
| `radius.card` | 24 |
| `touch.min` | 48 (web: CSS px / Android: dp / iOS: pt) |
| `touch.primary` | 56 (web: CSS px / Android: dp / iOS: pt) |

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

### 6.1 Touch-target standards (platform units)

| Reference | Requirement | Unit |
|---|---|---|
| WCAG 2.2 AA — SC 2.5.8 | 24 × 24 | CSS px, with exceptions |
| WCAG 2.2 AAA — SC 2.5.5 | 44 × 44 | CSS px |
| Apple Human Interface Guidelines | 44 × 44 | pt (iOS / iPadOS default controls) |
| Google — Android guidance | 48 × 48 | dp |
| **MDATE requirement (DR-A11Y-01)** | **48 × 48 (or ≥ 56 when grouped in session-control)** | **Web: CSS px · Android: dp · iOS: pt** |

DR-A11Y-01 is stricter than WCAG 2.2 AA and matches Google's 48 dp guidance while being tighter than Apple's 44 pt baseline. Verified per platform:

- **Web:** CSS px including the interactive hit area, at 100% zoom.
- **Android:** dp, measured on the hit area.
- **iOS:** pt, measured on the hit area, and additionally checked against Apple's 44 pt baseline.

**Hit area vs artwork:** the interactive hit area is what is measured. The visible artwork may be smaller, provided the hit area is expanded to the MDATE target with transparent padding.

Existing implementation gaps are recorded in §3.7.

### 6.2 Accessibility preferences — storage, application, alternative input, language (P2-C10)

Account setup persists the following. **Application throughout the app is a separate requirement.**

| Preference | Values | Storage / UI | Applied in Challenge | Application requirement |
|---|---|---|---|---|
| Text size | small / medium / large | Yes | **Missing** | Scale the type scale. Never below 16 per platform unit at any setting. No clipping at largest. |
| Contrast | normal / high | Yes | **Missing** | High contrast raises contrast above default (not inversion only). Passes grayscale check. |
| Alternative input | on / off | Yes | **Missing** | See permission lifecycle below. |
| Preferred voice | voice selection | Yes | **Missing** | Selects a **supported TTS voice** (§4.5.4) — not a pre-generated audio asset. |
| Speech rate | adjustable | Yes | **Missing** — hardcoded 0.82 | Playback honours stored rate. |
| Volume | adjustable | Yes | **Missing** | Playback honours stored volume; must not silently override system mute. |
| Voice disabled | enabled / disabled | Yes | **Missing** — `voiceDisabled` not consulted | When disabled, manual playback hidden or clearly inactive with accessible explanation (§4.5.4). |
| **Preferred language** | language code | **Yes** | **Missing** — module / activity / challenge initialise local language state to English | **Single source of truth: the saved preference** (see below). |

**Alternative-input semantics and permission lifecycle (unchanged from v3.2.1):**

**`alternativeInputOn = false` (initial state):**
- Microphone input is **unavailable in the Challenge UI**.
- The Challenge screen does **not** initiate a microphone permission request.
- Text input remains available — the text path is never removed by the toggle.
- Other configured input surfaces are hidden.

**`alternativeInputOn = true`:**
- Microphone input is **offered** in the Challenge UI.
- Microphone **permission is requested when the user first activates** the microphone control — not at screen load, not at app launch.
- Text input remains available.
- Any other configured input surfaces are exposed when supported by the platform.

**Permission denied (independent of toggle):**
- Text input remains available.
- Explanation shown in plain language.
- A route to change the permission (system settings) is provided.

**Permission permanently denied:**
- Microphone control is present but clearly inactive, with an accessible explanation and a single action opening system settings.

**Invariants the toggle must not affect:**
- **Microphone OS permission state** — permissions are granted or denied by the OS, independent of the toggle.
- **Voice output preferences** — playback follows `voiceDisabled`, `preferredVoiceId`, `audioRate`, `audioVolume` independently.
- **Preferred language** — content language is independent of the toggle.

**Rationale:** the toggle expresses the user's answer-method preference. It must not become a safety switch that removes the only usable answer channel, and it must not silently control unrelated preferences.

**Product owner confirmation required (OD-8)** before implementation.

**Preferred-language propagation — single source of truth:**

The saved `preferredLanguage` must be the **single source of truth** for language throughout the app. Individual screens **must not initialise their own local language state** (current defect: module / activity / challenge initialise to English).

The saved preference controls:

- Module and activity **labels**.
- **Question prompts** (text and any returned audio).
- **Hints**.
- **Speech transcription language** (language code passed to the speech API).
- **Spoken prompt language** (locale passed to device TTS — see §4.5.4).
- **Speech evaluation language** (language code passed to `/api/v1/speech/evaluate`).

**Propagation rule:** reading the saved preference is done once at the app or session boundary (for example a language context or session store) and consumed by every screen. No screen may read a default constant in its own initialiser.

**Mid-session language change — specified (P2-C10):**

When the user changes `preferredLanguage` while inside a Challenge:

| State | Behaviour |
|---|---|
| **Currently displayed question** | Remains in the **original** language until the next content fetch. The change takes effect at the next fetch or navigation. |
| **Already revealed hints** | Remain in the original language. They are not re-fetched. |
| **Text entered by the patient** | **Preserved verbatim.** No auto-translation. |
| **Active recording** | Preserved. Transcription language is captured at the time recording started; the new language takes effect for the **next** recording. |
| **Currently speaking prompt** | Completed in the original language. The next prompt uses the new language. |
| **Speech evaluation language** | Uses the language active when the answer was submitted. |

**Rationale:** mid-session changes must not destroy work in progress. The change propagates on the next opportunity (next content fetch, next recording, next prompt) rather than retroactively.

**Remaining open items** recorded in §9.7.

**Preference application rules:**

- Preferences take effect immediately or offer an immediate preview.
- Preferences persist across sessions (confirmed for storage).
- Every screen specification states largest-text and high-contrast behaviour. Default: reflow, no clip, no text below the platform floor.
- No screen may depend on colour alone at either contrast setting.

### 6.3 Communication support (P2-C8)

**DR-A11Y-02 — Multimodal communication (corrected, P2-C8):**

v3.2.1 used "multimodal redundancy" to mean icon/picture + text + audio. **Icons, pictures, and text are all delivered through the visual channel.** They provide **visual redundancy**, not separate sensory modalities. The distinction matters because requiring audio for every control would not implement cross-modal support — it would merely add clutter.

**Terminology adopted in v3.2.2:**

- **Visual redundancy** — an icon or picture accompanies a short text label. Important instructions, actions, and feedback use visual redundancy.
- **Cross-modal support** — visual content is supplemented by an **audio, gesture, or other non-visual channel** where useful and supported by the patient's preferences. Cross-modal support is applied per the Supported Conversation principle — adapted to the individual, not mechanically required for every control.

**DR-A11Y-02 (revised):** *Important* instructions, *important* actions, and *important* feedback must use **visual redundancy** (icon/picture + short label). **Cross-modal support** (audio via device TTS, gesture support, or other channels) is applied where voice output is enabled and where it materially helps the individual — not as a mechanical requirement on every element.

**DR-A11Y-03 — Response time.** No arbitrary response deadline (§7.4).

**DR-A11Y-04 — Plain language.** Labels are single words or short phrases. Instructional text targets a readability grade of 5 or lower. No boilerplate, no marketing copy.

**DR-A11Y-05 — Single-action interaction.** No double-tap, long-press, drag, or multi-finger gestures.

**DR-A11Y-06 — Error tolerance.** Incorrect answers produce neutral, non-punitive feedback. Retry and exit are always available.

### 6.4 Keyboard and screen reader (P2-C9)

**Web:**

- All interactive elements reachable and operable by keyboard, in an order matching visual order.
- Focus always visible (`color.focus` ≥ 3:1 against adjacent colours).
- **Semantic HTML heading hierarchy** — `h1` for the Primary message, `h2` for Secondary groups. Not styled-only.
- Every icon-only control has an accessible name (`aria-label`).
- Live state changes announced via live region.

**Native (iOS / Android):**

- React Native does not expose HTML heading elements. Heading semantics are expressed via **platform-supported heading accessibility roles** — for example `accessibilityRole="header"` (React Native) and the corresponding platform-native semantics (VoiceOver / TalkBack heading navigation).
- Every interactive element is reachable by the platform screen-reader.
- Every icon-only control has an `accessibilityLabel`.
- Live state changes announced via the platform accessibility API.

**Both:**

- Screen reader order matches §4 priority order.
- The intended reading hierarchy is consistent across platforms even though the mechanism differs.

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

Microphone permission required for audio answer path (§4.5), **only when the microphone is offered**. The lifecycle is defined in §6.2 and summarised here.

- **Request is contextual** — permission is requested on **first microphone activation by the user** after `alternativeInputOn = true`.
- **No request occurs when the microphone is hidden.** With `alternativeInputOn = false`, the Challenge screen does not initiate a microphone permission request.
- **On denial** — text path remains usable; denial stated in plain language; route to change the setting.
- **On permanent denial** — microphone present but clearly inactive, with accessible explanation and a single action opening system settings.

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

### 7.5 Recovery paths — references corrected (P1-C3)

v3.2.1 referenced incorrect test IDs in this section. The mapping has been corrected. New **V-27** has been added for network failure during transcription.

| Recovery path | Verified by |
|---|---|
| Session expiry during a challenge | **V-25** (and its conformance counterpart V-13) |
| Network failure during transcription | **V-27** |
| Broken parent chain on deep link | **V-23** and **V-24** |

Behaviour expected of each:

- **Session expiry (V-25):** preserve the current answer; present a single recovery action; return to the same question on success. Never silently discard an answer mid-recording or mid-transcription.
- **Network failure during transcription (V-27):** preserve the recorded audio state; allow retry or fall back to text; **do not lose text already entered by the patient**. The in-progress recording outcome must be stated explicitly.
- **Broken parent chain (V-23, V-24):** render the nearest valid parent, or a plain-language error state with a single safe action. Never a blank screen or unhandled error.

---

## 8. Platform Implementation Rules

### 8.1 Web viewport

**Current implementation:** `AppViewport` defaults to 412 × 892.  
**v3.2.2 target:** 430 CSS px maximum width with **fluid height** — no fixed aspect ratio. Reconciliation pending OD-4.

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

- Same component tree across platforms; differences confined to safe areas, permission flows, speech APIs, and screen-reader semantics (§6.4).
- No platform-specific navigation model. Hierarchy in §3.3 identical across platforms.
- Web keyboard access and focus visibility required (§6.4); must not be broken on web.

### 8.3 Responsive behaviour

Hierarchy must not invert between 320 px and 430 px. Text must never fall below the platform floor at any width or text-size preference. Touch targets never below DR-A11Y-01 at any width.

---

## 9. Verification and Acceptance Criteria

### 9.1 Composition checks

| ID | Check | Method | Pass condition |
|---|---|---|---|
| V-01 | Squint test | Blur / reduce detail per screen | Primary group identifiable first; no Secondary draws the eye first |
| V-02 | Grayscale test | Grayscale render | Primary / Secondary / Supporting distinguishable without colour |
| V-03 | Reading sequence | Observe natural scan order | Matches §4 priority order |
| V-04 | Gestalt grouping | Proximity, similarity, shared regions | Same-group elements read as related; unrelated groups ≥ 24 apart |
| V-05 | Responsive | 320 / 375 / 412 / 430 widths; largest text; high contrast | No clipping, no overlap, no below-floor text, no below-target hit area |
| V-06 | Accessibility | Contrast audit; keyboard-only pass; screen reader pass (web and native) | All §6.4 requirements met on both web and native |

### 9.2 Implementation conformance

> **Gate note (P0-C2):** V-07 through V-27 belong to **Gate C — Engineering implementation acceptance** (§11). They apply **when the corresponding functionality is implemented**. They do **not** block documentation approval (Gate A) and they do not apply to this document's internal consistency. V-17 is the only V-test that belongs to Gate A, because it verifies the document itself.

| ID | Requirement | Verification | Gate |
|---|---|---|---|
| V-07 | Poppins applied to all patient-facing text | Code inspection: no unstyled RN `Text` on patient-facing screens; rendered font confirmed on web and native | C |
| V-08 | Font fallback usable | Block Poppins network request; confirm layout holds | C |
| V-09 | No patient-facing text below 16 per platform unit (web CSS px / Android sp / iOS pt) at any preference | **Rendered** font-size audit at small / medium / large on all three platforms. **Expected to fail against current implementation** (§9.4) | C |
| V-10 | Hit areas meet DR-A11Y-01 per platform | Automated audit + manual device measurement. Units: web CSS px, Android dp, iOS pt. **Expected to fail against current implementation** (§3.7) | C |
| V-11 | Preferences persist and take effect | Change each §6.2 preference, restart, confirm persisted **and applied** | C |
| V-12 | No visible countdown on any untimed module | Screen inspection | C |
| V-13 | Session expiry produces explained, recoverable state | General conformance check; **specific test scenario is V-25** | C |
| V-14 | Microphone denial leaves text path intact | Deny permission; confirm text remains usable and explanation shown | C |
| V-15 | Reduced motion honoured | Enable platform setting; confirm no non-essential motion | C |
| V-16 | Planned features labelled | Inspect Progress, Session summary, Help; confirm status matches §3.5 | C |
| **V-17** | **No U+00BF INVERTED QUESTION MARK characters in this document** | **Automated scan. Target codepoint constructed at test time (0x00BF). Expected count: zero.** | **A** |
| **V-18** | **Preference integration verified** | **Each row of §6.2 gap table verified as applied in the Challenge, including `preferredLanguage`** | C |
| **V-19** | **Answer state preserved across questions per §4.5.2** | **Navigate previous/next in Challenge; entered answer restored from `answersByQuestionId[questionId]`; answers isolated between questions; local-only persistence confirmed** | C |
| **V-20** | **Preferred-language single source of truth** | **Set `preferredLanguage` to each supported language; confirm module labels, question prompts, hints, transcription language, TTS prompt language, and evaluation language all follow the saved preference. No screen initialises its own language to a default.** | C |
| **V-21** | **Alternative-input permission lifecycle** | **With `alternativeInputOn = false`: no microphone permission prompt appears in Challenge; microphone control not offered. With `= true`: microphone offered; permission requested only on first activation. Denial and permanent-denial behave per §7.3.** | C |
| **V-22** | **Milestone 1 evaluation is not trusted as assessment** | **Submit a prototype evaluation that returns `EXACT_MATCH`; confirm no progression, XP, clinical record, or assessment persistence is created. Result displayed as neutral feedback only.** | C |

### 9.3 Validation prerequisite

Contrast, layout, and preference behaviour can be verified by a developer. **Aphasia-friendliness cannot.** Validation with people with aphasia and an appropriate clinician is a required prerequisite before any claim of aphasia-friendliness, and its results must be recorded against DR-A11Y-07 and §6.2 before those requirements are considered confirmed. Until then, this document's accessibility requirements are design intent, not validated outcome.

### 9.4 Existing implementation gap register — typography expanded (P1-C5)

Recorded as facts about the current codebase, not as specification requirements. Inputs to engineering tickets. Units are per platform (web CSS px, Android sp, iOS pt).

**Navigation and controls:**

| Gap | Where | Required corrective (engineering) |
|---|---|---|
| Missing back control | `ModuleSelectorScreen` (`onBack` not passed to TrainingHeader) | Pass `onBack` and render back control per §3.4 |
| Missing back control | `SettingsScreen` | Add explicit back control per §3.4 |
| Hit area below target | `TrainingHeader` back button (44 × 44 native units) | Enlarge to ≥ 48 (per platform) |
| Hit area below target | `TrainingHeader` language control (40 min height) | Enlarge to ≥ 48 (per platform) |
| Hit area below target | `ChallengeScreen` "Return to Activities" (40 min height) | Enlarge to ≥ 48; ≥ 56 if grouped in session-control |

**Typography — font-size violations (expanded, P1-C5):**

v3.2.1 listed only one representative value per component. That understated the violations. The audit below reflects the v3.2.1 review findings against the current `main` branch. Exact style names and counts should be verified again at remediation time; the point is that the gap register must list **every** below-minimum declaration, not one representative value per component.

`ChallengeScreen.tsx` — **19 style declarations** below the 16 (per platform unit) floor. Named examples from the review:

| Style name | Current size | Minimum | Required corrective |
|---|---|---|---|
| `promptEyebrow` | 10 | 16 | Enlarge to `type.xs` (16) or restructure layout |
| `hintTitle` | 10 | 16 | Enlarge to `type.xs` |
| `pointsNote` | 10 | 16 | Enlarge to `type.xs` |
| `scoreUnit` | 11 | 16 | Enlarge to `type.xs` |
| `imageCardLabel` | 11 | 16 | Enlarge to `type.xs` |
| `progressCaption` | 12 | 16 | Enlarge to `type.xs` |
| `answerLabel` | 12 | 16 | Enlarge to `type.xs` |
| `keyboardButtonText` | 15 | 16 | Enlarge to `type.xs` |
| `nextButtonText` | 15 | 16 | Enlarge to `type.xs` |
| *(remaining 10 declarations)* | 10–15 | 16 | Full audit required at remediation |

`TrainingHeader.tsx` — **2 style declarations** below the floor:

| Style name | Current size | Minimum | Required corrective |
|---|---|---|---|
| *(language control label)* | 12 | 16 | Enlarge to `type.xs` |
| *(header secondary text)* | 15 | 16 | Enlarge to `type.xs` |

`DashboardActionGrid.tsx` — **1 style declaration** below the floor:

| Style name | Current size | Minimum | Required corrective |
|---|---|---|---|
| *(grid action label)* | 10 | 16 | Enlarge to `type.xs` or restructure layout |

**Total known violations: 22.** V-09 verifies the corrected state on all platforms by measuring rendered font size, not the declared StyleSheet value.

**Typography — implementation gaps:**

| Gap | Where | Required corrective (engineering) |
|---|---|---|
| Direct RN `Text` bypassing shared typography wrapper | Patient-facing screens importing `Text` from `react-native` instead of `src/expo-test/src/shared/ui/native.tsx` | Replace direct imports with the shared wrapper; audit each patient-facing screen for Poppins and type-token conformance |
| No rendered-font verification on web | Web build | Confirm rendered font is Poppins at small / medium / large text preference; include in V-07 |

**Preference application gaps:**

| Gap | Where | Required corrective (engineering) |
|---|---|---|
| Answer state reset | `ChallengeScreen.tsx` `changeQuestion()` | Replace with `answersByQuestionId[questionId]` model per §4.5.2 |
| Preference not applied — text size | Challenge | Consume saved text size (§6.2) |
| Preference not applied — contrast | Challenge | Consume saved contrast (§6.2) |
| Preference not applied — alternative input | Challenge | Consume `alternativeInputOn` (§6.2) |
| Preference not applied — voice / rate / volume / voiceDisabled | Challenge | Consume saved values; replace hardcoded TTS rate 0.82 (§6.2, §4.5.4) |
| Preference not applied — preferred language | Module / Activity / Challenge | Consume saved `preferredLanguage` via single source of truth (§6.2) |

### 9.5 Deep-link and recovery tests (corrected references, P1-C3)

| ID | Test | Expected result | Gate |
|---|---|---|---|
| **V-23** | Deep link directly to `q-sets/[qSetId]` without visiting parent routes | Renders full parent chain, or redirects to a safe recovery screen. Never a blank screen or unhandled error. | C |
| **V-24** | Deep link directly to `q-sets/[qSetId]` with an invalid / deleted ID | Plain-language error state with a single safe action (return to nearest valid parent). Never a blank screen. | C |
| **V-25** | Simulate backend session expiry mid-challenge | Current answer preserved; plain-language explanation shown; single recovery action returns to same question on success. *(Specific test scenario for V-13.)* | C |
| **V-27** | Simulate network failure during transcription | Recorded audio state preserved; user can retry or fall back to text; **entered text is not lost**. | C |

*(V-26 — answer integrity — is listed in §9.6.)*

### 9.6 Answer-integrity acceptance test

| ID | Test | Expected result | Gate |
|---|---|---|---|
| **V-26** | Submit a request to `/api/v1/speech/evaluate` with a client-supplied `target` that differs from the actual question's expected answer | Milestone 1: prototype endpoint may return a match against the client `target`; **no** progression, XP, or clinical reporting is driven from the result. Milestone 2: the request is rejected or the server ignores the client `target` and resolves the expected answer from the question ID. | C |

**Gate:** production assessment (Milestone 2) must not ship while V-26 fails for the client-supplied `target`.

### 9.7 Open verification work — recorded, not resolved

These are recorded as open work so they are not silently omitted. They do not block documentation approval (Gate A) but must be addressed before the corresponding milestone ships.

| Item | Blocks |
|---|---|
| Answer-state lifecycle after backend session expiry (§4.5.2) | Milestone 2 |
| Behaviour when a question set is updated while the user is inside it (§4.5.2) | Milestone 2 |
| Which Challenge UI states are local vs require backend confirmation | Milestone 2 |
| Mid-session language change — the specified transitions in §6.2 cover the primary cases; edge cases (e.g. language change during a transcribing recording, language change between prompt playback and next activation) recorded here | First release after OD-9 |
| Synchronising the gap register (§9.4) with the codebase after engineering tickets are closed | Ongoing |
| Full audit of the remaining 10 unnamed `ChallengeScreen.tsx` font-size declarations below 16 | Gate C — V-09 |

---

## 10. Open Decisions, Assumptions and References

### 10.1 Open decisions

| ID | Decision | Owner | Priority | Reviewer recommendation | Blocks |
|---|---|---|---|---|---|
| OD-1 | Blue vs green palette | Product | High | Retain existing blue temporarily; validate alternatives | §5.1, all screens |
| OD-2 | Start Training as dashboard primary | Product | High | Approve | §4.1 |
| OD-3 | Help and Session Summary scope | Product | Medium | Defer dedicated screens; retain in-screen help | §4.9, §4.10, §3.5 |
| OD-4 | 412 vs 430 viewport | Engineering + Product | Medium | Adopt fluid height, 430 max width | §8.1 |
| OD-5 | Left-handed / mirrored layout preference | Product | Low | Defer | DR-A11Y-07 |
| OD-6 | Whether any therapy module legitimately requires timing | Clinical + Product | Medium | Only time a module when clinically justified | §7.4 |
| OD-7 | Whether the original visual hierarchy algorithm is a project deliverable | Product | Medium | Retain Primary / Secondary / Supporting | §4.0 |
| OD-8 | Alternative-input semantics (refined §6.2) | Product | High | Confirm behaviour before implementation | §4.5, §6.2 |
| OD-9 | Preferred-language propagation (refined §6.2) | Product + Engineering | High | Apply saved language globally via single source of truth | §6.2, §4.5.1 |

### 10.2 Prerequisites and blockers — traceability and workflow (P0-C1)

| Item | Type | Priority |
|---|---|---|
| Resolve OD-1 colour palette | Product decision | High |
| Confirm OD-2 dashboard primary | Product decision | High |
| Confirm OD-8 alternative-input semantics | Product decision | High |
| Resolve OD-9 preferred-language application | Product + Engineering | High |
| Establish authoritative research references in-repo | Evidence prerequisite | High |
| Validate accessibility with people with aphasia and a clinician | Validation prerequisite | High |
| Resolve OD-3 Help / Session summary scope | Product decision | Medium |
| Obtain original visual hierarchy algorithm, or approve §4.0 | Documentation dependency | Medium |
| **Include HLD/SRS in version control or provide stable in-repo references** | **Documentation prerequisite** | **High** |
| Resolve OD-4 shell dimensions | Engineering + Product | Medium |

**Traceability gap:** the HLD and SRS referenced in prior project decisions are **not version-controlled here**. This limits verification of architectural and product decisions that this specification depends on, including:

- The `AssessmentResult` contract (referenced in §4.5.3 Milestone 2).
- Session lifecycle (referenced in §7.4).
- Therapist-configured assessment rules (referenced in §4.5.3).
- Immutable published content (referenced in §4.5.3).
- Progression and XP rules (referenced in §4.5.3).

**This specification must not become the accidental source of truth for backend architecture that is already locked elsewhere.** Either the HLD and SRS are added to the repository, or stable references (permanent commit SHAs, external URLs with archiving) are recorded here. Until either is done, §4.5.3 Milestone 2, §7.4, and any other HLD-dependent requirement are **provisional**.

**Repository documentation inventory (actual state):** `docs/` currently contains `design-spec.md` (v1), `design-spec-v2.md`, `design-spec-v3.md`, `design-spec-v3.1.md`, `design-spec-v3.2.md` (review snapshot at `9d055247…`), `design-spec-v3.2.1.md` (review snapshot at `ac33c4a1…`), and this file (`design-spec-v3.2.2.md`) once committed.

**Workflow note (P0-C1):** the recommended workflow for **future substantive revisions** (beyond v3.2.2) is to develop on a dedicated review branch and merge to `main` only after Gate A (§11) passes. v3.2.2 itself is a targeted correction of a review of the previous snapshot, so it is committed directly to `main` for the same reason v3.2.1 was — the review is against a stable file, and the corrected document is the reviewable artefact. Documenting a workflow that has not actually happened is not acceptable; v3.2.2 records what happened.

**Canonical replacement plan (unchanged, contingent on Gate A passing and the traceability gap being closed):**

```
docs/
├── design-spec.md              (canonical = content of design-spec-v3.2.2.md, once approved)
└── archive/
    ├── design-spec-v1.md       (current design-spec.md)
    ├── design-spec-v2.md
    ├── design-spec-v3.md
    ├── design-spec-v3.1.md
    ├── design-spec-v3.2.md     (review snapshot at 9d055247…)
    └── design-spec-v3.2.1.md   (review snapshot at ac33c4a1…)
```

No documentation file is deleted.

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
- React Native Accessibility — `accessibilityRole="header"` and platform screen-reader navigation.  
  https://reactnative.dev/docs/accessibility

References must be mirrored into version control (§10.2) for traceability. External citations are directional guidance, not substitute clinical validation.

---

## 11. Execution Plan — three approval gates (P0-C2)

v3.2.1 used a single "Complete" status per stage and a branch merge gate that required implementation tests despite a documentation-only change boundary. v3.2.2 separates the gates.

### 11.1 Gate A — Documentation approval

**Scope:** this document's internal consistency, correct section references, traceability and scope review, and encoding.

**Required to pass:**

- V-17 passes (zero U+00BF occurrences).
- All section cross-references (§7.5, §9.2, §9.5, §9.6, §10.x) resolve correctly.
- Revision ledger and inventory match the actual repository state.
- No contradictory statements between sections.
- All items marked "Proposed" / "Planned" are consistent across §3.5, §4.5.1, §9.4.

**Gate A blocks documentation approval. Gate A does not require any engineering implementation.**

### 11.2 Gate B — Product and accessibility approval

**Scope:** product decisions resolved; accessibility validated with people with aphasia and a clinician.

**Required to pass:**

- OD-1, OD-2, OD-3, OD-8, OD-9 resolved by the relevant owner.
- D3 usability validation completed and recorded per §9.3.
- DR-A11Y-07 placement validated in the same usability testing.

**Gate B does not block documentation approval.** It blocks promotion of this specification to a **validated design** and blocks any claim of aphasia-friendliness.

### 11.3 Gate C — Engineering implementation acceptance

**Scope:** the codebase conforms to the specification.

**Required to pass:**

- V-07 through V-27 pass against the code.
- V-09, V-10 (currently expected to fail — see §3.7 and §9.4) pass after the engineering tickets close.
- §9.4 gap register is synchronised with the codebase.
- HLD/SRS traceability gap (§10.2) is closed.

**Gate C does not block documentation approval.** It blocks declaring the implementation complete.

### 11.4 Stage status (per-gate)

| Stage | Description | Gate A | Gate B | Gate C |
|---|---|---|---|---|
| 1 | Document audit: specification, Expo routes, components, platform constraints, accessibility preferences | Complete | N/A | N/A |
| 2 | Information architecture: carousels and embedded practice sets; L1/L2/L3/N/A reconciled; therapist portal status corrected; back-control and touch-target gaps recorded | Complete | Pending OD-2 | N/A |
| 3 | Design requirements: typography, colour, layout, touch targets, accessibility preferences, audio, motion, acceptance criteria | Complete | Pending OD-1, OD-8, OD-9 | N/A |
| 4 | Screen specifications: loading, empty, error, recovery; Challenge feature matrix with answer-integrity milestones | Complete | Pending OD-3 | N/A |
| 5 | Verification and documentation review: traceability, references, platform verification, consistency review, encoding correction | **Complete in v3.2.2 subject to V-17 passing** | Pending | Pending V-07 through V-27 |

### 11.5 Approval statement

This document may be approved as a design specification when **Gate A passes**. Gates B and C are tracked separately and are **not** required for documentation approval.

**Next step:** confirm Gate A (V-17 and cross-reference review). Then, in parallel and on their own timelines:

- Product owners resolve OD-1, OD-2, OD-3, OD-8, OD-9 (Gate B).
- Clinical validation with people with aphasia and a clinician is scheduled and completed (Gate B).
- Engineering tickets open against the §9.4 gap register and V-07 through V-27 (Gate C).

Until Gate A passes, this document remains **Draft — Pending design decisions and validation**. On Gate A approval, `design-spec-v3.2.2.md` replaces `design-spec.md` as the canonical specification; v1, v2, v3, v3.1, v3.2, and v3.2.1 move to `docs/archive/`.
