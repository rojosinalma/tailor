// Sample pictures for the examples: drawings of a known size, as data addresses, so no file is fetched.

/** A drawing of `width` × `height` pixels: a grid, a few shapes and its size written in the middle. */
export function drawing(width: number, height: number): string {
  const step = Math.max(20, Math.round(Math.min(width, height) / 9));
  const lines: string[] = [];
  for (let x = step; x < width; x += step) lines.push(`M${x} 0V${height}`);
  for (let y = step; y < height; y += step) lines.push(`M0 ${y}H${width}`);
  const u = Math.min(width, height) / 10;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="#eef1f5"/>`,
    `<path d="${lines.join("")}" stroke="#c9d1dc" stroke-width="1"/>`,
    `<rect x="${u}" y="${u}" width="${width / 2 - u}" height="${height / 2 - u}" fill="#9fb4cc" stroke="#33465c" stroke-width="${u / 12}"/>`,
    `<rect x="${width / 2 + u / 2}" y="${height / 2}" width="${width / 2 - u * 1.5}" height="${height / 2 - u * 2}" fill="#c7d6a8" stroke="#3f5229" stroke-width="${u / 12}"/>`,
    `<circle cx="${width * 0.75}" cy="${height * 0.25}" r="${u * 1.4}" fill="#e3b98f" stroke="#6b4423" stroke-width="${u / 12}"/>`,
    `<text x="${width / 2}" y="${height - u * 0.5}" text-anchor="middle" font-family="sans-serif" font-size="${u * 0.8}" fill="#33465c">${width} × ${height}</text>`,
    "</svg>",
  ].join("");
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
