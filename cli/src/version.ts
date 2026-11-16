/** Semantic versions: "2.0.0", "2.1.0-dev.3". */

/** major.minor.patch, an optional pre-release tag, optional build metadata (which never counts). */
const PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z.-]+)?$/;

export const isVersion = (text: string): boolean => PATTERN.test(text);

/** True for "2.0.0-rc.1", false for "2.0.0" and for "2.0.0+build.5". */
export const isPrerelease = (version: string): boolean => PATTERN.exec(version)?.[4] !== undefined;

/** Negative when a < b, 0 when equal, positive when a > b. A pre-release sorts before its release. */
export function compareVersions(a: string, b: string): number {
  const pa = PATTERN.exec(a);
  const pb = PATTERN.exec(b);
  if (!pa || !pb) throw new Error(`Not a version: ${pa ? b : a}`);
  for (let i = 1; i <= 3; i++) {
    const d = Number(pa[i]) - Number(pb[i]);
    if (d !== 0) return d;
  }
  const ra = pa[4];
  const rb = pb[4];
  if (ra === rb) return 0;
  if (ra === undefined) return 1;
  if (rb === undefined) return -1;
  const xa = ra.split(".");
  const xb = rb.split(".");
  for (let i = 0; i < Math.max(xa.length, xb.length); i++) {
    const ia = xa[i];
    const ib = xb[i];
    if (ia === undefined) return -1;
    if (ib === undefined) return 1;
    const na = /^\d+$/.test(ia);
    const nb = /^\d+$/.test(ib);
    if (na && nb) {
      const d = Number(ia) - Number(ib);
      if (d !== 0) return d;
    } else if (na !== nb) return na ? -1 : 1;
    else if (ia !== ib) return ia < ib ? -1 : 1;
  }
  return 0;
}

/** True when `version` lies in the range (from, to]. */
export const isBetween = (version: string, from: string, to: string): boolean =>
  compareVersions(version, from) > 0 && compareVersions(version, to) <= 0;
