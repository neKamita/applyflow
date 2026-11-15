---
name: ApplyFlow
description: Apply to university programs abroad and watch your application collect its stamps.
colors:
  cover: "oklch(0.31 0.055 222)"
  cover-raised: "oklch(0.37 0.06 222)"
  on-cover: "oklch(0.97 0.012 200)"
  on-cover-muted: "oklch(0.83 0.03 205)"
  guilloche: "oklch(0.62 0.07 200)"
  paper: "oklch(0.972 0.009 195)"
  panel: "oklch(0.993 0.004 195)"
  sunken: "oklch(0.945 0.012 198)"
  ink: "oklch(0.25 0.03 228)"
  ink-muted: "oklch(0.46 0.03 228)"
  line: "oklch(0.87 0.016 205)"
  line-strong: "oklch(0.62 0.03 215)"
  focus: "oklch(0.52 0.13 215)"
  stamp-submitted: "oklch(0.47 0.17 296)"
  stamp-submitted-soft: "oklch(0.95 0.03 296)"
  stamp-paid: "oklch(0.45 0.11 158)"
  stamp-paid-soft: "oklch(0.95 0.035 158)"
  stamp-failed: "oklch(0.52 0.19 30)"
  stamp-failed-soft: "oklch(0.95 0.03 30)"
typography:
  headline:
    fontFamily: "Golos Text, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: "2.25rem"
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Golos Text, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: "1.625rem"
  body:
    fontFamily: "Golos Text, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.5rem"
  label:
    fontFamily: "Golos Text, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.375rem"
  stamp:
    fontFamily: "PT Mono, ui-monospace, monospace"
    fontSize: "1rem"
    fontWeight: 400
    letterSpacing: "0.08em"
rounded:
  control: "6px"
  panel: "12px"
spacing:
  gutter-mobile: "16px"
  gutter-desktop: "24px"
  container: "72rem"
components:
  button-primary:
    backgroundColor: "{colors.cover}"
    textColor: "{colors.on-cover}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.cover-raised}"
  button-secondary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  input:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.panel}"
  nav-link:
    textColor: "{colors.on-cover-muted}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  status-badge-submitted:
    backgroundColor: "{colors.stamp-submitted-soft}"
    textColor: "{colors.stamp-submitted}"
    rounded: "{rounded.control}"
  status-badge-paid:
    backgroundColor: "{colors.stamp-paid-soft}"
    textColor: "{colors.stamp-paid}"
    rounded: "{rounded.control}"
  status-badge-failed:
    backgroundColor: "{colors.stamp-failed-soft}"
    textColor: "{colors.stamp-failed}"
    rounded: "{rounded.control}"
---

# Design System: ApplyFlow

The normative source for every value is `frontend/src/styles/tokens.css`; the frontmatter lists the
light theme. The dark theme redefines the same roles in that file and passes the same contrast test
(`frontend/src/styles/contrast.test.ts`).

## Overview

**Creative North Star: "The Stamped Passport"**

An application is a document that collects verified marks, the way a passport collects entry stamps.
The interface is a working tool first: a standard header, filters, lists and forms that a student on a
phone understands without thinking. The world shows up in four places only: the cover-ink header with
its guilloche band, the cool security-paper pages, a calm sans-serif voice, and stamps that carry
application status.

Nothing is stamped early. A stamp appears only when the backend has confirmed the state it shows, so
the student can trust what they see while they wait. Density is moderate: rows are scannable, controls
are 44px tall, and there is no decoration in the work area beyond what carries meaning.

**Key Characteristics:**
- Committed shell colour: the deep blue-green cover owns the header on every page.
- Cool paper, never cream; ink is a tinted near-black, never pure black.
- Status is a stamp: ink colour plus a distinct shape.
- One authored motion: the stamp pressing onto the page.
- Fully bilingual type (Latin and Cyrillic), self-hosted.

## Colors

A restrained neutral system tinted from the passport cover, with three stamp inks that do all the
signalling.

### Primary
- **Passport Cover** (oklch(0.31 0.055 222)): header background on every page and the primary button,
  so the main action shares the cover's authority. Hover lifts to **Cover Raised** (oklch(0.37 0.06 222)).
- **Cover Text** (oklch(0.97 0.012 200)) and **Cover Text Muted** (oklch(0.83 0.03 205)): wordmark and
  navigation on the cover; current page uses the full-strength text plus an underline.
- **Guilloche Line** (oklch(0.62 0.07 200)): the decorative security band under the header only.

### Tertiary: stamp inks
- **Pending Violet** (oklch(0.47 0.17 296)): submitted, awaiting payment confirmation.
- **Entry Green** (oklch(0.45 0.11 158)): paid; also completed timeline steps.
- **Exit Vermilion** (oklch(0.52 0.19 30)): payment failed, field errors.
- Each ink has a **soft** background (L 0.95) used only behind status badges.

### Neutral
- **Security Paper** (oklch(0.972 0.009 195)): page ground.
- **Clean Page** (oklch(0.993 0.004 195)): panels, inputs, list surfaces.
- **Sunken Page** (oklch(0.945 0.012 198)): hover rows, skeletons, the stamp area on the tracker.
- **Ink** (oklch(0.25 0.03 228)) and **Ink Muted** (oklch(0.46 0.03 228)): text; muted is for
  secondary lines and hints, never for anything the user must act on.
- **Rule** (oklch(0.87 0.016 205)) for dividers; **Strong Rule** (oklch(0.62 0.03 215)) for input
  borders, which must reach 3:1.
- **Focus** (oklch(0.52 0.13 215)): the 2px focus outline everywhere.

### Named Rules
**The Earned Ink Rule.** Stamp inks appear only where they report a real status or error. They are
never used for decoration, links or emphasis.

**The No Black Rule.** No pure black or white anywhere; every neutral carries the cover's hue.

## Typography

**Body Font:** Golos Text (with system-ui)
**Mono Font:** PT Mono (with ui-monospace)

**Character:** Golos Text is a plain, open grotesque drawn for both Latin and Cyrillic, so English and
Russian sit at the same colour and width. PT Mono is used like a passport's machine print: for stamp
text, application references and nothing else.

### Hierarchy
- **Headline** (600, 1.75rem / 2.25rem, -0.015em): page titles ("Find a program", program name on the tracker).
- **Title** (600, 1.125rem / 1.625rem): program names in lists, panel headings.
- **Body** (400, 1rem / 1.5rem): all running text and control text; inputs never go below 16px.
- **Label** (500, 0.875rem / 1.375rem): field labels, badges; secondary lines use 400 in Ink Muted.
- **Stamp** (PT Mono 400, uppercase, 0.08em tracking): stamp titles, dates and codes.

### Named Rules
**The Machine Print Rule.** Monospace is for references and stamp text only, never for headings or
labels.

**The Tabular Rule.** Fees, dates and counts use tabular numerals so columns line up.

## Layout

Single column on phones with 16px gutters; 24px gutters from 640px. Content is capped at 72rem and
centred. The header wraps navigation to a second row below 640px. The catalog is a list of rows
inside one panel (divided by rules, not separate cards); on wide screens each row puts identity on the
left and fee, deadline and action on the right. The tracker uses a main document panel and, from
1024px, a 20rem side panel. Vertical rhythm: 24px between groups on phones, 32px on desktop; 6px
between a label and its control.

## Elevation & Depth

Flat. Depth comes from tone: paper, then page (panel), then sunken areas. Panels are separated by a 1px
Rule border, not a shadow. The single shadow token (`--shadow-raised`) is reserved for future floating
layers (menus, popovers) and is not used on resting surfaces.

### Named Rules
**The One Elevation Rule.** A surface declares depth once: a border or a shadow, never both.

## Shapes

Gentle, document-like corners: 6px on controls, 12px on panels. The stamp is the only place where
shape carries meaning: a dashed double circle for pending, a double-ruled rounded rectangle for paid,
a double-ruled rectangle with cut corners for failed. Rectangular stamps sit slightly rotated (paid
-3deg, failed 2deg), as if pressed by hand; nothing else in the interface is rotated.

## Components

### Buttons
- **Shape:** gently rounded (6px), 44px tall (36px for the small size).
- **Primary:** Passport Cover background, Cover Text, medium weight. One primary per view.
- **Hover / Focus:** background shifts to Cover Raised over 150ms; 2px Focus outline at 2px offset.
- **Loading / Disabled:** stays focusable, `aria-busy` / `aria-disabled`, 60% opacity, ignores
  activation; loading shows a spinning loader icon (static under reduced motion).
- **Secondary:** Clean Page with a Strong Rule border. **Ghost:** text only, Sunken on hover.

### Cards / Containers
- **Panel:** Clean Page, 12px radius, 1px Rule border, no shadow. Panels are never nested; lists inside
  a panel are divided by Rule lines.

### Inputs / Fields
- **Style:** Clean Page, 1px Strong Rule border, 6px radius, 44px tall, 16px text.
- **Label:** above, Label style; hint below in Ink Muted; error below in Exit Vermilion and the border
  turns vermilion with `aria-invalid`.
- **Select:** the native select with a chevron icon. **Radio group:** each option is a bordered row;
  the selected row gets the cover-coloured border and Sunken fill.

### Navigation
- Cover Text Muted links, 44px tall; hover adds Cover Raised behind the link; the current page is full
  Cover Text with a 2px underline 8px below the baseline. A skip link appears on focus.

### Status badge
- Soft ink background, ink text, the stamp shape as a 14px icon before the label.

### Stamp (signature)
- PT Mono uppercase text inside the status shape, drawn in the status ink. Rectangular stamps grow to
  fit their text. When a status first arrives during a visit, the stamp presses in: opacity 0 and
  scale 1.18 to rest in 180ms on `cubic-bezier(0.16, 1, 0.3, 1)`. Under reduced motion it appears
  without movement. It is exposed to assistive technology as one image with a text label.

### Timeline
- An ordered list with a 1px Rule connector; done steps have a filled Entry Green dot, pending a dashed
  Pending Violet ring, failed a filled Exit Vermilion dot.

## Do's and Don'ts

### Do:
- **Do** keep the header in Passport Cover with the guilloche band on every page.
- **Do** show status with `StatusBadge` or `Stamp` so shape and ink always travel together.
- **Do** keep every text pair at 4.5:1 and every control border at 3:1 in both themes; add new pairs to
  `contrast.test.ts`.
- **Do** use Golos Text for all interface text and keep inputs at 16px or larger.

### Don't:
- **Don't** stamp a state before the backend confirms it, and don't animate anything except a newly
  arriving stamp.
- **Don't** use cream or warm paper, pure black, or gradient text.
- **Don't** nest panels or use a coloured side border on cards, alerts or list items.
- **Don't** use monospace for headings, labels or "technical" decoration.
- **Don't** add guilloche or other security patterns inside the work area; the band belongs to the cover.
