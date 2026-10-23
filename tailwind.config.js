/** @type {import('tailwindcss').Config} */
import plugin from "tailwindcss/plugin";

/* Native CSS container queries (no extra dependency): `@container` marks a
   query container and `@md:` / `@lg:` / `@2xl:` apply when *that container*
   (e.g. a floating window) is at least that wide — not the viewport. */
const CONTAINER_SIZES = { md: "28rem", lg: "32rem", "2xl": "42rem" };

const containerQueries = plugin(({ addUtilities, addVariant }) => {
  addUtilities({ ".\\@container": { "container-type": "inline-size" } });
  Object.entries(CONTAINER_SIZES).forEach(([name, size]) => {
    addVariant(`@${name}`, `@container (min-width: ${size})`);
  });
  // landscape phones: width-based breakpoints alone would give them desktop-sized type.
  // Defined as a variant (not a `screens` object) so `min-[…]` / `max-[…]` keep working;
  // `:root &` raises specificity so it beats `sm:`/`lg:` regardless of CSS order.
  addVariant("short", "@media (max-height: 500px) { :root & }");
});

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  future: {
    // hover styles only on devices with a real pointer — avoids "stuck"
    // hover states (tooltips, lifts) after a tap on touch screens
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [containerQueries],
}
