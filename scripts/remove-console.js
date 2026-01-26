const ts = require('typescript')
const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const allowedExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const ignoreDirs = new Set(['node_modules', '.git', 'dist', '.next', 'out', 'scripts/demo-images'])
const consoleMethods = new Set(['log', 'error', 'warn', 'info', 'debug', 'trace'])

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (ignoreDirs.has(entry.name)) continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath)
      continue
    }
    if (!allowedExts.has(path.extname(entry.name))) continue
    processFile(fullPath)
  }
}

function processFile(filePath) {
  const sourceText = fs.readFileSync(filePath, 'utf8')
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true)
  const ranges = []

  function visit(node) {
    if (ts.isExpressionStatement(node)) {
      const expr = node.expression
      if (ts.isCallExpression(expr)) {
        const callee = expr.expression
        if (ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression)) {
          const objectName = callee.expression.text
          const methodName = callee.name.text
          if (objectName === 'console' && consoleMethods.has(methodName)) {
            ranges.push([node.getFullStart(), node.getEnd()])
          }
        }
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  if (ranges.length === 0) return
  ranges.sort((a, b) => b[0] - a[0])
  let modified = sourceText
  for (const [start, end] of ranges) {
    modified = modified.slice(0, start) + modified.slice(end)
  }

  if (modified !== sourceText) {
    fs.writeFileSync(filePath, modified)
  }
}

walk(projectRoot)
