import { execSync } from 'child_process'

process.env.BLOG_INCLUDE_TEST = 'true'

let out
try {
  out = execSync('python scripts/download-avatar.py && astro build 2>&1', {
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 120000,
  })
} catch (e) {
  console.error(e.stdout || e.stderr || e.message)
  process.exit(1)
}

const lines = out.split('\n')
for (const line of lines) {
    if (/page\(s\) built|Complete!|\[ERROR\]|^ERROR:/i.test(line)) {
    console.log(line)
  }
}
