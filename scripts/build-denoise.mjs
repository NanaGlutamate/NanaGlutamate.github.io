import { execSync } from 'child_process'

let out
try {
  out = execSync('python scripts/download-avatar.py && astro build', {
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
  if (/page\(s\) built|Complete!|\[ERROR\]/.test(line)) {
    console.log(line)
  }
}
