/**
 * Picture URLs, in one place that is safe in the browser (no server imports, no environment).
 *
 * Cloudinary delivery URLs: the browser gets the best format (AVIF/WebP) and quality it supports, never wider than asked, never
 * upscaled. Each distinct width is generated once by Cloudinary and then cached on its CDN, so the widths are the few the app uses.
 * App URLs name the size in the path (/api/media/<id>/lg).
 */
const WIDTH = { sm: 420, md: 900, lg: 1600 } as const;

/** `original`: the stored file as it is, for pictures that are already optimised (re-encoding them makes them larger) and costs no transformation. */
export function cloudinaryUrl(cloud: string, publicId: string, o: { width?: number; version?: number; original?: boolean } = {}): string {
  const t = o.original ? "" : `${["f_auto", "q_auto", ...(o.width ? [`w_${Math.round(o.width)}`, "c_limit"] : [])].join(",")}/`;
  return `https://res.cloudinary.com/${cloud}/image/upload/${t}${o.version ? `v${o.version}/` : ""}${publicId}`;
}

/** The same picture at another standard size, for thumbnails and grids. */
export function sized(url: string, size: keyof typeof WIDTH): string {
  return url.includes("res.cloudinary.com/") ? url.replace(/w_\d+,c_limit/, `w_${WIDTH[size]},c_limit`) : url.replace("/lg", `/${size}`);
}
