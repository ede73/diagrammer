#!/usr/bin/env node
import * as fs from 'fs'
import { lexParseAndVisualize, getEmptyConfig } from './t.js'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import color from 'colors'
import { type LinesOptions, diffChars, diffJson, diffLines } from 'diff'
import * as path from 'path'
import pixelmatch from 'pixelmatch'
import PNGx from 'pngjs'
import { configSupport, type ConfigType } from '../js/configsupport.js'
const PNG = PNGx.PNG

interface TestSuiteConfig extends ConfigType {
  testInputPath: string
  currentTestRun: string
  previousStableRun: string
  testPatterns: string[]
  webPort: number
  tests: boolean
  visulizer: string
}

const config = configSupport<TestSuiteConfig>('runtests.js', {
  testInputPath: 'tests/test_inputs',
  currentTestRun: 'tests/testrun/current',
  previousStableRun: 'tests/testrun/previous',
  testPatterns: [],
  webPort: 8001
})

function _usage() {
  config.printError('USAGE: [verbose] [trace] [visualizer:testNameRegexPattern')
  process.exit(0)
}

let _collectPort = false
await config.parseCommandLine(process.argv.splice(2), _usage, async (unknownCommandLineOption) => {
  if (_collectPort) {
    _collectPort = false
    config.webPort = Number(unknownCommandLineOption)
    return
  }
  switch (unknownCommandLineOption.toLocaleLowerCase().trim()) {
    case 'webport':
      _collectPort = true
      return
  }
  config.printError(unknownCommandLineOption)
  config.testPatterns.push(unknownCommandLineOption.trim())
})

function _countLineFeeds(str: string) {
  return str.split(/\r\n|\r|\n/).length
}

function _areOneLiners(a: string, b: string) {
  return _countLineFeeds(a.trim()) <= 1 && _countLineFeeds(b.trim()) <= 1
}

function _isJSON(a: string) {
  try { JSON.parse(a) } catch (e) { return false }
  return true
}

// TODO: uh..right now some web visualiziers have a name generator:visualizer (since both use the same gen)
// That doesn't sit well under windows WSL (:), convert that to _ in path names
function sanitizePaths(path: string) {
  return path.replace(/:/g, '_')
}

const failedTests: string[] = []
function currentAndLastRunProduceSameResults(previousRunCodeFile: string, currentGeneratedCode: string) {
  if (currentGeneratedCode.trim() === '') {
    config.printError('Code from currentrun is EMPTY!')
    return false
  }
  const previousRunCodePath = path.normalize(`${process.cwd()}/${previousRunCodeFile}`)
  if (!fs.existsSync(previousRunCodePath) || fs.statSync(previousRunCodePath).size === 0) {
    // probably a new test, new visualizer, new generator, reference code is missing
    config.tp(`Reference code file (${previousRunCodePath}) does not exist(or was empty), first run? Copying the parsed generated text over`)
    fs.writeFileSync(previousRunCodePath, currentGeneratedCode, 'utf8')
    return true
  }

  const codeFromPreviousRun = fs.readFileSync(previousRunCodePath, 'utf8')
  // if outputs are one liners, no point comparing lines :)
  const opts: LinesOptions = {
    ignoreWhitespace: true
  }
  // fucking hell this indent woe
  const differences = (_isJSON(codeFromPreviousRun) && _isJSON(currentGeneratedCode))
    ? diffJson(JSON.parse(codeFromPreviousRun), JSON.parse(currentGeneratedCode), opts)
    : (_areOneLiners(codeFromPreviousRun, currentGeneratedCode)
      // eslint-disable-next-line indent, @typescript-eslint/indent
      ? diffChars(codeFromPreviousRun, currentGeneratedCode, opts)
      // eslint-disable-next-line indent, @typescript-eslint/indent
      : diffLines(codeFromPreviousRun, currentGeneratedCode, opts))

  let filesSame = true

  // avoid printing perfect matches...
  if (differences.filter(p => p.added || p.removed).length === 0) {
    config.tp('No differences between current and old run')
    return true
  }

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

function diffImages(referenceImage: string, outputImage) {
  if (!fs.existsSync(referenceImage)) {
    config.tp(`  Reference visualized graph file (${referenceImage}) does not exist, first run? Copy the current file over`)
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
    config.printError(ex)
    return false
  }
  return true
}

async function runATest(useVisualizer: string, webOnlyVisualizer: boolean, testFileName: string) {
  const cfg = getEmptyConfig()
  cfg.verbose = config.verbose
  cfg.trace = config.trace
  cfg.visualizer = useVisualizer
  cfg.traceProcess = config.traceProcess
  cfg.tests = true
  cfg.webPort = config.webPort
  cfg.input = `${config.testInputPath}/${testFileName}.txt`
  const prevRunPath = `${config.previousStableRun}/${sanitizePaths(useVisualizer)}`
  const currentRunPath = `${config.currentTestRun}/${sanitizePaths(useVisualizer)}`
  cfg.visualizedGraph = `${currentRunPath}/${testFileName}.png`

  config.tp(`lexParseAndVisualize ${testFileName}`)
  await lexParseAndVisualize(cfg, async (error) => {
    if (error && error !== 0) {
      cfg.dumpTraces()
      throw Error(`eh...failed ${useVisualizer} ${cfg.input}`)
    }
    const previousRunPath = `${prevRunPath}`
    const previouslyGeneratedCodeFile = `${previousRunPath}/${testFileName}.txt`
    const errors: string[] = []
    if (!currentAndLastRunProduceSameResults(previouslyGeneratedCodeFile, cfg.parsedCode)) {
      // TODO: store current run, so user can inspect better? Now current run is just kept in memory
      errors.push(`Using visualizer ${useVisualizer}, transpiling ${cfg.input} generated differences compared to previous run ${previouslyGeneratedCodeFile}`)
      failedTests.push(`${cfg.input} !== ${previouslyGeneratedCodeFile}, try: scripts/runtests.js ${useVisualizer}:${testFileName}`)
    }

    // TODO: Can't yet visualize web only renderers
    // compare visualization
    const referenceImage = `${prevRunPath}/${testFileName}.png`
    if (!diffImages(referenceImage, cfg.visualizedGraph)) {
      errors.push(`Using visualizer ${useVisualizer} on ${testFileName}.txt generated graph visualizations differ`)
      failedTests.push(`Visualized graph ${cfg.input} !== ${referenceImage}, try: scripts/runtests.js ${useVisualizer}:${testFileName}`)
    }
    if (errors) {
      for (const error of errors) {
        config.tp(`ERROR: ${error}`)
        config.tp(' You can rerun this test:')
        config.tp(`   scripts/runtests.js ${useVisualizer}:${testFileName}`)
        config.tp(`   If you think new run is correct, just do: rm ${previouslyGeneratedCodeFile}`)
        if (cfg.traces !== '') {
          config.tp(`   Full traces available in ${currentRunPath}/${testFileName}.log`)
          fs.writeFileSync(`${currentRunPath}/${testFileName}.log`, cfg.traces)
        }
      }
    }
  })
}

const testsPath = path.join(process.cwd(), config.testInputPath)
const testFiles = fs.readdirSync(testsPath).map(f => f.replace('.txt', ''))

const testVisualizers = ['dot', 'mscgen', 'plantumlsequence', 'actdiag', 'blockdiag', 'nwdiag', 'seqdiag']

// Some diagrams cant be converted (might be generator limitation or just too expressive diagram)
const exclusions: Record<string, string[]> = {
  dot: ['dendrogram', 'dendrogram_spec']
}

// And for some visualizer/generators also not all diagrams make sense, so limit to these hand picked ones
const onlyTheseTests = {
  nwdiag: ['nwdiag', 'nwdiag2', 'nwdiag3', 'nwdiag5', 'nwdiag_multiple_ips'],
  mscgen: ['events', 'state_conditionals', 'state_sequence', 'state_sequence2'],
  seqdiag: ['events', 'state_conditionals', 'state_sequence', 'state_sequence2'],
  plantumlsequence: ['events', 'state_conditionals', 'state_sequence', 'state_sequence2', 'plantuml_context', 'plantuml_context2'],
  actdiag: ['ast', 'state_group', 'group_group_link'],
  blockdiag: ['ast', 'state_group', 'group_group_link'],
  ast: ['ast'],
  ast_record: ['ast'],
  // make these dynamic
  radialdendrogram: ['dendrogram'],
  reingoldtilford: ['dendrogram', 'dendrogram_spec'],
  layerbands: ['layerbands'],
  parsetree: ['parsetree'],
  sankey: ['sankey', 'sankey2'],
  umlclass: ['umlclass', 'umlclass2', 'umlclass_types']
}

const webOnlyVisualizers = [
  'radialdendrogram', 'reingoldtilford', 'layerbands', 'parsetree', 'sankey', 'umlclass'
]

const waitTests: Array<Promise<void>> = []
const v: string[] = []
for (const visualizer of [...testVisualizers, ...webOnlyVisualizers]) {
  config.tp(`Tests for visualizer (${visualizer})`)
  let runIfTestsRun = () => {
    fs.mkdirSync(`${config.currentTestRun}/${sanitizePaths(visualizer)}`, { recursive: true })
    fs.mkdirSync(`${config.previousStableRun}/${sanitizePaths(visualizer)}`, { recursive: true })
  }
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

    if (exclusions[visualizer]?.includes(testFile)) {
      continue
    }
    if (onlyTheseTests[visualizer] && !onlyTheseTests[visualizer].includes(testFile)) {
      continue
    }

    // Since config is complicated (exclusion, inclusion and default)
    // make sure we don't accidentally run same test twice
    const d = `${visualizer}:${testFile}`
    if (v.includes(d)) {
      throw new Error('This is a test runner config error')
    }
    v.push(d)
    if (runIfTestsRun) {
      runIfTestsRun()
      runIfTestsRun = undefined
    }
    const webOnlyVisualizer = webOnlyVisualizers.includes(visualizer)
    waitTests.push(runATest(visualizer, webOnlyVisualizer, testFile))
  }
}

config.tp('Begin waiting all tests')
await Promise.all(waitTests)
config.tp('Done waiting for all tests')
if (failedTests.length > 0) {
  config.printError('#==================')
  config.printError('Some test failures:')
  for (const test of failedTests) {
    config.printError(`  ${test}`)
  }
  process.exit(10)
} else {
  console.warn('All good!')
}
process.exit(0)
