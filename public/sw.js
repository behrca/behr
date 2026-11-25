// Service worker: shows the "Lost the signal" page (/offline.html) when someone who has
// visited before opens the site without an internet connection.
//
// It deliberately does NOT save or serve copies of the site's pages, so visitors always get
// the latest version when they're online. It only steps in when loading a page fails.
//
// If you change offline.html or offline-photo.jpg, bump the version number below so
// visitors' browsers pick up the new copy.
const CACHE = 'behr-offline-v1';
const OFFLINE_FILES = ['/offline.html', '/offline-photo.jpg', '/favicon.svg'];

self.addEventListener('install', (event) => {
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_FILES)));
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

self.addEventListener('fetch', (event) => {
	const req = event.request;

	// Opening a page: try the internet first; if that fails, show the offline page
	if (req.mode === 'navigate') {
		event.respondWith(fetch(req).catch(() => caches.match('/offline.html')));
		return;
	}

	// The offline page's own photo and icon come from the saved copies when offline
	const path = new URL(req.url).pathname;
	if (OFFLINE_FILES.includes(path)) {
		event.respondWith(fetch(req).catch(() => caches.match(path)));
	}
});
