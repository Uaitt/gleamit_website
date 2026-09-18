export const pageBackground = { light: 'rgb(231, 242, 236)', dark: 'rgb(17, 20, 24)' };
export const cardBackground = { light: 'rgb(255, 255, 255)', dark: 'rgb(28, 33, 38)' };
export const tealText = { light: '#0c6e64', dark: '#5fd3c2' };
export const tealTextColor = { light: 'rgb(12, 110, 100)', dark: 'rgb(95, 211, 194)' };

/** The WCAG 2.1 contrast ratio between two computed `rgb(...)` colours, highest first. */
export function contrastRatio(a: string, b: string) {
  const luminance = (color: string) => {
    const [r, g, b] = color
      .match(/[\d.]+/g)!
      .slice(0, 3)
      .map((value) => {
        const channel = Number(value) / 255;
        return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const [bright, dim] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (bright + 0.05) / (dim + 0.05);
}
