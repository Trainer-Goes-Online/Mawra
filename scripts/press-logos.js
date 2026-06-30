// Convert press logos (mixed avif/jpeg/png) -> uniform WebP for the chips.
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const DIR = path.join("public", "assets", "press");
const names = ["toi", "hindu", "fittak", "jagran"];
const SRC_EXT = [".png", ".jpg", ".jpeg", ".avif"];

async function run() {
  for (const n of names) {
    const src = SRC_EXT.map((e) => path.join(DIR, n + e)).find((p) => fs.existsSync(p));
    if (!src) { console.log(`${n}: NO source found`); continue; }
    const meta = await sharp(src).metadata();
    const out = path.join(DIR, `${n}.webp`);
    await sharp(src)
      .resize({ width: 360, height: 160, fit: "inside", withoutEnlargement: false })
      .webp({ quality: 92 })
      .toFile(out);
    const after = fs.statSync(out).size;
    console.log(`${n}: ${meta.width}x${meta.height} ${meta.format} -> ${n}.webp (${(after / 1024).toFixed(0)}KB)`);
    // remove the original source + stale svg
    fs.unlinkSync(src);
    const svg = path.join(DIR, `${n}.svg`);
    if (fs.existsSync(svg)) fs.unlinkSync(svg);
  }
}
run().then(() => console.log("done")).catch((e) => { console.error(e); process.exit(1); });
