// Service worker: shows the "Lost the signal" page (public/offline.html) when someone who has
// visited before opens the site without an internet connection.
//
// It deliberately does NOT save or serve copies of the site's pages, so visitors always get
// the latest version when they're online. It only steps in when loading a page fails.
//
// If you change offline.html or offline-photo.jpg, bump the version number below so
// visitors' browsers pick up the new copy.
const CACHE = 'behr-offline-v2';

// The live site (Cloudflare) serves offline.html at "/offline" and redirects "/offline.html"
// there, so the page is saved from "/offline" (a redirected copy can't be shown in place of
// another page; browsers refuse it with "ERR_FAILED").
const OFFLINE_PAGE = '/offline';
const OFFLINE_FILES = [OFFLINE_PAGE, '/offline-photo.jpg', '/favicon.svg'];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE).then((cache) =>
			Promise.all(
				OFFLINE_FILES.map(async (url) => {
					let res = await fetch(url, { cache: 'reload' });
					// the local preview serves the page at /offline.html instead of /offline
					if (!res.ok && url === OFFLINE_PAGE) res = await fetch('/offline.html', { cache: 'reload' });
					if (!res.ok) throw new Error(`Could not save ${url}`);
					// store a clean copy (not marked as redirected)
					await cache.put(url, new Response(await res.blob(), { headers: res.headers }));
				})
			)
		)
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	// clear out older versions of the offline files
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k.startsWith('behr-offline-') && k !== CACHE).map((k) => caches.delete(k))))
			.then(() => self.clients.claim())
	);
});

// The saved offline page, handed over as a brand-new page so the browser will show it
async function offlinePage() {
	const saved = await caches.match(OFFLINE_PAGE, { cacheName: CACHE });
	if (!saved) return Response.error();
	return new Response(await saved.blob(), {
		status: 200,
		headers: { 'Content-Type': 'text/html; charset=utf-8' },
	});
}

self.addEventListener('fetch', (event) => {
	const req = event.request;

	// Opening a page: try the internet first; if that fails, show the offline page
	if (req.mode === 'navigate') {
		event.respondWith(fetch(req).catch(offlinePage));
		return;
	}

	// The offline page's own photo and icon come from the saved copies when offline
	const path = new URL(req.url).pathname;
	if (OFFLINE_FILES.includes(path)) {
		event.respondWith(
			fetch(req).catch(async () => (await caches.match(path, { cacheName: CACHE })) || Response.error())
		);
	}
});
