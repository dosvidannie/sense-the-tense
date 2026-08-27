import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const exportDir = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(exportDir, "dist");
const builtHtml = await readFile(path.join(distDir, "index.html"), "utf8");

const cssMatch = builtHtml.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/);
const jsMatch = builtHtml.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);

if (!cssMatch || !jsMatch) {
  throw new Error("Не удалось найти собранные стили или скрипт.");
}

const css = (await readFile(path.join(distDir, cssMatch[1]), "utf8")).replace(
  /<\/style/gi,
  "<\\/style",
);
const js = (await readFile(path.join(distDir, jsMatch[1]), "utf8")).replace(
  /<\/script/gi,
  "<\\/script",
);
const singleHtml = builtHtml
  .replace(cssMatch[0], () => `<style>${css}</style>`)
  .replace(jsMatch[0], () => `<script type="module">${js}</script>`);

const outputPath = path.resolve(exportDir, "..", "Sense the Tense.html");
await writeFile(outputPath, singleHtml, "utf8");
console.log(outputPath);
