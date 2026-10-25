# Design decisions

- The archive's YAML/front-matter color tokens are authoritative, as its HTML Tailwind configuration uses those values. The prose palette conflicts with the rendered mockup; its behavior rules still apply.
- Public surfaces use the light cool canvas, generous editorial spacing, large Plus Jakarta Sans headings, Inter body text and a fluid 1440px container. Admin uses dense tables, a 240px sidebar, 64px tablet rail, 4px control radii, 8px cards, and 12px dialog guidance.
- The supplied admin overview image is kept as a visual reference only; the other eight `screen.png` files are failed-fetch text and are not shipped as image assets. The standalone HTML files were all read; they use CDN Tailwind and dead `#` links, so production uses centralized CSS tokens and real routes.
- Fictional apps, metrics, claims, version strings and demo controls are excluded. The application database starts empty. Optional catalog filters appear only when applications exist.
- Pricing and bundle identifiers are informational only. Ticket forms enter the contact inbox. Geographic analytics, build/commit metadata, issue tracking, incident status, license issuance, notarization and build dispatch are omitted.
- Discontinued apps remain accessible at their public slug and are excluded from default listings, featured sections, and recent release sections. They can be selected explicitly in catalog filters.
- Analytics is disabled by default. When enabled it stores page paths and timestamps only; it does not set cookies or retain client IPs. Admin reporting distinguishes disabled from configured with zero events.
- Rich content uses plain text and structured JSON page data; arbitrary executable HTML is never rendered.
