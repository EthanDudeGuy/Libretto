# Libretto notes for Claude Code

This repo also has a `.cursorrules` file with the fuller project conventions —
read it for general style/architecture rules. The rule below is called out
here because it's easy to accidentally break by copy-pasting styles between
screens.

## Dropdown menus

Every floating menu (the header's account menu, the book status menu, and any
new one) shares one visual format, defined once in
`src/constants/theme.js` as `theme.components.dropdown`:

- `theme.components.dropdown.card` — background, border, radius, and
  `.shadow` for the floating card itself.
- `theme.components.dropdown.item` — padding/radius for each row.
- `theme.components.dropdown.itemText` — row label typography.
- `theme.components.dropdown.divider` — the hairline separator between groups.

When adding or editing a dropdown:

1. Spread the relevant `theme.components.dropdown.*` token into that
   style instead of writing new border/radius/shadow/padding numbers.
2. Render a full-screen, transparent backdrop (`position: absolute`,
   `top/left/right/bottom: 0`) that's only mounted while the menu is open,
   with `onPress` closing the menu — this is what makes outside-click close
   the menu, matching the account menu's behavior.
3. Position the menu card itself with `position: 'absolute'` relative to its
   trigger (not inline in the layout flow), so opening it floats over
   existing content instead of pushing it down.

Reference implementations: `src/components/AppHeader.js` (account dropdown)
and the status menu in `src/screens/BookChat.js` (`statusMenu` /
`statusMenuBackdrop`).
