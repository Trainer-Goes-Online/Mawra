// One-off: optimize the 3 story images -> public/assets/story/*.webp
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = path.join("public", "images");
const OUT = path.join("public", "assets", "story");
fs.mkdirSync(OUT, { recursive: true });

async function make(srcName, outName, width) {
  const src = path.join(SRC, srcName);
  const out = path.join(OUT, outName);
  await sharp(src)
    .resize({ width, withoutEnlargement: false, kernel: "lanczos3" })
    .sharpen()
    .webp({ quality: 90 })
    .toFile(out);
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log(`${srcName} -> assets/story/${outName} (${kb}KB)`);
}

async function run() {
  await make("helped.png", "helped.webp", 1000);     // square before/after
  await make("7 lakh 1.png", "watch-1.webp", 760);   // 16:9 thumbnail
  await make("7 lakh 2.png", "watch-2.webp", 760);   // 16:9 thumbnail
}
run().then(() => console.log("done")).catch((e) => { console.error(e); process.exit(1); });
