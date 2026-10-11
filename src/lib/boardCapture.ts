import { toJpeg } from 'html-to-image';

/**
 * Captures an HTML element into a compressed high-resolution JPEG Data URL
 */
export async function captureNodeAsJpeg(node: HTMLElement): Promise<string> {
  return await toJpeg(node, {
    quality: 0.82,
    pixelRatio: 1.2,
    cacheBust: true,
  });
}
