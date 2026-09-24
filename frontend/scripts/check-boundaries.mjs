// Fails when an import breaks the frontend's layering:
//   app → features → shared, features talk to each other only through their index.ts.
// Run: npm run check:boundaries
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const src = new URL('../src', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else if (/\.(ts|tsx|mjs)$/.test(name)) files.push(path)
  }
}
walk(src)

const problems = []
for (const file of files) {
  const path = relative(src, file).split(sep).join('/')
  const [layer, feature] = path.split('/')
  const text = readFileSync(file, 'utf8')
  for (const [, target] of text.matchAll(/from '([^']+)'|import\('([^']+)'\)/g)) {
    if (!target) continue
    const say = (reason) => problems.push(`${path}: '${target}' ${reason}`)
    if (target.startsWith('../../')) say('reaches up two folders; use the @/ alias')
    if (layer === 'shared' && /^@\/(features|app)\b/.test(target)) say('shared code must not depend on features or app')
    if (layer === 'features' && target.startsWith('@/app')) say('features must not depend on app')
    const deep = target.match(/^@\/features\/([^/]+)\/.+/)
    if (deep) say(`reaches inside the ${deep[1]} feature; import from '@/features/${deep[1]}'`)
    const own = target.match(/^@\/features\/([^/]+)$/)
    if (own && layer === 'features' && own[1] === feature) say('imports its own feature through index.ts; use a relative path')
  }
}

if (problems.length) {
  console.error(`Import boundary problems:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
console.log(`Import boundaries OK (${files.length} files).`)
