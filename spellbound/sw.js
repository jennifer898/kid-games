/* Service worker for Spellbound: The Dragon's Ledger.

   Goal: once the game has been opened on a device, it keeps working with no
   signal at all. The cloud-save calls to script.google.com are cross-origin
   and deliberately skipped below, so they always go to the real network and
   a stale save is never served from cache.

   VERSION and ASSETS below are generated. After changing any file under
   img/, fonts/ or icons/, re-run:

       python3 ../tools/build-sw.py

   which refreshes the asset list and bumps VERSION so browsers pick the
   new files up. */

const VERSION = "d54fe510647c";
const CACHE = `spellbound-${VERSION}`;
const ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "favicon.ico",
  "img/ascend-banner.jpg",
  "img/bg-0.jpg",
  "img/bg-1.jpg",
  "img/bg-2.jpg",
  "img/bg-3.jpg",
  "img/bg-4.jpg",
  "img/ch-blue.jpg",
  "img/ch-crystal.jpg",
  "img/ch-dragon.jpg",
  "img/ch-red.jpg",
  "img/ch-wood.jpg",
  "img/ev-oct1.jpg",
  "img/ev-oct2.jpg",
  "img/ev-oct3.jpg",
  "img/ev-phx1.jpg",
  "img/ev-phx2.jpg",
  "img/ev-phx3.jpg",
  "img/ev-pup1.jpg",
  "img/ev-pup2.jpg",
  "img/ev-pup3.jpg",
  "img/ev-slime1.jpg",
  "img/ev-slime2.jpg",
  "img/ev-slime3.jpg",
  "img/finale.jpg",
  "img/fx-bolt.jpg",
  "img/fx-comet.jpg",
  "img/fx-fire.jpg",
  "img/fx-heal.jpg",
  "img/fx-ice.jpg",
  "img/fx-orb.jpg",
  "img/fx-sparkle.jpg",
  "img/fx-star.jpg",
  "img/hero-default.jpg",
  "img/hero-fire.jpg",
  "img/hero-leaf.jpg",
  "img/hero-storm.jpg",
  "img/hero-water.jpg",
  "img/icon-chest.jpg",
  "img/icon-coins.jpg",
  "img/icon-heart.jpg",
  "img/icon-key.jpg",
  "img/icon-potion.jpg",
  "img/icon-scroll.jpg",
  "img/icon-shield.jpg",
  "img/icon-sword.jpg",
  "img/mob-bandit.jpg",
  "img/mob-bat.jpg",
  "img/mob-broom.jpg",
  "img/mob-chest.jpg",
  "img/mob-colossus.jpg",
  "img/mob-goblin.jpg",
  "img/mob-golem.jpg",
  "img/mob-imp.jpg",
  "img/mob-inky.jpg",
  "img/mob-knight.jpg",
  "img/mob-merchant-king.jpg",
  "img/mob-phoenix.jpg",
  "img/mob-puffer.jpg",
  "img/mob-pup.jpg",
  "img/mob-slime.jpg",
  "img/mob-snapclaw.jpg",
  "img/mob-titan.jpg",
  "img/mob-toadstool.jpg",
  "img/mob-wisp.jpg",
  "img/nv-bat1.jpg",
  "img/nv-bat2.jpg",
  "img/nv-bat3.jpg",
  "img/nv-bee1.jpg",
  "img/nv-bee2.jpg",
  "img/nv-bee3.jpg",
  "img/nv-cgolem1.jpg",
  "img/nv-cgolem2.jpg",
  "img/nv-cgolem3.jpg",
  "img/nv-crab1.jpg",
  "img/nv-crab2.jpg",
  "img/nv-crab3.jpg",
  "img/nv-dragon1.jpg",
  "img/nv-dragon2.jpg",
  "img/nv-dragon3.jpg",
  "img/nv-goblin1.jpg",
  "img/nv-goblin2.jpg",
  "img/nv-goblin3.jpg",
  "img/nv-imp1.jpg",
  "img/nv-imp2.jpg",
  "img/nv-imp3.jpg",
  "img/nv-mgolem1.jpg",
  "img/nv-mgolem2.jpg",
  "img/nv-mgolem3.jpg",
  "img/nv-mimic1.jpg",
  "img/nv-mimic2.jpg",
  "img/nv-mimic3.jpg",
  "img/nv-puffer1.jpg",
  "img/nv-puffer2.jpg",
  "img/nv-puffer3.jpg",
  "img/o-arcane.jpg",
  "img/o-blood.jpg",
  "img/o-fire.jpg",
  "img/o-ice.jpg",
  "img/o-leaf.jpg",
  "img/o-light.jpg",
  "img/o-lunar.jpg",
  "img/o-ranger.jpg",
  "img/o-royal.jpg",
  "img/o-shadow.jpg",
  "img/o-storm.jpg",
  "img/pyramid.jpg",
  "img/splash.jpg",
  "img/worldmap.jpg",
  "fonts/fredoka-variable.woff2",
  "fonts/fredoka.css",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
  "icons/icon-192.png",
  "icons/icon-512-maskable.png",
  "icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // addAll fails the whole install if any single request fails, so add
    // individually: one missing sprite shouldn't cost us offline support.
    await Promise.all(ASSETS.map(url =>
      cache.add(new Request(url, { cache: "reload" })).catch(() => {})
    ));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k.startsWith("spellbound-") && k !== CACHE)
          .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Cross-origin (the Apps Script save sync) always goes to the network:
  // caching progress saves would hand back stale sticker counts.
  if (url.origin !== self.location.origin) return;

  // Navigations: network first, so a redeploy is picked up as soon as there
  // is signal, but fall back to the cached page when there isn't.
  if (req.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put("./", fresh.clone());
        return fresh;
      } catch (e) {
        return (await caches.match("./")) ||
               (await caches.match("index.html")) ||
               Response.error();
      }
    })());
    return;
  }

  // Everything else (images, fonts, icons): cache first — these only change
  // when VERSION changes, and hitting the cache keeps the games responsive.
  event.respondWith((async () => {
    const hit = await caches.match(req);
    if (hit) return hit;
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok && fresh.type === "basic") {
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (e) {
      return Response.error();
    }
  })());
});
