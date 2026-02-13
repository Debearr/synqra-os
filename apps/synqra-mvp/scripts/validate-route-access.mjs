import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const MIDDLEWARE_PATH = path.join(ROOT, "middleware.ts");

const REQUIRED_ARRAY_ENTRIES = [
  { array: "AUTH_ENTRY_PREFIXES", route: "/enter" },
  { array: "AUTH_ENTRY_PREFIXES", route: "/auth" },
  { array: "USER_PROTECTED_PREFIXES", route: "/journey" },
  { array: "USER_PROTECTED_PREFIXES", route: "/studio" },
  { array: "USER_PROTECTED_PREFIXES", route: "/user" },
  { array: "ADMIN_PROTECTED_PREFIXES", route: "/admin" },
  { array: "FOUNDER_ONLY_PREFIXES", route: "/ops" },
];

function extractArrayValues(source, arrayName) {
  const regex = new RegExp(`const\\s+${arrayName}\\s*=\\s*\\[(.*?)\\]`, "s");
  const match = source.match(regex);
  if (!match) return null;
  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1]);
}

async function main() {
  const source = await fs.readFile(MIDDLEWARE_PATH, "utf8");
  const errors = [];

  for (const check of REQUIRED_ARRAY_ENTRIES) {
    const values = extractArrayValues(source, check.array);
    if (!values) {
      errors.push(`Missing route array '${check.array}'.`);
      continue;
    }
    if (!values.includes(check.route)) {
      errors.push(`Route '${check.route}' is missing from ${check.array}.`);
    }
  }

  if (!source.includes("DEBEAR_OPS_EMAIL")) {
    errors.push("Founder email resolution must include DEBEAR_OPS_EMAIL.");
  }

  if (!source.includes("redirectToSignIn")) {
    errors.push("Expected redirectToSignIn() flow for unauthorized access.");
  }

  if (errors.length > 0) {
    console.error("Route access validation failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log("Route access validation passed.");
}

main().catch((error) => {
  console.error("Route access validation crashed:");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
