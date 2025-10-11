import { Jimp, loadFont, HorizontalAlign, VerticalAlign } from "jimp";
import { SANS_32_WHITE } from "jimp/fonts";

async function createIcon(size, file, { maskable = false } = {}) {
  // Solid background with a simple white ring + heart glyph
  const bg = new Jimp({ width: size, height: size, color: "#f5c2c2" }); // soft pink
  const ring = new Jimp({
    width: size - Math.floor(size * 0.14),
    height: size - Math.floor(size * 0.14),
    color: 0x00000000,
  });
  const border = new Jimp({ width: size, height: size, color: "#ffffff" });
  bg.composite(border, 0, 0);
  const margin = Math.floor(size * 0.07);
  const inner = new Jimp({
    width: size - margin * 2,
    height: size - margin * 2,
    color: "#f5c2c2",
  });
  border.composite(inner, margin, margin);
  bg.composite(ring, Math.floor(size * 0.07), Math.floor(size * 0.07));

  // Draw a heart glyph using built-in font
  const font = await loadFont(SANS_32_WHITE);
  const glyph = "❤";
  const textImage = new Jimp({
    width: size,
    height: size,
    color: 0x00000000,
  });
  textImage.print({
    font,
    x: 0,
    y: 0,
    text: {
      text: glyph,
      alignmentX: HorizontalAlign.CENTER,
      alignmentY: VerticalAlign.MIDDLE,
    },
    maxWidth: size,
    maxHeight: size,
  });
  bg.composite(textImage, 0, 0);

  if (maskable) {
    // Add safe padding for maskable rendering
    const pad = Math.floor(size * 0.12);
    const canvas = new Jimp({
      width: size + pad * 2,
      height: size + pad * 2,
      color: "#f5c2c2",
    });
    canvas.composite(bg, pad, pad);
    canvas.resize({ w: size, h: size });
    await canvas.write(file);
  } else {
    await bg.write(file);
  }
}

(async () => {
  await createIcon(192, "public/pwa-192x192.png");
  await createIcon(512, "public/pwa-512x512.png");
  await createIcon(512, "public/pwa-512x512-maskable.png", { maskable: true });
  console.log("Icons written to /public");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
