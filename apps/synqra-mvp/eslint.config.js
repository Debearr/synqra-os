const tsParser = require("@typescript-eslint/parser");

function normalizeFilename(filename) {
  return filename.replace(/\\/g, "/");
}

function isAllowedRedirectFile(filename) {
  const normalized = normalizeFilename(filename);
  return normalized === "lib/redirects.ts" || normalized.endsWith("/lib/redirects.ts");
}

function isAllowedUserRoleStateFile(filename) {
  const normalized = normalizeFilename(filename);
  return normalized === "lib/user-role-state.ts" || normalized.endsWith("/lib/user-role-state.ts");
}

function getStaticString(node) {
  if (!node) return null;
  if (node.type === "Literal" && typeof node.value === "string") {
    return node.value;
  }
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis[0]?.value?.cooked ?? null;
  }
  return null;
}

function isRedirectLikeCall(node) {
  const callee = node.callee;
  if (!callee) return false;

  if (callee.type === "Identifier") {
    return callee.name === "redirect";
  }

  if (callee.type === "MemberExpression") {
    const propertyName =
      callee.property.type === "Identifier"
        ? callee.property.name
        : callee.property.type === "Literal" && typeof callee.property.value === "string"
          ? callee.property.value
          : null;

    if (propertyName === "redirect") {
      return true;
    }

    if (
      (propertyName === "push" || propertyName === "replace") &&
      callee.object.type === "Identifier" &&
      callee.object.name === "router"
    ) {
      return true;
    }
  }

  return false;
}

function getRedirectPathArgument(node) {
  const firstArg = node.arguments[0];
  const direct = getStaticString(firstArg);
  if (direct) return direct;

  if (
    firstArg &&
    firstArg.type === "NewExpression" &&
    firstArg.callee.type === "Identifier" &&
    firstArg.callee.name === "URL"
  ) {
    return getStaticString(firstArg.arguments[0]);
  }

  return null;
}

const synqraPlugin = {
  rules: {
    "no-hardcoded-redirects": {
      meta: {
        type: "problem",
        docs: {
          description: "Disallow hardcoded redirect path strings outside lib/redirects.ts",
        },
        schema: [],
      },
      create(context) {
        if (isAllowedRedirectFile(context.filename)) {
          return {};
        }

        return {
          CallExpression(node) {
            if (!isRedirectLikeCall(node)) return;
            const pathArg = getRedirectPathArgument(node);
            if (!pathArg || !pathArg.startsWith("/")) return;

            context.report({
              node,
              message:
                "Hardcoded redirect paths are only allowed in lib/redirects.ts. Use redirect helpers/constants.",
            });
          },
        };
      },
    },
    "no-user-role-assignment": {
      meta: {
        type: "problem",
        docs: {
          description: "Disallow user.role assignment outside lib/user-role-state.ts",
        },
        schema: [],
      },
      create(context) {
        if (isAllowedUserRoleStateFile(context.filename)) {
          return {};
        }

        return {
          AssignmentExpression(node) {
            if (node.operator !== "=") return;
            const left = node.left;
            if (left.type !== "MemberExpression" || left.object.type !== "Identifier") return;
            if (left.object.name !== "user") return;

            if (left.property.type === "Identifier" && left.property.name === "role") {
              context.report({
                node,
                message:
                  "Direct user.role assignment is only allowed in lib/user-role-state.ts.",
              });
              return;
            }

            if (
              left.computed &&
              left.property.type === "Literal" &&
              left.property.value === "role"
            ) {
              context.report({
                node,
                message:
                  "Direct user.role assignment is only allowed in lib/user-role-state.ts.",
              });
            }
          },
        };
      },
    },
  },
};

module.exports = [
  {
    ignores: [
      "**/node_modules/**",
      ".next/**",
      ".next-build/**",
      "**/.next/**",
      "**/.next-build/**",
      "coverage/**",
      "dist/**",
      "build/**",
      "**/coverage/**",
      "**/dist/**",
      "**/build/**",
      "services/cloud-run-worker/dist/**",
      "services/discovery_worker/**",
    ],
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
  },
  {
    files: ["**/*.{js,cjs,mjs,ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      synqra: synqraPlugin,
    },
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
    rules: {
      "synqra/no-hardcoded-redirects": "error",
      "synqra/no-user-role-assignment": "error",
    },
  },
];
