Brainstorm of the UI/UX for a progress indicator (breadcrumb or sidebar) for this multi-phase, multi-step workflow.

**Overarching Goals for the Progress Indicator:**

1.  **Clarity:** Users should instantly understand where they are in the overall process.
2.  **Context:** Show the relationship between the current step and its phase, and the overall journey.
3.  **Expectation Management:** Give a sense of how much is done and what's upcoming.
4.  **Non-Intrusive (especially on Mobile):** Provide information without cluttering the primary content area.
5.  **Consistency:** Look and feel integrated with the rest of the application.

---

Here are two main approaches, with considerations for mobile and desktop:

## Option 1: Compact "Phase-Step" Breadcrumb Bar (Top of Screen)

This is best for a more minimalistic approach, especially on mobile where screen real estate is premium.

**Visual Concept:**

*   **Mobile:**
    *   A single line displaying: `[Phase Name] > [Current Step Name]`
    *   Or, slightly more detailed: `Phase X of Y: [Phase Title]  ·  Step A of B: [Step Title]`
    *   Alternative: A segmented progress bar where each major segment is a Phase, and micro-segments within represent steps. The current phase/step is highlighted.
        ```
        +----------------------------------------------------+
        | [Problem Def.] | [Analysis & Trans.] | [Formulation] |
        | ● ○ ○          | ○ ○ ○ ○             | ○             |  <-- ● Current, ○ Upcoming
        +----------------------------------------------------+
        ```
        (This can get wide quickly. Might simplify to show only current phase's steps, or just phase-level progress).

*   **Desktop/Tablet:**
    *   Can be more explicit: `Phase 1: Problem Definition > Step 01: Potential Causes` (all clickable to navigate back to *completed* steps if allowed).
    *   Or a horizontal stepper:
        `[Phase 1: Title] --- [Phase 2: Title] --- [Phase 3: Title]`
        (Current phase highlighted. Clicking a phase could show its steps in a dropdown or a secondary level).
        Underneath the current phase, you could show dots for steps within it:
        `[Phase 1: Problem Def.] [Phase 2: Analysis] [Phase 3: Formulation]`
        `  ● Potential Causes     (Symptoms)            (Medical Props)`
        `  ○ Symptoms`
        `(Current step highlighted. Others muted or just text)`

**UI/UX Details:**

*   **States:**
    *   **Completed Phase/Step:** Visually distinct (e.g., checkmark icon, different color like green, filled style). If clickable, takes user back.
    *   **Current Phase/Step:** Prominently highlighted (e.g., bold text, stronger color like brand primary, larger dot/segment).
    *   **Upcoming Phase/Step:** Muted or outlined style (e.g., greyed out, empty circle). Not clickable.
*   **Mobile-First Text:**
    *   Keep labels very concise. Use abbreviations if absolutely necessary and clear (e.g., "Prob. Def." for "Problem Definition").
    *   Step numbers (e.g., "Step 1/3") can be more useful than full step names if space is extremely tight, with the full name in the main content header.
*   **Interactivity:**
    *   Generally, forward navigation is driven by the main CTA ("Next" button).
    *   Clicking on *completed* phases/steps in the breadcrumb could allow users to go back and review/change selections (if the system logic supports this). This needs careful consideration regarding data consistency.
    *   Upcoming steps are not interactive.
*   **Progressive Disclosure (Mobile):**
    *   The breadcrumb might only show the current Phase title, and tapping it could expand a small dropdown/modal showing all phases and their status, then steps within the current/selected phase.

**Naming for Breadcrumbs/Stepper:**

*   **Phase 1: Problem Definition**
    *   Step 1: Causes (`PotentialCauses`)
    *   Step 2: Symptoms (`PotentialSymptoms`)
*   **Phase 2: Analysis & Translation**
    *   Step 3: Properties (`MedicalProperties`)
    *   Step 4: Oil Ideas (`SuggestedOils`)
    *   Step 5: Safety (`OilSafetyConstraints`)
    *   Step 6: Final Oils (`FinalSelectedOils`)
*   **Phase 3: Protocol Formulation**
    *   Step 7: Protocol (`DailyRecipesProtocol`)

*(Adjusted step numbering to be sequential overall for simplicity in a stepper, e.g., 1 to 7/8).*

---

## Option 2: Detailed Progress Sidebar/Vertical Stepper

This provides more room for detail and is common in multi-step wizards, especially on desktop. On mobile, it would likely be a collapsible element.

**Visual Concept:**

*   **Mobile:**
    *   Accessed via a "Progress" icon/button (e.g., list, timeline, or hamburger menu option) in the main header.
    *   Slides in as a panel (from left/right) or opens as a bottom sheet/modal.
    *   Vertically lists Phases as main headings.
    *   Steps are nested under their respective Phases.
    *   Clear visual indicators (icons, colors, typography) for `completed`, `current`, `upcoming` states for both phases and steps.
        ```
        +--------------------------+
        | Progress                 |
        |--------------------------|
        | ▼ Phase 1: Problem Def.  | < (Current Phase, expanded)
        |   [✓] Step 1: Causes     |
        |   [→] Step 2: Symptoms   | < (Current Step)
        |--------------------------|
        | ► Phase 2: Analysis      | < (Upcoming Phase, collapsed)
        |--------------------------|
        | ► Phase 3: Formulation   |
        +--------------------------+
        ```

*   **Desktop/Tablet:**
    *   Can be a persistent sidebar on the left of the main content area.
    *   Always visible, providing constant context.
    *   Phases can be collapsible/expandable to manage vertical space if the list is very long, but for 3 phases and ~8 steps, all might be visible.
    *   Current step is highlighted and auto-scrolled into view if the panel is scrollable.

**UI/UX Details:**

*   **States & Visuals (Icons are examples):**
    *   **Phase:**
        *   `✓ Completed Phase Title` (Green icon/text, possibly slightly smaller font)
        *   `→ Current Phase Title` (Brand color icon/text, bold, larger font, phase section expanded by default)
        *   `● Upcoming Phase Title` (Grey icon/text, normal font, phase section collapsed by default)
    *   **Step (within a Phase):**
        *   `✓ Completed Step Name` (Green checkmark, green text)
        *   `→ Current Step Name` (Brand color arrow/dot, bold text)
        *   `● Upcoming Step Name` (Grey circle, grey text)
*   **Text:**
    *   Use the clearer, slightly longer names for phases and steps as defined above.
    *   `Step X: Short Name` (e.g., `Step 1: Causes`)
*   **Interactivity:**
    *   **Mobile:** Tapping a Phase header could expand/collapse its steps (if not all shown).
    *   **Desktop:** Phases might be expandable/collapsible.
    *   Clicking on *completed* steps could navigate the user back (if allowed).
    *   Clicking current or upcoming steps in the sidebar would typically *not* navigate, as forward progression is handled by the main page CTA. The sidebar primarily reflects status.
*   **Information Density:**
    *   The sidebar can afford slightly more text than a top breadcrumb.
    *   Avoid making it too busy. The focus is on clear status indication.
*   **Accessibility:**
    *   Ensure proper ARIA attributes for roles (e.g., `tablist`, `tab`, `tabpanel` if phases are like tabs, or just list semantics), states (`aria-current`, `aria-expanded`), and labels.
    *   Keyboard navigable.

---

**General Considerations for Both Options:**

*   **Step Numbering:**
    *   Option A: "Step X of Y within this Phase" (e.g., Problem Definition: Step 1 of 2).
    *   Option B: Overall "Step X of Total Steps" (e.g., Step 1 of 8, Step 2 of 8, etc.). Option B is simpler for users to track overall progress.
    *   The examples above use a hybrid, where the sidebar uses overall numbering implicitly via its order.
*   **Visual Consistency:** Colors, fonts, and iconography should align with the application's design system.
*   **Responsiveness:** The chosen solution must adapt gracefully from mobile to desktop. A compact top bar might be sufficient for mobile, expanding to a more detailed sidebar on larger screens, or the sidebar could be a primary element that transforms for mobile.
*   **Internal vs. User-Facing Steps:**
    *   Steps like `OilSafetyConstraints` and `FinalSelectedOils` might be perceived by the user as very quick, almost automatic backend processes. The progress indicator should reflect this.
    *   If a step is purely backend with no UI for the user (other than a loading state and then moving to the next step), it might be briefly shown as "Processing..." or combined visually with the step that triggers it or the one that follows.
    *   However, your workflow implies UI for most of these, even if just informational (e.g., `MedicalProperties`, `SuggestedOils`). The key is to make the progress feel natural and not like the user is waiting for invisible work unnecessarily.

**Recommendation:**

For a comprehensive and clear user experience, especially given the multi-phase nature:

1.  **Desktop/Tablet:** A **Detailed Progress Sidebar (Vertical Stepper)** is often preferred for clarity and context.
2.  **Mobile:**
    *   A **Compact "Phase-Step" Bar** at the top for at-a-glance context (e.g., `Phase 1: Problem Definition - Causes`).
    *   Supplemented by an **on-demand detailed view** (like the vertical stepper, triggered by a "Progress" button) for users who want to see the full journey.

This hybrid approach ensures mobile-friendliness while providing rich context when needed or when more screen space is available.