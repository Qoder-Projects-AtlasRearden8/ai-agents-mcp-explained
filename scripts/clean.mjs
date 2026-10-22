import { rm } from "node:fs/promises";

await rm(new URL("../site", import.meta.url), { recursive: true, force: true });
console.log("Removed site/");
