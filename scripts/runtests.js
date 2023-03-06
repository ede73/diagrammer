#!/usr/bin/env node
import * as fs from 'fs'
import { lexParseAndVisualize, getEmptyConfig } from './t.js'
// required for coloring diff output
// eslint-disable-next-line no-unused-vars
import color from 'colors'
import { diffChars, diffJson, diffLines, diffSentences, diffWords } from 'diff'
import * as path from 'path'
import pixelmatch from 'pixelmatch'
import PNGx from 'pngjs'
const PNG = PNGx.PNG

const config = {
  parallel: 12,
  verbose: false,
  trace: false,
  traceProcess: false,
  testInputPath: 'tests/test_inputs',
  currentTestRun: 'tests/testrun/current',
  previousStableRun: 'tests/testrun/previous',
  testPatterns: []
}

function printError (msg) {
  console.error(`${msg}`)
}

function traceProcess (msg) {
  if (config.traceProcess) { console.error(`trace:${msg}`) }
}

function _usage () {
  console.log('USAGE: [parallel n] [verbose] [trace] [visualizer:testNameRegexPattern')
  process.exit(0)
}

let _collectParallel = false
for (const m of process.argv.splice(2)) {
  if (_collectParallel) {
    _collectParallel = false
    config.parallel = m.trim()
    continue
  }
  switch (m.toLocaleLowerCase().trim()) {
    case '-h':
    case '--help':
    case 'help':
      _usage()
      continue
    case 'verbose':
      config.verbose = true
      continue
    case 'trace':
      config.trace = true
      continue
    case 'traceprocess':
      config.traceProcess = true
      continue
    default:
      config.testPatterns.push(m.trim())
  }
}

function _countLineFeeds (str) {
  return str.split(/\r\n|\r|\n/).length
}

function _areOneLiners (a, b) {
  return _countLineFeeds(a.trim()) <= 1 && _countLineFeeds(b.trim()) <= 1
}

function _isJSON (a) {
  try { JSON.parse(a) } catch (e) { return false }
  return true
}

function diff (originalFile, /** @type {string} */compareToText) {
  const inputPath = path.normalize(`${process.cwd()}/${originalFile}`)
  if (!fs.existsSync(inputPath)) {
    // probably a new test, new visualizer, new generator, reference code is missing
    traceProcess(`Reference code file (${inputPath}) does not exist, first run? Copy the parsed generated text over`)
    fs.writeFileSync(inputPath, compareToText, 'utf8')
    return true
  }

  const referenceCode = fs.readFileSync(inputPath, 'utf8')

  // if outputs are one liners, no point comparing lines :)
  const opts = {
    ignoreWhitespace: true
  }
  const differences = _isJSON(referenceCode)
    ? diffJson(JSON.parse(referenceCode), JSON.parse(compareToText), opts)
    : (
        _areOneLiners(referenceCode, compareToText)
          ? diffChars(referenceCode, compareToText, opts)
          : diffLines(referenceCode, compareToText, opts))

  let filesSame = true
  differences.forEach((part) => {
    if (part.added || part.removed) {
      filesSame = false
      const color = part.added
        ? 'green'
        : part.removed ? 'red' : 'grey'
      process.stderr.write(part.value[color])
    } else {
      process.stderr.write(part.value.grey)
    }
  })
  return filesSame
}

async function diffImages (referenceImage, outputImage) {
  if (!fs.existsSync(referenceImage)) {
    traceProcess(`Reference visualized graph file (${referenceImage}) does not exist, first run? Copy the current file over`)
    fs.renameSync(outputImage, referenceImage)
    return true
  }
  const img1 = PNG.sync.read(fs.readFileSync(referenceImage))
  const img2 = PNG.sync.read(fs.readFileSync(outputImage))
  const { width, height } = img1
  const diff = new PNG({ width, height })
  try {
    pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 })
  } catch (ex) {
    printError(ex)
    return false
  }
  return true
}

async function runATest (useVisualizer, webOnlyVisualizer, testFileName) {
  const cfg = Object.assign({}, getEmptyConfig())
  cfg.verbose = config.verbose
  cfg.trace = config.trace
  cfg.dontRunVisualizer = webOnlyVisualizer
  cfg.visualizer = useVisualizer
  cfg.traceProcess = config.traceProcess
  cfg.tests = true
  cfg.input = `${config.testInputPath}/${testFileName}.txt`
  cfg.visualizedGraph = `${config.currentTestRun}/${useVisualizer}/${testFileName}.png`

  traceProcess(`lexParseAndVisualize ${testFileName}`)
  await lexParseAndVisualize(cfg, async (error) => {
    if (error && error !== 0) {
      throw Error(`eh...failed ${useVisualizer} ${testFileName}`)
    }
    const stableRunPath = `${config.previousStableRun}/${useVisualizer}`
    const stableRunCodeFile = `${stableRunPath}/${testFileName}.txt`
    const errors = []
    if (!diff(stableRunCodeFile, cfg.parsedCode)) {
      errors.push(`Using visualizer ${useVisualizer} on ${cfg.input} generated code differs from ${stableRunCodeFile}`)
    }

    // TODO: Can't yet visualize web only renderers
    if (!webOnlyVisualizer) {
      // compare visualization
      const referenceImage = `${config.previousStableRun}/${useVisualizer}/${testFileName}.png`
      if (!await diffImages(referenceImage, cfg.visualizedGraph)) {
        errors.push(`Using visualizer ${useVisualizer} on ${testFileName}.txt generated graph visualizations differ`)
      }
    }
    if (errors) {
      for (const error of errors) {
        printError(`ERROR: ${error}`)
        printError(' You can rerun this test:')
        printError(`   scripts/runtests.js ${useVisualizer}:${testFileName}`)
      }
    }
  })
}

const testsPath = path.join(process.cwd(), config.testInputPath)
const testFiles = fs.readdirSync(testsPath).map(f => f.replace('.txt', ''))

const testVisualizers = ['dot', 'mscgen', 'plantuml_sequence', 'actdiag', 'blockdiag', 'nwdiag', 'seqdiag']

// Some diagrams cant be converted (might be generator limitation or just too expressive diagram)
const exclusions = {
  dot: ['dendrogram', 'dendrogram_spec']
}

// And for some visualizer/generators also not all diagrams make sense, so limit to these hand picked ones
const onlyTheseTests = {
  nwdiag: ['nwdiag', 'nwdiag2', 'nwdiag3', 'nwdiag5', 'nwdiag_multiple_ips'],
  mscgen: ['events', 'state_conditionals', 'state_sequence', 'state_sequence2'],
  seqdiag: ['events', 'state_conditionals', 'state_sequence', 'state_sequence2'],
  plantuml_sequence: ['events', 'state_conditionals', 'state_sequence', 'state_sequence2', 'plantuml_context', 'plantuml_context2'],
  actdiag: ['ast', 'state_group', 'group_group_link'],
  blockdiag: ['ast', 'state_group', 'group_group_link'],
  ast: ['ast'],
  ast_record: ['ast'],
  // make these dynamic
  dendrogram: ['dendrogram'],
  layerbands: ['layerbands'],
  sankey: ['sankey', 'sankey2'],
  umlclass: ['umlclass', 'umlclass2', 'umlclass_types']
}

const webOnlyVisualizers = [
  'dendrogram', 'layerbands', 'sankey', 'umlclass'
]

const waitTests = []
const v = []
for (const visualizer of [...testVisualizers, ...webOnlyVisualizers]) {
  fs.mkdirSync(`${config.currentTestRun}/${visualizer}`, { recursive: true })
  fs.mkdirSync(`${config.previousStableRun}/${visualizer}`, { recursive: true })
  for (const testFile of testFiles) {
    if (config.testPatterns.length > 0) {
      const testMatch = `${visualizer}:${testFile}`
      let matches = false
      for (const testPattern of config.testPatterns) {
        const r = new RegExp(`.*${testPattern}.*`, 'gi')
        if (testMatch.match(r)) {
          matches = true
          break
        }
      }
      if (!matches) continue
    }

    if (exclusions[visualizer] && exclusions[visualizer].includes(testFile)) {
      continue
    }
    if (onlyTheseTests[visualizer] && !onlyTheseTests[visualizer].includes(testFile)) {
      continue
    }

    // Since config is complicated (exclusion, inclusion and default)
    // make sure we don't accidentally run same test twice
    const d = `${visualizer}:${testFile}`
    if (v.includes(d)) {
      throw new Error('THis is a test runner config error')
    }
    v.push(d)
    const webOnlyVisualizer = webOnlyVisualizers.includes(visualizer)
    waitTests.push(runATest(visualizer, webOnlyVisualizer, testFile))
  }
}

traceProcess('Begin waiting all tests')
await Promise.all(waitTests)
traceProcess('Done waiting for all tests')
console.log('All good!')
process.exit(0)
