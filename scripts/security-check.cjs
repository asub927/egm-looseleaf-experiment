const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

console.log("🔒 Running pre-commit security verification...")

// 1. Check for secret files or sensitive content in git staged files
try {
  const stagedFiles = execSync("git diff --cached --name-only --diff-filter=ACM", {
    encoding: "utf8",
  })
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean)

  const blockedPatterns = [
    /\.env($|\..+)/i,
    /\.pem$/i,
    /\.key$/i,
    /id_rsa/i,
    /credentials\.json$/i,
    /\.pfx$/i,
    /\.p12$/i,
  ]

  for (const file of stagedFiles) {
    // Check filename
    for (const pattern of blockedPatterns) {
      if (pattern.test(path.basename(file))) {
        console.error(
          `❌ Security Error: Staged file "${file}" matches sensitive file pattern (${pattern}). Commit blocked.`,
        )
        process.exit(1)
      }
    }
  }

  // Check staged diff content for obvious API keys or secrets (skip binary assets; paths can false-positive)
  const textStaged = stagedFiles.filter((f) => !/\.(png|jpe?g|gif|webp|webm|mp4|woff2?)$/i.test(f))
  if (textStaged.length > 0) {
    const { spawnSync } = require("child_process")
    const diffOut = spawnSync("git", ["diff", "--cached", "-U0", "--", ...textStaged], {
      encoding: "utf8",
    })
    const stagedDiff = diffOut.stdout ?? ""
    const secretPatterns = [
      { name: "GitHub Token", regex: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}/ },
      { name: "Generic Private Key", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
      { name: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/ },
      {
        name: "OpenAI/Anthropic API Key",
        regex: /(?<![A-Za-z])sk-(?:ant-api[0-9]{2}-|live-)?[A-Za-z0-9_-]{20,}/,
      },
    ]

    for (const { name, regex } of secretPatterns) {
      if (regex.test(stagedDiff)) {
        console.error(
          `❌ Security Error: Detected potential ${name} in staged diff. Commit blocked.`,
        )
        process.exit(1)
      }
    }
  }
} catch (err) {
  if (err.status) {
    process.exit(err.status)
  }
}

// 2. Validate findings.json and coverage-ledger.json if they exist
const auditDir = path.join(__dirname, "..", ".agents", "skills", "security-audit")
const findingsPath = path.join(__dirname, "..", "findings.json")
const ledgerPath = path.join(__dirname, "..", "coverage-ledger.json")

if (fs.existsSync(findingsPath)) {
  console.log("📋 Validating findings.json against Cloudflare security schema...")
  const validator = path.join(auditDir, "validate-findings.cjs")
  execSync(`node "${validator}" "${findingsPath}"`, { stdio: "inherit" })
}

if (fs.existsSync(ledgerPath)) {
  console.log("📋 Validating coverage-ledger.json against Cloudflare security schema...")
  const validator = path.join(auditDir, "validate-coverage-ledger.cjs")
  execSync(`node "${validator}" "${ledgerPath}"`, { stdio: "inherit" })
}

console.log("✅ Security verification passed.")
