import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const indexPath = resolve(__dirname, "..", "api-zod", "src", "index.ts");

let content = readFileSync(indexPath, "utf8");
content = content
  .split("\n")
  .filter((line) => !line.includes("./generated/types"))
  .join("\n");

writeFileSync(indexPath, content, "utf8");
console.log("Fixed lib/api-zod/src/index.ts — removed ./generated/types re-export");
