// ponytail: fail-fast env validation for security compliance (Rule 1)

const REQUIRED_ENV_VARS = [
  "NEXTAUTH_SECRET",
  "GITHUB_ID",
  "GITHUB_SECRET",
];

export function validateEnv() {
  // Skip during build / static analysis phase (e.g. Vercel preview build or CI)
  const isBuildPhase =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build" ||
    process.env.NODE_ENV === "test";

  if (isBuildPhase) {
    return;
  }

  for (const name of REQUIRED_ENV_VARS) {
    if (!process.env[name]) {
      console.error(`FATAL: Required environment variable "${name}" is not set. Refusing to start.`);
      process.exit(1);
    }
  }
}

validateEnv();
