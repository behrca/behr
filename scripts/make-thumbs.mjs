// Makes smaller copies of every photo in /public, so pages can load a size that fits
// instead of the full 2400px photo. Copies go in /public/thumbs, named like
// "hero-960.jpg". Runs automatically before `npm run dev` and `npm run build`; it only
// (re)makes copies that are missing or older than their photo, so it's quick.
//
// To change the sizes, edit WIDTHS here and in src/lib/responsive.ts.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const WIDTHS = [480, 960, 1280, 1600];
const QUALITY = 72;
const PUBLIC = path.resolve('public');
const OUT = path.join(PUBLIC, 'thumbs');
fs.mkdirSync(OUT, { recursive: true });

const photos = fs.readdirSync(PUBLIC).filter((f) => /\.(jpe?g)$/i.test(f));
let made = 0;
for (const file of photos) {
	const src = path.join(PUBLIC, file);
	const name = file.replace(/\.[^.]+$/, '');
	const { width } = await sharp(src).metadata();
	for (const w of WIDTHS) {
		if (w >= width) continue; // no point in a copy that isn't smaller
		const dest = path.join(OUT, `${name}-${w}.jpg`);
		if (fs.existsSync(dest) && fs.statSync(dest).mtimeMs >= fs.statSync(src).mtimeMs) continue;
		await sharp(src).resize({ width: w }).jpeg({ quality: QUALITY, mozjpeg: true }).toFile(dest);
		made++;
	}
}
console.log(`thumbs: ${made ? `made ${made} smaller photo copies` : 'all up to date'}`);
