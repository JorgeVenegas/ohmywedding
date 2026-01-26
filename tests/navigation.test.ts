import assert from 'node:assert'
import { getWeddingPath } from '@/lib/wedding-url'

function setWindow(hostname: string, port = '', protocol = 'http:') {
  ;(globalThis as any).window = {
    location: {
      hostname,
      port,
      protocol,
    },
  }
}

function clearWindow() {
  delete (globalThis as any).window
}

// Subdomain: should not duplicate wedding id in path
setWindow('jorgeandyuli.ohmy.local', '3000')
assert.strictEqual(getWeddingPath('jorgeandyuli'), '/')
assert.strictEqual(getWeddingPath('jorgeandyuli', '/gallery'), '/gallery')
clearWindow()

// Main domain (dev)
setWindow('ohmy.local', '3000')
assert.strictEqual(getWeddingPath('jorgeandyuli'), '/jorgeandyuli')
assert.strictEqual(getWeddingPath('jorgeandyuli', '/gallery'), '/jorgeandyuli/gallery')
clearWindow()

// Localhost path-based
setWindow('localhost', '3000')
assert.strictEqual(getWeddingPath('jorgeandyuli'), '/jorgeandyuli')
assert.strictEqual(getWeddingPath('jorgeandyuli', '/gallery'), '/jorgeandyuli/gallery')
clearWindow()

console.log('navigation tests passed')
