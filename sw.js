/* Service worker for Charlotte's Spelling Stickers.

   Goal: once the game has been opened on a device, it keeps working with no
   signal at all — in the car, on a plane, anywhere. Everything except the
   optional save-sync call is served from the cache.

   VERSION and ASSETS below are generated. After changing any file under
   img/, fonts/, icons/ or index.html, re-run:

       python3 tools/build-sw.py

   which refreshes the asset list and bumps VERSION so browsers pick the
   new files up. */

const VERSION = "ece6cf80d146";
const CACHE = `spelling-stickers-${VERSION}`;
const ASSETS = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "favicon.ico",
  "img/cake-1.webp",
  "img/cake-2.webp",
  "img/cake-3.webp",
  "img/cake-4.webp",
  "img/cake-5.webp",
  "img/cake-6.webp",
  "img/cake-7.webp",
  "img/chest.webp",
  "img/coin.webp",
  "img/friend-bonbon.webp",
  "img/friend-coco.webp",
  "img/friend-ginger.webp",
  "img/friend-grape.webp",
  "img/friend-lolli.webp",
  "img/friend-mallow.webp",
  "img/friend-minty.webp",
  "img/friend-peppy.webp",
  "img/friend-rosie.webp",
  "img/friend-sprinkle.webp",
  "img/friend-sweetie.webp",
  "img/friend-swirl.webp",
  "img/gift.webp",
  "img/hero-banner.webp",
  "img/pet-cat-1.webp",
  "img/pet-cat-2.webp",
  "img/pet-cat-3.webp",
  "img/pet-cat-4.webp",
  "img/pet-chocodragon-1.webp",
  "img/pet-chocodragon-2.webp",
  "img/pet-chocodragon-3.webp",
  "img/pet-chocodragon-4.webp",
  "img/pet-dino-1.webp",
  "img/pet-dino-2.webp",
  "img/pet-dino-3.webp",
  "img/pet-dino-4.webp",
  "img/pet-dog-1.webp",
  "img/pet-dog-2.webp",
  "img/pet-dog-3.webp",
  "img/pet-dog-4.webp",
  "img/pet-dragon-1.webp",
  "img/pet-dragon-2.webp",
  "img/pet-dragon-3.webp",
  "img/pet-dragon-4.webp",
  "img/pet-fox-1.webp",
  "img/pet-fox-2.webp",
  "img/pet-fox-3.webp",
  "img/pet-fox-4.webp",
  "img/pet-giraffe-1.webp",
  "img/pet-giraffe-2.webp",
  "img/pet-giraffe-3.webp",
  "img/pet-giraffe-4.webp",
  "img/pet-hedgehog-1.webp",
  "img/pet-hedgehog-2.webp",
  "img/pet-hedgehog-3.webp",
  "img/pet-hedgehog-4.webp",
  "img/pet-lamb-1.webp",
  "img/pet-lamb-2.webp",
  "img/pet-lamb-3.webp",
  "img/pet-lamb-4.webp",
  "img/pet-mintbunny-1.webp",
  "img/pet-mintbunny-2.webp",
  "img/pet-mintbunny-3.webp",
  "img/pet-mintbunny-4.webp",
  "img/pet-panda-1.webp",
  "img/pet-panda-2.webp",
  "img/pet-panda-3.webp",
  "img/pet-panda-4.webp",
  "img/pet-pony-1.webp",
  "img/pet-pony-2.webp",
  "img/pet-pony-3.webp",
  "img/pet-pony-4.webp",
  "img/pet-turtle-1.webp",
  "img/pet-turtle-2.webp",
  "img/pet-turtle-3.webp",
  "img/pet-turtle-4.webp",
  "img/pet-unicorn-1.webp",
  "img/pet-unicorn-2.webp",
  "img/pet-unicorn-3.webp",
  "img/pet-unicorn-4.webp",
  "img/pet-zebra-1.webp",
  "img/pet-zebra-2.webp",
  "img/pet-zebra-3.webp",
  "img/pet-zebra-4.webp",
  "img/piece-cane.webp",
  "img/piece-choco.webp",
  "img/piece-cone.webp",
  "img/piece-cup.webp",
  "img/piece-gum.webp",
  "img/piece-jelly.webp",
  "img/piece-kiss.webp",
  "img/piece-marsh.webp",
  "img/piece-mint.webp",
  "img/scene-bridge.webp",
  "img/scene-castle.webp",
  "img/scene-forest.webp",
  "img/scene-grove.webp",
  "img/scene-hills.webp",
  "img/scene-lagoon.webp",
  "img/token-1.webp",
  "img/token-2.webp",
  "img/token-3.webp",
  "img/token-4.webp",
  "img/world-1.webp",
  "img/world-2.webp",
  "img/world-3.webp",
  "img/world-4.webp",
  "img/world-5.webp",
  "fonts/baloo2-variable.woff2",
  "fonts/baloo2.css",
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
      keys.filter(k => k.startsWith("spelling-stickers-") && k !== CACHE)
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
