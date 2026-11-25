// Architecture rules. See docs/architecture.md for the why behind each one.
// GUARDRAIL FILE: do not edit to make a check pass. Changes need the `guardrail-change` PR label.

// pnpm resolves packages to node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>/, so package
// patterns must match "node_modules/<pkg>/" anywhere in the path, not only at the start.
const pkg = (names) => `(^|/)node_modules/(${names.join("|")})/`;

// Files that only run under test.
const TEST_FILE = "\\.(test|contract)\\.ts$|(^|/)test-db\\.ts$";

// npm packages any src file may import. Everything else is a vendor SDK and belongs in a *.adapter.ts.
// Adding a package here is an architecture decision: say why in the PR.
const APPROVED_PACKAGES = [
  "next",
  "react",
  "react-dom",
  "zod",
  // The packages below are approved but confined to one place by their own rule further down.
  "drizzle-orm",
  "pg",
  "pino",
  "better-auth",
  "@t3-oss/env-nextjs",
];

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment:
        "Circular imports hide design problems. Extract the shared part or invert the dependency.",
      from: {},
      to: { circular: true },
    },
    {
      name: "not-to-unresolvable",
      severity: "error",
      comment:
        "Import points at something that does not exist. Check the path or install the package.",
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: "domain-is-pure",
      severity: "error",
      comment:
        "Domain code is pure business rules. It may import only its own domain folder and src/platform/errors.ts. No I/O, frameworks, vendors or other layers. Move the import to the service.",
      from: { path: "^src/modules/([^/]+)/domain/", pathNot: TEST_FILE },
      to: { pathNot: ["^src/modules/$1/domain/", "^src/platform/errors\\.ts$"] },
    },
    {
      name: "modules-via-public-api",
      severity: "error",
      comment:
        "Import another module only through its index.ts. If what you need is not exported, export it there on purpose.",
      from: { path: "^src/modules/([^/]+)/" },
      to: {
        path: "^src/modules/[^/]+/",
        pathNot: ["^src/modules/$1/", "^src/modules/[^/]+/index\\.ts$"],
      },
    },
    {
      name: "app-uses-modules-not-internals",
      severity: "error",
      comment:
        "src/app is routes only. Call a module's public API (its index.ts). Never import module internals, integrations or the database from a route.",
      from: { path: "^src/app/" },
      to: { path: "^src/(integrations|platform/db)/|^src/modules/[^/]+/(?!index\\.ts$)" },
    },
    {
      name: "integrations-via-public-api",
      severity: "error",
      comment:
        "Import an integration only through its index.ts, and depend on the port type, not the adapter.",
      from: { pathNot: "^src/integrations/" },
      to: { path: "^src/integrations/[^/]+/(?!index\\.ts$)" },
    },
    {
      name: "integrations-are-independent",
      severity: "error",
      comment:
        "An integration wraps one vendor. It must not import another integration, a module or a route.",
      from: { path: "^src/integrations/([^/]+)/" },
      to: { path: "^src/(modules|app|integrations)/", pathNot: "^src/integrations/$1/" },
    },
    {
      name: "modules-do-not-import-app",
      severity: "error",
      comment: "Dependencies point inward: app -> modules. A module must not know about routes.",
      from: { path: "^src/modules/" },
      to: { path: "^src/app/" },
    },
    {
      name: "platform-is-a-leaf",
      severity: "error",
      comment:
        "src/platform is cross-cutting plumbing. It must not import modules, integrations or routes.",
      from: { path: "^src/platform/" },
      to: { path: "^src/(modules|integrations|app)/" },
    },
    {
      name: "vendor-sdks-only-in-adapters",
      severity: "error",
      comment:
        "Third-party SDKs are imported only in src/integrations/<vendor>/<vendor>.adapter.ts, behind a port. See docs/integrations.md. If this is a general-purpose library rather than a vendor, add it to APPROVED_PACKAGES in a guardrail-change PR.",
      from: { path: "^src/", pathNot: `\\.adapter\\.ts$|${TEST_FILE}` },
      to: {
        dependencyTypes: [
          "npm",
          "npm-dev",
          "npm-optional",
          "npm-peer",
          "npm-no-pkg",
          "npm-unknown",
        ],
        pathNot: pkg(APPROVED_PACKAGES),
      },
    },
    {
      name: "adapters-live-in-integrations",
      severity: "error",
      comment:
        "A *.adapter.ts file is the one place a vendor SDK is imported. It must live in src/integrations/<vendor>/.",
      from: { path: "\\.adapter\\.ts$", pathNot: "^src/integrations/[^/]+/" },
      to: {},
    },
    {
      name: "db-access-only-in-repos",
      severity: "error",
      comment:
        "Only *.repo.ts and *.table.ts (plus src/platform/db and src/platform/auth) touch the database. A module's index.ts may import the db client to wire its repo. Services call the repo.",
      from: {
        path: "^src/",
        pathNot: `\\.(repo|table)\\.ts$|^src/platform/(db|auth)/|^src/modules/[^/]+/index\\.ts$|${TEST_FILE}`,
      },
      to: { path: `${pkg(["drizzle-orm", "pg", "@electric-sql/[^/]+"])}|^src/platform/db/` },
    },
    {
      name: "logger-is-the-only-pino",
      severity: "error",
      comment:
        "Import the logger from src/platform/logger.ts. Do not create pino instances elsewhere.",
      from: { pathNot: "^src/platform/logger\\.ts$" },
      to: { path: pkg(["pino"]) },
    },
    {
      name: "auth-library-stays-in-platform-auth",
      severity: "error",
      comment:
        "better-auth is confined to src/platform/auth so the provider can be swapped (ADR 0003). Use the helpers exported there.",
      from: { pathNot: "^src/platform/auth/" },
      to: { path: pkg(["better-auth", "@better-auth/[^/]+"]) },
    },
    {
      name: "env-library-stays-in-env",
      severity: "error",
      comment: "Read config through the `env` object from src/platform/env.ts.",
      from: { pathNot: "^src/platform/env\\.ts$" },
      to: { path: pkg(["@t3-oss/[^/]+"]) },
    },
    {
      name: "no-dev-deps-in-production-code",
      severity: "error",
      comment:
        "Production code imports a devDependency. Move the package to dependencies or the code to a test file.",
      from: { path: "^src/", pathNot: TEST_FILE },
      to: { dependencyTypes: ["npm-dev"], dependencyTypesNot: ["type-only"] },
    },
    {
      name: "no-test-code-in-production-code",
      severity: "error",
      comment: "Production code must not import test files or test helpers.",
      from: { path: "^src/", pathNot: TEST_FILE },
      to: { path: TEST_FILE },
    },
  ],
  options: {
    // Follow `import type` too, so type-only imports cannot be used to dodge a boundary.
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    doNotFollow: { path: "node_modules" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      mainFields: ["module", "main", "types", "typings"],
    },
  },
};
