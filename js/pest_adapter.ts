// @ts-check

let execFileSync: any
let fs: any
let binaryPath: string = ''

if (typeof window === 'undefined') {
  try {
    const cp = await import('child_process')
    execFileSync = cp.execFileSync
    const url = await import('url')
    const path = (await import('path')).default
    fs = (await import('fs')).default
    const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
    const rootDir = path.resolve(__dirname, '..')
    binaryPath = path.join(rootDir, 'target', 'release', 'diagrammer_pest_parse')
  } catch (_) {}
}

export function runPestBinary(inputCode: string, generatorName?: string): string {
  if (!fs || !fs.existsSync(binaryPath)) {
    throw new Error(`Pest binary not found at ${binaryPath}. Run 'cargo build --release' first.`)
  }
  const args = generatorName ? [generatorName] : []
  return execFileSync(binaryPath, args, {
    input: inputCode,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024
  })
}
