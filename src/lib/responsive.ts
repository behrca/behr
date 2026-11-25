// Builds the "srcset" list that lets the browser pick a photo size that fits the screen.
// The smaller copies are made by scripts/make-thumbs.mjs (in /public/thumbs).
import fs from 'node:fs';
import path from 'node:path';

const WIDTHS = [480, 960, 1280, 1600];

/**
 * srcsetFor('/hero.jpg', 2400) →
 *   "/thumbs/hero-480.jpg 480w, /thumbs/hero-960.jpg 960w, /thumbs/hero-1280.jpg 1280w, /thumbs/hero-1600.jpg 1600w, /hero.jpg 2400w"
 * Pass the photo's full width to also offer the full-size file (for very large screens).
 */
export function srcsetFor(src: string, fullWidth?: number): string | undefined {
	const name = src.replace(/^\//, '').replace(/\.[^.]+$/, '');
	const parts = WIDTHS.filter((w) =>
		fs.existsSync(path.join(process.cwd(), 'public', 'thumbs', `${name}-${w}.jpg`))
	).map((w) => `/thumbs/${name}-${w}.jpg ${w}w`);
	if (fullWidth) parts.push(`${src} ${fullWidth}w`);
	return parts.length ? parts.join(', ') : undefined;
}
