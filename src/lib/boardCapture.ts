import { toJpeg } from 'html-to-image';

/**
 * Captures an HTML element into a compressed high-resolution JPEG Data URL
 */
export async function captureNodeAsJpeg(node: HTMLElement): Promise<string> {
  return await toJpeg(node, {
    quality: 0.85,
    pixelRatio: 1.2,
    cacheBust: true,
    skipFonts: true,
    filter: (domNode) => {
      if (domNode instanceof HTMLElement) {
        if (domNode.getAttribute('role') === 'dialog') return false;
        if (domNode.classList.contains('no-capture')) return false;
      }
      return true;
    },
  });
}
