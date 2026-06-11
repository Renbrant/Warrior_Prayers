---
name: Clerk v6 social buttons full-width layout
description: How to force Clerk v6 icon social buttons into a labeled full-width column layout
---

## Problem
Clerk v6 (`@clerk/react@6.7.3`) renders multiple OAuth providers as compact icon-only squares in a horizontal row by default. `layout.socialButtonsVariant: "blockButton"` exists only in `@clerk/shared@3.47.7` types — in v4 (used by Clerk v6) it is absent and does not produce labeled block buttons.

## Solution that worked
1. Remove `socialButtonsVariant` from the layout config entirely.
2. Inject a global `<style>` tag (outside any CSS layer) directly in the React tree. This overrides Clerk's `@layer clerk { }` styles automatically — no need for `!important` on most rules, but use it for layout-critical properties.
3. Use `[class*="socialButtons"]:not(button):not([class*="Text"]):not([class*="Icon"]):not([class*="Provider"]):not([class*="Block"])` to target BOTH `cl-socialButtons` (outer flex-row wrapper) AND `cl-socialButtonsRoot` (inner container). Forcing only `socialButtonsRoot` to column was insufficient because the outer `cl-socialButtons` controls the row layout.
4. Add `[class*="socialButtonsIconButton__<provider>"]::after { content: "Continuar com <Provider>"; }` to inject text labels via CSS pseudo-elements (since icon buttons don't render text in the DOM).

**Why:** Clerk v6's hosted JS renders icon buttons without text nodes — text labels only exist in "block button" mode. The `::after` hack adds labels without modifying Clerk's DOM.

**How to apply:** Any time social OAuth buttons need to show labels in Clerk v6. Place the `<style>` tag inside the component tree (e.g. next to ClerkProvider). The CSS must target BOTH container elements (socialButtons + socialButtonsRoot), not just socialButtonsRoot.
