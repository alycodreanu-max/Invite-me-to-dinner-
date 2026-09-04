# Invite Me to Dinner — Landing Page

A single-page, static landing site for Andy's "Invite Me to Dinner" relationship
consultation service: hero, about Andy, the concept, the two offerings, and a
booking section with a custom calendar and reservation form.

No build step, no dependencies — just HTML, CSS, and vanilla JavaScript.

## Structure

```
.
├── index.html      Page markup and copy
├── styles.css      Design system (colour, type, layout) and all styling
├── script.js       Calendar, offer selection, tilt/parallax, form flow
└── images/
    ├── hero-dinner.jpg     Hero image (Andy + guest, dinner table)
    └── andy-portrait.jpg   Portrait used in the "About Andy" section
```

## Running locally

Any static server works, for example:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying on GitHub Pages

1. Create a new repository and push these files to the `main` branch.
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to `Deploy from a branch`,
   branch `main`, folder `/ (root)`.
4. Save — the site will publish at `https://<your-username>.github.io/<repo-name>/`.

## Wiring up real bookings

The form currently confirms client-side only, so it's demo-ready out of the box
but does not send data anywhere. To make it live:

- Open `script.js` and find the `TODO` inside the `form.addEventListener("submit", …)`
  handler.
- Replace it with a `fetch()` call to your booking endpoint, or point the form
  at a service like Formspree, Netlify Forms, or a Calendly/Stripe flow —
  matching the funnel already defined in the project's booking policy
  (full payment at time of booking, confirmation email with restaurant details).
- The calendar currently disables past dates and Sundays as a placeholder rule —
  swap in real availability from your booking system once connected.

## Editing content

- Copy lives directly in `index.html` — sections are labelled with HTML comments
  (`<!-- HERO -->`, `<!-- ABOUT ANDY -->`, etc.).
- Pricing, dinner allowance, and policy text pull from the locked offer
  structure: Individual £300 (50–60 min, dinner up to £75) and Couple £450
  (75–90 min, dinner up to £120).
- Colour and type tokens are declared once at the top of `styles.css` under
  `:root` — change a value there to restyle the whole site consistently.

## Design notes

- Palette: warm near-black (`#0B0906`) with candlelight gold (`#C6963E`) and a
  muted wine accent (`#7A2430`) for the couple's offering — pulled from the
  restaurant's own lighting rather than a generic dark-mode default.
- Type: Fraunces (serif, display/headlines) paired with Manrope (sans, UI/body).
- Motion is intentionally restrained: one orchestrated hero reveal on load,
  plus interactions that respond to the person (portrait tilt, offer-card tilt,
  calendar selection) — nothing auto-animates on scroll.
