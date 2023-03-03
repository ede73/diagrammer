#!/usr/bin/env node
import * as fs from 'fs'
import { exec, spawn } from 'child_process'
import { lexParseAndVisualize, config as mainconfig } from './t.js'
import { diffLines } from 'diff'
import * as path from 'path'
import color from 'colors'
import pixelmatch from 'pixelmatch'
import PNGx from 'pngjs'
const PNG = PNGx.PNG

const config = {
  parallel: 12,
  verbose: false,
  testInputPath: 'tests/test_inputs',
  testOutputPath: 'tests/test_outputs',
  referenceImagePath: 'tests/reference_images',
  testPatterns: []
}

function printError (msg) {
  console.error(`${msg}`)
}

function traceProcess (msg) {
  // console.log(`${process.hrtime.bigint()} trace:${msg}`)
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
      mainconfig.verbose = true
      continue
    case 'trace':
      mainconfig.verbose = true
      continue
    default:
      config.testPatterns.push(m.trim())
  }
}

function diff (originalFile, compareToText) {
  const inputPath = path.normalize(`${process.cwd()}/${originalFile}`)
  if (!fs.existsSync(inputPath)) {
    // probably a new test, new visualizer, new generator, reference code is missing
    fs.writeFileSync(inputPath, compareToText, 'utf8')
    return true
  }

  const referenceCode = fs.readFileSync(inputPath, 'utf8')
  const differences = diffLines(referenceCode, compareToText, {
    ignoreWhitespace: true
  })

  let filesSame = true
  differences.forEach((part) => {
    if (part.added || part.removed) {
      filesSame = false
      const color = part.added
        ? 'green'
        : part.removed ? 'red' : 'grey'
      process.stderr.write(part.value[color])
    }
  })
  return filesSame
}

function diffImages (referenceImage, outputImage) {
  if (!fs.existsSync(referenceImage)) {
    traceProcess(' REFERENCE IMAGE DOESNT EXIST...COPY OVER')
    fs.renameSync(outputImage, referenceImage)
    return true
  }
  traceProcess(` load ${referenceImage}`)
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
  const cfg = Object.assign({}, mainconfig)
  cfg.dontRunVisualizer = webOnlyVisualizer
  cfg.visualizer = useVisualizer
  cfg.input = `${config.testInputPath}/${testFileName}.txt`
  cfg.visualizedGraph = `${config.testOutputPath}/${testFileName}_${useVisualizer}.png`

  const referenceImagePath = `${config.referenceImagePath}/${useVisualizer}`
  const referenceCode = `${referenceImagePath}/${testFileName}_${useVisualizer}.out`

  await lexParseAndVisualize(cfg, () => {
    const errors = []

    if (!diff(referenceCode, cfg.parsedCode)) {
      errors.push(`Using visualizer ${useVisualizer} on ${cfg.input} generated code differs from ${referenceCode}`)
    }

    // TODO: Can't yet visualize web only renderers
    if (!webOnlyVisualizer) {
      // compare visualization
      const referenceImage = `${config.referenceImagePath}/${useVisualizer}/${testFileName}_${useVisualizer}.png`
      if (!diffImages(referenceImage, cfg.visualizedGraph)) {
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

const testVisualizers = ['dot', 'actdiag', 'blockdiag', 'nwdiag', 'mscgen', 'seqdiag', 'plantuml_sequence']

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
  umlclass: ['umlclass', 'umlclass2']
}

const webOnlyVisualizers = [
  'dendrogram', 'layerbands', 'sankey', 'umlclass'
]

const waitTests = []
fs.mkdirSync(config.testOutputPath, { recursive: true })
for (const visualizer of testVisualizers) {
  fs.mkdirSync(`${config.referenceImagePath}/${visualizer}`, { recursive: true })
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
    const webOnlyVisualizer = webOnlyVisualizers.includes(visualizer)
    waitTests.push(runATest(visualizer, webOnlyVisualizer, testFile))
  }
}

traceProcess(-1, 'Begin waiting all tests')
await Promise.all(waitTests)
traceProcess(-1, 'Done waiting for all tests')
console.log('All good!')
