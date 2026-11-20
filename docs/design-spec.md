# Design Specification: MDATE-P-2 ¿ Aphasia Therapy Companion

**Document status:** Implementation-ready  
**Audience:** Frontend engineer (React Native / Expo web, iOS, Android)  
**Primary platform for this phase:** Web, constrained to a full-size mobile viewport  
**Design direction:** Minimal text, clear hierarchy, uniform colour, no boilerplate copy, Poppins typeface

---

## 1. Underlying Assumptions

The following assumptions are made before the design is specified. If any assumption is falsified during implementation, the affected sections must be revisited.

**A1. Purpose and role structure.**  
MDATE-P-2 is a therapy companion for people living with aphasia. The repository contains route groups for `(auth)`, `(account-setup)`, `(app)`, and `(therapist-portal)` , indicating a two-role system: a person with aphasia (primary user) and a clinician or therapist (secondary, monitoring role). The patient-facing experience is the design priority.

**A2. The primary user has aphasia, not a general cognitive deficit.**  
Aphasia affects language comprehension and production, not intellectual capacity. The user can understand concepts but may struggle with written words, sentence complexity, and rapid language-based interaction. The interface therefore cannot rely on text alone; it must use symbols, icons, consistent placement, and optional audio or visual supports.

**A3. The user may have co-occurring motor or visual impairments.**  
Aphasia frequently co-occurs with right-sided weakness (from stroke), visual field loss, and reduced fine motor control. Touch targets must be large, avoid right-edge placement for critical actions, and not require precision gestures such as double-tap or drag.

**A4. The web build is a mobile design preview, not a desktop web app.**  
The web application is to be implemented as a fixed, full-size mobile viewport (a "device frame" experience). On desktop browsers, the application should appear as a centred mobile canvas, not as a stretched desktop layout. On actual mobile browsers, it should fill the visual viewport.

**A5. The user may experience fatigue, low attention, and stress.**  
The interface must not introduce timeouts, flashing elements, background motion, or dense visual competition. It should allow the user to proceed at their own pace and to pause or exit at any point.

**A6. "Minimalist" does not mean "small."**  
Minimalism in this specification means low visual noise, few competing elements, and generous whitespace ¿ not small type or subtle contrast. Readability takes precedence over aesthetic restraint.

---

## 2. User Flow / Clickstream / Navigation Path

The navigation model is linear and shallow. There are no hierarchical menus, no nested drawers, and no more than two levels of depth from the home screen. Buttons that perform the same action appear in the same location on every screen.

### 2.1 Top-level flow (patient-facing)

```
¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
¿                         PATIENT-FACING FLOW                         ¿
¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿

  [App Launch / Web Load]
           ¿
           ¿
  ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
  ¿  AUTH SCREEN    ¿  (Sign in / one-tap auth)
  ¿  (auth)         ¿  Minimal fields; large buttons
  ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
           ¿
           ¿
  ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
  ¿ ACCOUNT SETUP   ¿  (If first use)
  ¿ (account-setup) ¿  Visual, symbol-supported;
  ¿                 ¿  pausable between steps
  ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
           ¿
           ¿
  ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
  ¿              HOME  (app)                     ¿
  ¿                                              ¿
  ¿   ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿     ¿
  ¿   ¿  TODAY'S SESSION                   ¿     ¿
  ¿   ¿  [ Large primary action ]          ¿     ¿
  ¿   ¿  "Start"                           ¿     ¿
  ¿   ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿     ¿
  ¿                                              ¿
  ¿   ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿  ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿         ¿
  ¿   ¿  PROGRESS    ¿  ¿  HELP        ¿         ¿
  ¿   ¿  (visual)    ¿  ¿  (icon-led)  ¿         ¿
  ¿   ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿  ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿         ¿
  ¿          ¿                 ¿                 ¿
  ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
             ¿                 ¿
             ¿                 ¿
  ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿   ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
  ¿ PROGRESS VIEW   ¿   ¿ HELP / SUPPORT  ¿
  ¿ Graphs, streak, ¿   ¿ Visual FAQs,    ¿
  ¿ non-lexical     ¿   ¿ audio help,     ¿
  ¿ feedback        ¿   ¿ contact         ¿
  ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿   ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
             ¿
             ¿
  ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
  ¿              ACTIVITY SCREEN                 ¿
  ¿                                              ¿
  ¿   ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿     ¿
  ¿   ¿  STIMULUS AREA                     ¿     ¿
  ¿   ¿  (image, icon, or short prompt)    ¿     ¿
  ¿   ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿     ¿
  ¿                                              ¿
  ¿   ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿  ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿         ¿
  ¿   ¿  RESPONSE A  ¿  ¿  RESPONSE B  ¿         ¿
  ¿   ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿  ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿         ¿
  ¿                                              ¿
  ¿   [ PAUSE ]              [ EXIT ]            ¿
  ¿   (consistent corner)    (consistent corner) ¿
  ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
             ¿
             ¿
  ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
  ¿ SESSION SUMMARY ¿
  ¿ Visual feedback ¿
  ¿ [ Continue ]    ¿
  ¿ [ Home ]        ¿
  ¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿¿
```

### 2.2 Navigation rules

1. **Maximum depth from Home:** 2 taps (Home ¿ Activity ¿ Summary). No screen requires more than two back-navigations to return to Home.
2. **Persistent escape:** A "Home" or "Exit" control is available on every screen within the activity flow, in the same screen position.
3. **No hidden navigation:** Do not use hamburger menus, bottom tab bars with more than three items, or swipe-only gestures. Navigation must be visible and tappable.
4. **One concept per screen:** Each screen presents one primary objective. Additional options are moved to a subsequent screen, not crowded onto the current one.

---

## 3. Design Requirements Specification

Each requirement is numbered for traceability. The tracing table in Section 3.2 justifies each requirement against research evidence and/or the Visual Hierarchy Determination Algorithm.

### 3.1 Requirements

**DR-01 ¿ Viewport containment (web).**  
The web build shall use `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`. On viewports wider than 480 CSS pixels, the application shell shall be constrained to a maximum width of 430 px and centred horizontally, preserving the mobile aspect ratio. The shell shall fill 100% of the visual viewport height using `100dvh` or a JS-measured equivalent.

**DR-02 ¿ Typography: Poppins, with accessibility guardrails.**  
The typeface shall be Poppins (Google Fonts). Body text shall be at least 18 px (web) / 18 sp (native). Line height shall be at least 1.5× font size. Letter spacing shall be normal or slightly increased; never negative. No text shall be presented in all-caps or italics for extended passages. Poppins is a geometric sans-serif and is generally readable, but because its letterforms are similar in shape, the implementation must compensate with generous line height and spacing.

**DR-03 ¿ Type scale and hierarchy.**  
Three typographic levels shall be used: LARGE (primary action or key message), MEDIUM (section labels and supporting content), SMALL (metadata and incidental detail). No more than two LARGE elements may compete on a single screen at the same time. The classification of each element shall be determined by the algorithm in Section 4, not by ad-hoc styling.

**DR-04 ¿ Colour and contrast.**  
The palette shall be monochromatic or near-monochromatic, with one accent colour reserved exclusively for the primary action. Foreground/background contrast shall meet WCAG 2.2 AA (¿ 4.5:1 for normal text, ¿ 3:1 for large text and UI components). Hierarchy must remain legible in grayscale; colour shall not be the sole carrier of meaning.

**DR-05 ¿ Touch targets.**  
Every interactive element shall have a minimum touch target of 48 × 48 CSS pixels (web) / 48 × 48 dp (native). Primary actions shall be at least 56 px tall. Critical actions (e.g., "Exit," "Pause") shall not be placed within 16 px of the right screen edge, to accommodate right-sided motor impairment.

**DR-06 ¿ Iconography and symbol support.**  
Every primary action and section heading shall be accompanied by a clear, familiar icon placed to the left of the label (in left-to-right locales). Icons must be unambiguous and culturally appropriate. Icons shall not be used as the sole label for destructive or irreversible actions.

**DR-07 ¿ Text minimalism.**  
The interface shall not contain boilerplate instructional text, marketing copy, or explanatory paragraphs. Labels shall be single words or short phrases. Where text is necessary, readability shall target a grade level of 5 or lower. All text shall be written in plain language and, where feasible, paired with an audio or visual alternative.

**DR-08 ¿ Consistent placement.**  
Buttons and controls that perform the same function shall appear in the same screen position across all screens. The primary action shall be consistently centred or consistently bottom-anchored. Navigation controls shall not move between screens.

**DR-09 ¿ Whitespace and common regions.**  
Elements belonging to the same task or concept shall be grouped within a shared visual region (card, panel, or bounded area) with generous internal padding. At least 24 px of whitespace shall separate unrelated groups. Whitespace is a functional requirement, not a cosmetic preference.

**DR-10 ¿ No timeouts, no flashing, no compulsory motion.**  
The interface shall not impose session timeouts or countdowns. Motion shall be limited to meaningful transitions (e.g., progress fill). All non-essential animation shall be disableable or shall respect `prefers-reduced-motion`. There shall be no flashing content.

**DR-11 ¿ Error-tolerant interaction.**  
The interface shall not require double-tap, long-press, drag, or multi-finger gestures. A single tap or click shall be sufficient for every action. Incorrect responses in activities shall produce neutral, non-punitive feedback; the user must always be able to retry or exit.

**DR-12 ¿ Multimodal redundancy.**  
Where the interface conveys an instruction, the same instruction shall be available in at least two modalities: visual (icon/image) and textual (short label), with optional audio where implemented. This reduces dependence on a single language channel.

### 3.2 Tracing table

| Req. ID | Requirement summary | Evidence / rationale | Algorithm linkage |
|---|---|---|---|
| DR-01 | Mobile viewport containment on web | Web viewport behaviour; mobile preview requirement | Algorithm 8, Test 5 (Responsive) |
| DR-02 | Poppins with ¿18 px, ¿1.5 line height | Poppins is readable but geometric; line height and spacing compensate | Algorithm 7, Typography variables |
| DR-03 | LARGE / MEDIUM / SMALL, ¿2 LARGE per screen | Two-dominant-group constraint | Algorithm 6, Dominance constraint |
| DR-04 | Low-chroma palette; AA contrast; grayscale-safe | Clean layouts, high contrast, minimal distraction | Algorithm 8, Test 2 (Grayscale) |
| DR-05 | 48 px targets; ¿56 px primary; no right-edge criticals | Large selection areas; right-sided motor risk | Algorithm 7, Scale and spacing |
| DR-06 | Icon + label for primary actions and headings | Aphasia users rely on symbols for navigation | Algorithm 7, Contrast and position |
| DR-07 | No boilerplate; grade ¿5; short labels | Readability grade level 5 or lower | Algorithm 1, Define objective |
| DR-08 | Consistent button placement | Linear flow with fixed button locations | Algorithm 8, Test 4 (Gestalt) |
| DR-09 | Whitespace and common regions | White space highlights key points | Algorithm 3 (Gestalt grouping) |
| DR-10 | No timeouts, flashing, compulsory motion | Non-flashing, tranquil interface | Algorithm 8, Test 6 (Accessibility) |
| DR-11 | Single-tap; error-tolerant | Avoid double-clicking; low-error learning | Algorithm 8, Test 6 |
| DR-12 | Multimodal redundancy | Multi-modal prompting for visual/auditory impairments | Algorithm 5, Focal support |

---

## 4. Visual Hierarchy Determination ¿ Applied to MDATE-P-2

The algorithm provided in the brief is applied to two representative screens: **Home** and **Activity**. For each, every visual element receives an importance score, a hierarchy classification, and a visual treatment. The engineer should use these as specifications, not as suggestions.

### 4.1 Home screen ¿ element inventory and classification

**Primary objective:** Start today¿s therapy session.  
**Secondary objectives:** View progress; access help.  
**Intended attention sequence:** Today¿s session card ¿ progress card ¿ help card.

| Element ID | Type | Group | T | M | **I** | **Hierarchy** | Treatment |
|---|---|---|---|---|---|---|---|
| `home-primary-action` | Interaction (button) | `today-session` | 5 | 5 | **5.00** | **LARGE** | Dominant scale, accent fill, centred, ¿56 px tall, icon + label |
| `home-session-label` | Content (heading) | `today-session` | 4 | 4 | **4.00** | MEDIUM (dominance downgrade) | Section heading scale; placed above button; not competing for primary focus |
| `home-progress-card` | Visual + interaction | `progress-summary` | 3 | 4 | **3.40** | MEDIUM | Contained region, moderate heading, non-accent surface |
| `home-help-card` | Interaction | `help` | 2 | 3 | **2.40** | SMALL | Compact icon + label; neutral surface |
| `home-profile-avatar` | Visual | `identity` | 1 | 1 | **1.00** | SMALL | Small, top corner, non-interactive (or single-tap settings) |
| `home-decorative-icon` | Visual | ¿ | 0 | 0 | **0.00** | SMALL | Remove or neutralise unless it aids recognition |

**Dominance constraint result:** Only one element qualifies as LARGE (`home-primary-action`, score 5.00). The `home-session-label` is downgraded to MEDIUM despite an I-score of 4.00, because promoting it to LARGE would create a competing focal group. This preserves a single dominant focal group: the "Start" action.

**Focal point:** The primary action button.  
**Secondary focal group:** The progress card (MEDIUM, contained, distinguishable by region).  
**Supporting group:** Help and identity, both SMALL.

### 4.2 Activity screen ¿ element inventory and classification

**Primary objective:** Respond to the current stimulus.  
**Secondary objectives:** Pause; exit.  
**Intended attention sequence:** Stimulus ¿ response options ¿ pause/exit (peripheral).

| Element ID | Type | Group | T | M | **I** | **Hierarchy** | Treatment |
|---|---|---|---|---|---|---|---|
| `activity-stimulus` | Content / visual | `stimulus` | 5 | 5 | **5.00** | **LARGE** | Dominant area; image or icon; generous internal whitespace; highest contrast region |
| `activity-response-a` | Interaction | `response-set` | 4 | 4 | **4.00** | MEDIUM (dominance downgrade) | Large button but not accent-filled; shared region with Response B; clear label/icon |
| `activity-response-b` | Interaction | `response-set` | 4 | 4 | **4.00** | MEDIUM (dominance downgrade) | Identical treatment to Response A |
| `activity-pause` | Interaction | `session-control` | 3 | 2 | **2.60** | MEDIUM | Fixed top-left or bottom-left; icon-led; non-accent surface |
| `activity-exit` | Interaction | `session-control` | 3 | 2 | **2.60** | MEDIUM | Fixed opposite corner; icon-led; neutral treatment |
| `activity-progress-bar` | Visual / statistic | `session-progress` | 2 | 3 | **2.40** | SMALL | Thin, non-distracting; no text percentage required |

**Dominance constraint result:** The stimulus is the single LARGE element. The two response buttons are both I-score 4.00 but are downgraded to MEDIUM because promoting both would create a second dominant focal group and compete with the stimulus. The user¿s attention must first land on the stimulus, then move to the response set.

**Focal point:** Stimulus area.  
**Secondary focal group:** Response set (treated as one gestalt group; equal visual weight within the group).  
**Supporting group:** Pause and exit controls, deliberately peripheral in visual weight but still ¿48 px targets.

### 4.3 Visual treatment tokens derived from the algorithm

| Token | LARGE | MEDIUM | SMALL |
|---|---|---|---|
| **Font size (web)** | 28¿32 px | 20¿24 px | 16¿18 px |
| **Font weight** | 600 (semibold) | 500 (medium) | 400 (regular) |
| **Line height** | 1.25¿1.3 | 1.4¿1.5 | 1.5 |
| **Colour emphasis** | Accent foreground or filled accent surface | Neutral-strong foreground | Neutral-muted foreground |
| **Whitespace** | ¿ 32 px around | ¿ 24 px around | ¿ 16 px |
| **Corner radius** | 20¿24 px | 16¿20 px | 12¿16 px |
| **Minimum height (interactive)** | 56 px | 56 px | 48 px |
| **Icon size** | 28¿32 px | 24¿28 px | 20¿24 px |

These tokens are the implementation bridge between the hierarchy classification and the code.

---

## 5. Design Tokens ¿ Concrete Values for Implementation

### 5.1 Colour palette (suggested starting values)

The palette is intentionally low-chroma. The accent colour is the only saturated hue and is reserved for the LARGE primary action on each screen.

| Token | Value | Usage |
|---|---|---|
| `color.bg` | `#F5F3EF` | App background (warm off-white; reduces glare) |
| `color.surface` | `#FFFFFF` | Cards, response buttons, panels |
| `color.surface-muted` | `#EDEAE5` | Supporting regions (help card) |
| `color.text-primary` | `#1E1E1E` | LARGE text, primary labels |
| `color.text-secondary` | `#4A4A4A` | MEDIUM text |
| `color.text-tertiary` | `#6B6B6B` | SMALL metadata (verify 4.5:1 against surface) |
| `color.accent` | `#2F6F5E` | Primary action fill / LARGE accent |
| `color.accent-text` | `#FFFFFF` | Text on accent fill |
| `color.border` | `#D8D3CC` | Non-critical dividers; use sparingly |

Contrast checks required: `text-primary` on `bg` (¿ 15:1), `text-secondary` on `surface` (¿ 8:1), `text-tertiary` on `surface` (target ¿ 4.5:1 ¿ adjust if necessary).

### 5.2 Typography scale (Poppins)

| Token | Size / Line height | Weight | Usage |
|---|---|---|---|
| `type.large` | 30 px / 1.25 | 600 | Primary action label, main message |
| `type.medium` | 22 px / 1.4 | 500 | Section headings, response labels |
| `type.small` | 17 px / 1.5 | 400 | Metadata, secondary labels |
| `type.caption` | 15 px / 1.5 | 400 | Only if absolutely necessary; not for instructions |

All text must remain at or above 16 px in the smallest role. Body text should default to `type.medium` or `type.small`, never smaller than 17 px for patient-facing content.

### 5.3 Spacing and geometry

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
| `content.max-width` | 430 px (web shell) |

---

## 6. Viewport and Platform Implementation Notes

### 6.1 Web (mobile-viewport emulation)

The web app must behave as a fixed mobile canvas. The following implementation pattern is recommended.

**Meta tag:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

**Shell CSS:**
```css
:root {
  --app-max-width: 430px;
  --app-bg: #F5F3EF;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: #E8E5E0; /* desktop backdrop */
  display: flex;
  justify-content: center;
}

#app-shell {
  width: 100%;
  max-width: var(--app-max-width);
  height: 100dvh;
  background: var(--app-bg);
  overflow: hidden;
  position: relative;
  /* Safe-area handling for notched devices */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

On native (Expo), the same shell should be achieved with a full-screen `View` and `SafeAreaView`, not with hard-coded pixel dimensions.

### 6.2 Font loading (Expo + Web)

Load Poppins via `expo-font` or `@expo-google-fonts/poppins`. Ensure the font is applied at the root level so that all LARGE, MEDIUM, and SMALL tokens inherit correctly. Do not use system fallbacks for hierarchy-critical text; if Poppins fails to load, the layout must still remain usable with a neutral sans-serif at the same sizes.

### 6.3 Accessibility and semantics

- Use semantic heading levels in the web build (`h1` for the screen¿s LARGE message, `h2` for MEDIUM sections). Do not use heading tags for visual styling alone.
- Every icon-only control must have an accessible name (`aria-label` on web; `accessibilityLabel` in Expo).
- Reading order in the DOM must match the visual order: primary action ¿ progress ¿ help.
- Respect `prefers-reduced-motion` in CSS and `AccessibilityInfo.isReduceMotionEnabled()` in Expo.

---

## 7. Composition Validation (Algorithm 8)

The following tests must be performed before the design is considered complete. The engineer should not rely solely on the visual hierarchy analysis; the rendered interface must pass these checks.

**Test 1 ¿ Squint test.**  
The primary action on Home (`home-primary-action`) must remain the most salient element when the UI is viewed with reduced detail. If the progress card or help card draws the eye first, reduce their contrast or surface saturation.

**Test 2 ¿ Grayscale test.**  
Convert the entire interface to grayscale. The LARGE/MEDIUM/SMALL hierarchy must remain distinguishable through scale, weight, and whitespace. If any two levels collapse, adjust the type scale or spacing tokens.

**Test 3 ¿ Reading sequence test.**  
On Home, the natural reading order must be: primary action ¿ progress ¿ help. On Activity: stimulus ¿ response set ¿ pause/exit. If the eye is pulled to the pause/exit controls before the stimulus, their visual weight is too high.

**Test 4 ¿ Gestalt test.**  
The two response buttons on the Activity screen must be perceived as a single related set (proximity, similarity, shared region). The pause and exit controls must be perceived as a separate peripheral group. If a response button appears grouped with pause/exit, increase the whitespace between the response region and the control region.

**Test 5 ¿ Responsive test.**  
At widths from 320 px to 430 px, the hierarchy must not invert. Text must not shrink below the minimum sizes. Touch targets must not fall below 48 px. On desktop web, the shell must remain centred and must not stretch.

**Test 6 ¿ Accessibility test.**  
Contrast ratios must meet AA. All interactive elements must be reachable by keyboard (web) and by screen reader (native and web). Screen reader order must match visual order. No text shall be presented as an image of text.

---

## 8. Open Decisions and Implementation Risks

The following items are not fully resolved by the research or the algorithm and should be confirmed during implementation or co-design:

1. **Audio support.** Multimodal redundancy (DR-12) strongly suggests that instructions and response options should have optional audio. The specification does not mandate a specific audio implementation, but the engineer should reserve space and API hooks for a "tap to listen" control adjacent to critical text. This is flagged as a high-priority open decision.

2. **Therapist portal visual language.** The therapist portal is a secondary interface and may use a denser layout. It should share the same tokens (Poppins, palette, spacing) but is not bound by the patient-facing two-dominant-group constraint. This separation must be deliberate, not accidental.

3. **Poppins and dyslexia.** Poppins is not the optimal typeface for every user with dyslexia, because its geometric letterforms share similar shapes. However, the brief explicitly recommends Poppins, and the research indicates it is readable with generous spacing and line height. If co-design testing reveals reading difficulty, an alternative such as Lexend or Atkinson Hyperlegible should be evaluated ¿ but only after the Poppins-based hierarchy has been tested.

4. **Colour accent selection.** The suggested accent (`#2F6F5E`) is a placeholder. It should be tested against the background for contrast and against the grayscale test. A warmer or cooler accent may be selected provided it remains the sole saturated hue in the patient-facing UI.

---

## 9. Summary of Deliverables for the Engineer

The engineer implementing this specification should produce:

1. A mobile-viewport web shell with the meta tag and CSS constraints described in Section 6.1.
2. A design-token layer (CSS variables or a theme object) implementing Section 5.
3. The Home screen with a single LARGE primary action, a MEDIUM progress card, and SMALL help/identity elements, following the classification in Section 4.1.
4. The Activity screen with a LARGE stimulus, a MEDIUM response set (two equal-weight buttons), and peripheral pause/exit controls, following Section 4.2.
5. Semantic HTML (web) or accessible native components (Expo) with correct labels and reading order.
6. A validation pass covering all six tests in Section 7, with screenshots or recordings in colour, grayscale, and squint-reduced views.

The design is considered complete when the hierarchy is intentional on every screen, the primary objective is unmistakable, and a person with aphasia can navigate the patient-facing flow without relying on boilerplate text or hidden controls.
