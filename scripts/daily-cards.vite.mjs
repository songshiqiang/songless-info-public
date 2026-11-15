// Bundles the card drawing code for the page scripts/daily-cards.mjs opens in Chrome.
export default {
  publicDir: false,
  build: {
    minify: false,
    lib: { entry: 'src/lib/daily-cards.ts', formats: ['iife'], name: 'DailyCards', fileName: () => 'cards.js' },
  },
};
