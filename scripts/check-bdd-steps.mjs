#!/usr/bin/env node

/**
 * BDD Step Coverage Checker
 *
 * Scans all .feature files under tests/e2e/features and verifies that every
 * Given/When/Then/And/But step has a matching implementation in
 * tests/e2e/steps/*.ts (string-based step definitions).
 *
 * Usage:
 *   node scripts/check-bdd-steps.mjs
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const projectRoot = process.cwd()
const featuresDir = path.join(projectRoot, 'tests', 'e2e', 'features')
const stepsDir = path.join(projectRoot, 'tests', 'e2e', 'steps')

const args = process.argv.slice(2)
const catalogFlag = args.includes('--catalog')
const catalogFileArg = args.find((arg) => arg.startsWith('--catalogFile='))
const catalogFilePath = catalogFileArg ? catalogFileArg.split('=')[1] : null
const generateCatalog = catalogFlag || Boolean(catalogFilePath)

async function getFiles(dir, extensions) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await getFiles(entryPath, extensions)))
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      files.push(entryPath)
    }
  }

  return files
}

function extractFeatureSteps(content) {
  const steps = []
  const lines = content.split(/\r?\n/)
  const stepPattern = /^\s*(Given|When|Then|And|But)\s+(.*)$/

  lines.forEach((line, index) => {
    const match = line.match(stepPattern)
    if (!match) return

    const [, keyword, text] = match
    const normalized = text.trim()

    // Ignore empty placeholders (e.g., data tables, doc strings)
    if (!normalized) return

    steps.push({
      keyword,
      text: normalized,
      line: index + 1,
    })
  })

  return steps
}

function getLineFromIndex(content, index) {
  const substring = content.slice(0, index)
  if (!substring) return 1
  const matches = substring.match(/\r?\n/g)
  return (matches ? matches.length : 0) + 1
}

function extractStepDefinitions(content) {
  const definitions = []
  const definitionPattern = /\b(Given|When|Then|And|But)\s*\(\s*(['"`])([\s\S]*?)\2/g

  let match
  while ((match = definitionPattern.exec(content)) !== null) {
    const [, keyword, , text] = match
    const line = getLineFromIndex(content, match.index)
    definitions.push({
      keyword,
      text: text.trim(),
      line,
    })
  }

  return definitions
}

function normalizeStepText(text) {
  return text.replace(/\s+/g, ' ').trim()
}

async function main() {
  const [featureFiles, stepFiles] = await Promise.all([
    getFiles(featuresDir, ['.feature']),
    getFiles(stepsDir, ['.ts']),
  ])

  const featureSteps = new Map()
  for (const file of featureFiles) {
    const content = await readFile(file, 'utf8')
    const steps = extractFeatureSteps(content)
    steps.forEach((step) => {
      const normalized = normalizeStepText(step.text)
      if (!featureSteps.has(normalized)) {
        featureSteps.set(normalized, [])
      }
      featureSteps.get(normalized).push({ file, line: step.line })
    })
  }

  const definitionSteps = new Set()
  const definitionMap = new Map()
  for (const file of stepFiles) {
    const content = await readFile(file, 'utf8')
    const definitions = extractStepDefinitions(content)
    definitions.forEach((def) => {
      const normalized = normalizeStepText(def.text)
      definitionSteps.add(normalized)
      if (!definitionMap.has(normalized)) {
        definitionMap.set(normalized, [])
      }
      definitionMap.get(normalized).push({
        file,
        line: def.line,
        keyword: def.keyword,
      })
    })
  }

  const missingSteps = []
  for (const [text, locations] of featureSteps.entries()) {
    if (!definitionSteps.has(text)) {
      missingSteps.push({ text, locations })
    }
  }

  if (generateCatalog) {
    const catalog = buildCatalog(featureSteps, definitionMap)
    if (catalogFilePath) {
      const resolvedPath = path.isAbsolute(catalogFilePath)
        ? catalogFilePath
        : path.join(projectRoot, catalogFilePath)
      await mkdir(path.dirname(resolvedPath), { recursive: true })
      await writeFile(resolvedPath, catalog, 'utf8')
      console.log(`📘 BDD step catalogue written to ${path.relative(projectRoot, resolvedPath)}`)
    } else {
      console.log(catalog)
    }
  }

  if (missingSteps.length === 0) {
    console.log('✅ All feature steps have implementations.')
    return
  }

  console.error('❌ Missing step implementations detected:\n')
  missingSteps.forEach((step) => {
    console.error(`• "${step.text}"`)
    step.locations.forEach((loc) => {
      const relative = path.relative(projectRoot, loc.file)
      console.error(`   - ${relative}:${loc.line}`)
    })
  })

  process.exitCode = 1
}

function buildCatalog(featureSteps, definitionMap) {
  const header = `# BDD Step Catalogue

_Generated automatically via \`node scripts/check-bdd-steps.mjs --catalog\` on ${new Date().toISOString()}._

| Step Text | Implementations | Feature Usage |
| --- | --- | --- |
`

  const allSteps = new Set([
    ...featureSteps.keys(),
    ...definitionMap.keys(),
  ])
  const sorted = Array.from(allSteps).sort((a, b) => a.localeCompare(b))

  const rows = sorted.map((text) => {
    const implementations = definitionMap.get(text) ?? []
    const usage = featureSteps.get(text) ?? []

    const implCell = implementations.length
      ? implementations
          .map((impl) => `${impl.keyword} – \`${path.relative(projectRoot, impl.file)}:${impl.line}\``)
          .join('<br>')
      : '_(missing)_'

    const usageCell = usage.length
      ? usage
          .map((loc) => `\`${path.relative(projectRoot, loc.file)}:${loc.line}\``)
          .join('<br>')
      : '_(unused)_'

    return `| ${text.replace(/\|/g, '\\|')} | ${implCell} | ${usageCell} |`
  })

  return `${header}${rows.join('\n')}\n`
}

main().catch((err) => {
  console.error('Error while checking BDD steps:', err)
  process.exitCode = 1
})
