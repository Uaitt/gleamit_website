import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';

export const shotWidths = [440, 660];
export const shotSizes = '(max-width: 900px) 220px, 270px';

export const shotAvif = (src: ImageMetadata) => getImage({ src, format: 'avif', widths: shotWidths, sizes: shotSizes });
