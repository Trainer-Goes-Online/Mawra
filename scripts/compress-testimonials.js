// One-off: compress testimonial images to WebP. Run: node scripts/compress-testimonials.js
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

async function run() {
  const results = path.join("public", "assets", "results");
  const reviews = path.join("public", "assets", "reviews");

  for (let n = 1; n <= 5; n++) {
    const src = path.join(results, `${n}.png`);
    if (!fs.existsSync(src)) continue;
    const out = path.join(results, `${n}.webp`);
    const before = fs.statSync(src).size;
    await sharp(src).resize(900, 900, { fit: "cover" }).webp({ quality: 80 }).toFile(out);
    const after = fs.statSync(out).size;
    fs.unlinkSync(src);
    console.log(`results/${n}: ${(before / 1048576).toFixed(1)}MB -> ${(after / 1024).toFixed(0)}KB`);
  }

  for (let n = 1; n <= 6; n++) {
    const src = path.join(reviews, `${n}.jpeg`);
    if (!fs.existsSync(src)) continue;
    const out = path.join(reviews, `${n}.webp`);
    const before = fs.statSync(src).size;
    await sharp(src).resize(900, 900, { fit: "inside" }).webp({ quality: 82 }).toFile(out);
    const after = fs.statSync(out).size;
    fs.unlinkSync(src);
    console.log(`reviews/${n}: ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`);
  }
}
run().then(() => console.log("done")).catch((e) => { console.error(e); process.exit(1); });
