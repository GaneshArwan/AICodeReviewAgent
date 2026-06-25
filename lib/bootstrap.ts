// ponytail: fail-fast env validation for security compliance (Rule 1)

const REQUIRED_ENV_VARS = [
  "NEXTAUTH_SECRET",
  "GITHUB_ID",
  "GITHUB_SECRET",
];

export function validateEnv() {
  for (const name of REQUIRED_ENV_VARS) {
    if (!process.env[name]) {
      console.error(`FATAL: Required environment variable "${name}" is not set. Refusing to start.`);
      process.exit(1);
    }
  }
}

validateEnv();
