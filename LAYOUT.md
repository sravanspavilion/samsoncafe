# SAMSONS CAFE — Layout Reference

This document records the implemented layout and visual hierarchy for the SAMSONS CAFE ordering website.

## Global shell

- **Header:** Sticky dark-espresso bar with a gold hairline border, circular `S` monogram, brand stack, desktop navigation, cart count, and cart total shortcut.
- **Canvas:** Obsidian (`#0B0908`) with a restrained warm gold atmospheric glow near the top of primary pages.
- **Container:** Maximum 1344px content width; 32px mobile outer spacing and 64px desktop outer spacing.
- **Typography:** Playfair Display for editorial headings, prices, and product titles; Outfit for controls, labels, and descriptions.
- **Footer:** Four-column desktop composition, collapsing to a single-column mobile stack.

## Customer routes

### `/` — Home

1. Full-width image-led hero with dark left-to-right scrim.
2. Gold eyebrow: `SAMSONS PRIVATE RESERVE`.
3. Editorial hero statement and primary gold menu CTA.
4. Featured menu section with section heading and four product cards.
5. Quiet brand-promise band with border treatment.

### `/menu` — Curated menu

1. Menu title/description and compact barista-status panel.
2. Horizontally scrollable category pills and search input.
3. Responsive product grid:
   - 4 columns on large desktop
   - 2 columns on tablet
   - 1 column on small mobile
4. Every card contains image, category pill, item ID, product title, INR price, description, stock signal, and circular add action.

### `/menu/[itemId]` — Product detail

1. Back-to-menu action.
2. Two-column desktop composition: square product image alongside product information.
3. Category/item ID, name, INR price, description, stock message, quantity selector, and gold add-to-order CTA.
4. One-column stacked mobile composition.

### `/cart` — My Order Folio

1. Continue-shopping action and order-folio heading.
2. Desktop grid: line items at left and a sticky order summary at right.
3. Cart lines contain product image, metadata, quantity controls, remove action, and line total.
4. Empty-cart state replaces the grid when no items exist.

### `/checkout` — Confirm your order

1. Desktop grid: customer form at left and static order summary at right.
2. Name, contact, and optional pickup/table note fields.
3. Payment integration notice and a full-width gold place-order button.
4. On mobile, the summary follows the form.

### `/order-success` — Confirmation

1. Centered confirmation panel on the dark canvas.
2. Gold check icon, order ID block with copy action, staff-confirmation message, and return-to-menu CTA.

## Admin routes

### `/admin`

- Responsive admin sidebar/nav.
- Metric cards for total orders, low-stock item count, and popular product.
- Recent-orders table.

### `/admin/orders`, `/admin/menu`, `/admin/inventory`

- Consistent dark admin shell.
- Horizontally scrollable responsive tables for narrow screens.
- Gold headers, taupe dividers, ivory/taupe content, and gold/amber availability states.

## Responsive rules

| Viewport | Layout behavior |
| --- | --- |
| 1440px | Full navigation, 4-column menu grid, two-column page layouts, sticky order summary. |
| 1280px | Desktop layout retained with fluid container width. |
| 768px | Product grid changes to 2 columns; content gutters reduce; navigation remains compact. |
| 375px | Single-column content, mobile-safe spacing, horizontally scrolling filter controls, stacked summaries/forms. |

## Visual tokens

| Purpose | Value |
| --- | --- |
| Canvas | `#0B0908` |
| Surface | `#120E0C` |
| Raised panel | `#1C1512` / `#261E1A` |
| Antique gold | `#C8A261` |
| Bright gold accent | `#E5C158` |
| Primary cream | `#FAF6F0` |
| Secondary text | `#A8988B` |
| Structural border | `#3D312A` |
