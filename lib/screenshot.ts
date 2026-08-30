/**
 * Full-page screenshot capture for a live wedding invitation, at desktop and
 * mobile sizes, using a real headless browser (Puppeteer) instead of a DOM
 * screenshot library — this is what correctly triggers scroll-based reveal
 * animations and avoids the fixed-nav duplication/cropping issues that
 * browser devtools screenshots run into.
 *
 * The output is two shots stitched vertically: the closed envelope screen on
 * top, then the full invitation below it (with the envelope/curtain skipped).
 * That mirrors what a guest actually sees — the envelope first, then everything
 * inside once it's opened.
 *
 * Production (Vercel) uses @sparticuz/chromium, a serverless-compatible
 * Chromium binary. Local development uses a locally installed Chrome.
 */

import sharp from 'sharp'
import type { Browser, Page } from 'puppeteer-core'

export type ScreenshotDevice = 'desktop' | 'mobile'

// 'page' = full invitation, envelope/curtain skipped; 'envelope' = just the closed
// envelope screen. page-client.tsx reads window.__omwCapture to switch behaviour.
type CaptureMode = 'page' | 'envelope'

const VIEWPORTS: Record<ScreenshotDevice, { width: number; height: number; isMobile: boolean; hasTouch: boolean }> = {
  desktop: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true }, // iPhone 14-ish
}

// Chromium silently truncates (crops) a captured image instead of throwing once its
// rendered height exceeds its internal max texture/canvas size — a tall full-page
// invitation at a high device-scale factor can cross that line with no error at all,
// which is why the previous try/catch-and-retry-at-1x didn't catch it. Instead we
// measure the real page height up front and pick the highest scale factor (capped at
// 2x) that stays under this conservative ceiling, so nothing ever gets clipped.
const MAX_CAPTURE_PIXEL_HEIGHT = 12000

const MOBILE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'

function isServerlessEnv(): boolean {
  return !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
}

// Headless Chrome has no real GPU to hand WebGL, and without an explicit software
// renderer it silently fails to create a WebGL context — the venue map (a Google Maps
// WebGL vector map, not raster tiles) then renders as a permanent blank grey box.
//
// @sparticuz/chromium ALREADY sets `--use-gl=angle --use-angle=swiftshader` and extracts
// its SwiftShader driver, so on serverless we only layer on the two non-conflicting
// extras. Passing a second, different `--use-angle` value (an earlier version used the
// bogus `swiftshader-webgl`) silently breaks ANGLE init and was why the map went blank
// in production. Local Chrome gets the full set since it configures none of this itself.
const WEBGL_EXTRA_ARGS = [
  '--enable-webgl',
  // Chrome is deprecating the automatic fallback to software WebGL; opt in explicitly.
  '--enable-unsafe-swiftshader',
]
const LOCAL_WEBGL_ARGS = [
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--ignore-gpu-blocklist',
  ...WEBGL_EXTRA_ARGS,
]

async function launchBrowser() {
  const puppeteer = await import('puppeteer-core')

  if (isServerlessEnv()) {
    // @sparticuz/chromium only unpacks its bundled shared libraries (libnss3.so, …) and
    // sets LD_LIBRARY_PATH when it recognizes the Lambda runtime, which it detects from a
    // "<major>.x" marker in AWS_EXECUTION_ENV / AWS_LAMBDA_JS_RUNTIME. Vercel's Node
    // runtime doesn't reliably expose that marker, so without this nudge Chromium launches
    // with no libs and dies with "libnss3.so: cannot open shared object file". Must run
    // before the package is first imported — it wires LD_LIBRARY_PATH at module load.
    if (!/\b\d+\.x\b/.test(process.env.AWS_EXECUTION_ENV ?? '') && !/\b\d+\.x\b/.test(process.env.AWS_LAMBDA_JS_RUNTIME ?? '')) {
      // AWS_LAMBDA_JS_RUNTIME only (leave AWS_EXECUTION_ENV alone — other libs read it):
      // @sparticuz/chromium's detection accepts either, and this alone selects the right
      // (AL2 vs AL2023) lib bundle from the running Node major version.
      process.env.AWS_LAMBDA_JS_RUNTIME = `nodejs${process.versions.node.split('.')[0]}.x`
    }

    const chromium = (await import('@sparticuz/chromium')).default
    return puppeteer.launch({
      args: [...chromium.args, ...WEBGL_EXTRA_ARGS],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    })
  }

  // Local development — point at a locally installed Chrome. Override with
  // CHROME_EXECUTABLE_PATH if Chrome isn't at the OS-default location.
  const executablePath =
    process.env.CHROME_EXECUTABLE_PATH ||
    (process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : '/usr/bin/google-chrome')

  return puppeteer.launch({ executablePath, headless: true, args: LOCAL_WEBGL_ARGS })
}

// Makes CSS transitions/animations resolve instantly instead of playing out over their
// normal duration, and separately forces reveal-on-scroll content to its final visible
// state. Two rounds of trial and error landed on this specific shape:
//
// Round 1 forced `opacity: 1` on every element. That broke a *permanent* semi-transparent
// design overlay — hero/banner sections render a photo behind a color scrim at
// `style={{ opacity: overlayOpacity / 100 }}` (~40%, meant to tint the photo, not hide
// it) — forcing that to 1 turned it fully opaque, blacking out an otherwise correctly
// loaded photo.
//
// Round 2 removed the opacity override entirely, trusting the real reveal mechanism (an
// IntersectionObserver flips a React `isVisible` state that swaps the Tailwind class
// `opacity-0` for `opacity-100` — see hooks/use-scroll-animation.ts) to resolve on its
// own via the scroll walk below. That broke everything *except* images: `triggerOnce` is
// false on that hook, so as soon as the walk scrolls back to the top at the end (needed
// so the final screenshot isn't mid-scroll), every section's observer fires "no longer
// intersecting" and flips `isVisible` back to false — re-hiding all of it right before
// capture. Images were never gated by this hook in the first place, which is why only
// they survived.
//
// This version targets the exact mechanism instead of guessing at a blanket rule: the
// hidden state is *always* the literal Tailwind class `opacity-0` (confirmed by grepping
// every isVisible-gated section), which the scrim above never carries — it's inline
// style, not a class, so it's untouched. The one thing that *does* also use the literal
// `opacity-0` class for a real hidden-by-design state is a lightbox/modal backdrop
// (`fixed inset-0 ... opacity-0` until clicked open) — force that to 1 too and every
// gallery/dress-code lightbox pops open over the whole page. Every such backdrop in this
// codebase uses `fixed` positioning and no legitimate reveal-gated content does, so
// `:not(.fixed)` is the reliable way to tell them apart.
const CAPTURE_MODE_CSS = `
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-delay: 0s !important;
    transition-duration: 0.001ms !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
  }
  .opacity-0:not(.fixed) {
    opacity: 1 !important;
    /* translateY(0), not the literal keyword "none" — see the note above this constant.
       A non-"none" transform value (including an identity one) establishes a CSS
       containing block for any position:absolute descendant; the literal "none" keyword
       removes it, which sent a card's absolutely-positioned decorative shadow layer to
       whatever ancestor came next instead of its intended parent. Tailwind's own
       translate-y-0 class computes to an identity matrix, never literally "none", which
       is why the naturally-revealed state never had this problem. */
    transform: translateY(0) !important;
  }
`

// Runs before any of the page's own scripts, on every navigation. Flags the capture
// mode for page-client.tsx / lib/animation-preference.ts (window globals rather than a
// query param, since the subdomain-enforcement redirect in middleware.ts strips query
// strings), injects the reveal CSS, and neutralizes IntersectionObserver so
// useScrollAnimation's isVisible can't be flipped back mid-capture.
function installCapturePrelude(page: Page, mode: CaptureMode) {
  return page.evaluateOnNewDocument((css: string, captureMode: string) => {
    // evaluateOnNewDocument runs in EVERY frame, including the Google Maps iframe — and
    // Maps uses IntersectionObserver internally to decide when to initialize, so a NoOp
    // there leaves the map a blank box. The zero-duration animation CSS would break its
    // rendering too. Everything here is only meaningful in the top document, so bail out
    // of subframes entirely.
    if (window !== window.top) return

    ;(window as unknown as { __omwCapture?: string }).__omwCapture = captureMode
    ;(window as unknown as { __omwForceNoAnimations?: boolean }).__omwForceNoAnimations = true

    const inject = () => {
      // documentElement is usually present by the time this fires, but not guaranteed on
      // fast local loads — retry next frame rather than silently skipping the override.
      if (!document.documentElement) {
        requestAnimationFrame(inject)
        return
      }
      const style = document.createElement('style')
      style.textContent = css
      document.documentElement.appendChild(style)
    }
    inject()

    class NoOpIntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return [] }
    }
    // @ts-expect-error — deliberately replacing the browser global for the capture session only
    window.IntersectionObserver = NoOpIntersectionObserver
  }, CAPTURE_MODE_CSS, mode)
}

// Vertically concatenate two PNGs (envelope on top, invitation below), normalizing the
// top image to the bottom one's width so a scale-factor mismatch between the two shots
// doesn't misalign them.
async function stitchVertical(top: Buffer, bottom: Buffer): Promise<Buffer> {
  const bottomMeta = await sharp(bottom).metadata()
  const width = bottomMeta.width ?? 0
  const bottomHeight = bottomMeta.height ?? 0

  const topResized = await sharp(top).resize({ width }).png().toBuffer()
  const topHeight = (await sharp(topResized).metadata()).height ?? 0

  return sharp({
    create: {
      width,
      height: topHeight + bottomHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      { input: topResized, top: 0, left: 0 },
      { input: bottom, top: topHeight, left: 0 },
    ])
    .png()
    .toBuffer()
}

export async function captureWeddingScreenshot(url: string, device: ScreenshotDevice): Promise<Buffer> {
  const browser = await launchBrowser()
  try {
    const envelopeShot = await captureEnvelopeShot(browser, url, device)
    const pageShot = await capturePageShot(browser, url, device)
    return await stitchVertical(envelopeShot, pageShot)
  } finally {
    await browser.close()
  }
}

// The closed envelope screen only — a single fixed-position viewport, no scroll walk.
async function captureEnvelopeShot(browser: Browser, url: string, device: ScreenshotDevice): Promise<Buffer> {
  const page = await browser.newPage()
  try {
    const { width, height, isMobile, hasTouch } = VIEWPORTS[device]
    page.on('pageerror', err => console.error('[screenshot:envelope] page error:', err))

    await page.setViewport({ width, height, deviceScaleFactor: 2, isMobile, hasTouch })
    if (device === 'mobile') await page.setUserAgent(MOBILE_USER_AGENT)
    await installCapturePrelude(page, 'envelope')

    // domcontentloaded, not networkidle0 — this shot only needs the envelope overlay, not
    // the whole invitation (and its map tiles) that render underneath it.
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // Wait for the envelope screen to be in the DOM, then for the page-config fetch it
    // depends on for colors/fonts/decoration (kicked off after mount) to settle, then let
    // the webfont + decoration image load.
    await page.waitForSelector('[data-envelope-screen]', { timeout: 15000 }).catch(() => {})
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 8000 }).catch(() => {})
    await page.evaluate(() => (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts?.ready).catch(() => {})
    await page.evaluate(async () => {
      // Bounded — a single stuck image's decode() promise never settles, and would
      // otherwise hang this evaluate past the CDP protocol timeout.
      const deadline = Date.now() + 8000
      const withDeadline = (p: Promise<unknown>) =>
        Promise.race([p.catch(() => {}), new Promise(r => setTimeout(r, Math.max(0, deadline - Date.now())))])
      await Promise.all(Array.from(document.images).map(img => withDeadline(img.decode())))
    })
    await new Promise(resolve => setTimeout(resolve, 800))

    const png = await page.screenshot({ type: 'png' })
    return Buffer.from(png)
  } finally {
    await page.close()
  }
}

async function capturePageShot(browser: Browser, url: string, device: ScreenshotDevice): Promise<Buffer> {
  const page = await browser.newPage()
  try {
    const { width, height, isMobile, hasTouch } = VIEWPORTS[device]

    // Diagnostics — logs to the server console (the `npm run dev` terminal locally, or the
    // function logs on Vercel) so a missing image shows up as a concrete reason (404, DNS
    // failure, decode error, ...) instead of just "it's not there."
    // Tallies Google Maps traffic so a blank map in the output has a concrete explanation
    // in the function logs (blocked by a consent/"sorry" interstitial vs. tiles that just
    // errored vs. never requested at all).
    const mapStats = { total: 0, failed: 0, blocked: 0 }
    page.on('requestfailed', request => {
      if (request.resourceType() === 'image') {
        console.error('[screenshot] image request failed:', request.url(), request.failure()?.errorText)
      }
    })
    page.on('response', response => {
      // 3xx (incl. 304 Not Modified) is fine — only real error statuses matter here.
      if (response.request().resourceType() === 'image' && response.status() >= 400) {
        console.error('[screenshot] image response not ok:', response.status(), response.url())
      }
      const u = response.url()
      if (/google\.com\/(maps|sorry)|consent\.google|maps\.(google|gstatic)|khms\d|kh\.google|\/vt\b/.test(u)) {
        mapStats.total++
        if (response.status() >= 400) mapStats.failed++
        if (/consent\.google|google\.com\/sorry/.test(u)) mapStats.blocked++
      }
    })
    page.on('pageerror', err => console.error('[screenshot] page error:', err))
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        console.error('[screenshot] page console:', msg.type(), msg.text())
      }
    })

    // Start at scale 1 for layout/measurement — deviceScaleFactor only affects raster
    // resolution, not CSS layout, so this doesn't change what gets measured below.
    await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile, hasTouch })
    if (device === 'mobile') await page.setUserAgent(MOBILE_USER_AGENT)

    // The venue map is a keyless `google.com/maps?...&output=embed` iframe. From a fresh
    // headless browser on a datacenter IP, Google otherwise serves a cookie-consent
    // interstitial instead of the map (blank grey box in the capture). Pre-seed a
    // consent cookie and an English locale so the map renders straight away.
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' })
    await page.setCookie(
      { name: 'CONSENT', value: 'YES+', domain: '.google.com', path: '/' },
      { name: 'SOCS', value: 'CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZF8yMDI0MDEwOS4wOF9wMBgBIAEaAmVuIAEQ', domain: '.google.com', path: '/' },
    )

    await installCapturePrelude(page, 'page')

    // Waits for every currently-in-DOM <img> to finish decoding, and for every element's
    // CSS background-image to finish loading — both bounded by a shared deadline so a
    // single stuck/slow image can't hang the whole capture. img.decode() implicitly waits
    // for the underlying fetch too, not just paint-readiness, so this catches images that
    // networkidle0 can miss (e.g. ones a post-render data fetch adds to the DOM after the
    // initial network-idle window has already closed).
    const waitForImages = () => page.evaluate(async () => {
      const deadline = Date.now() + 12000
      const withDeadline = (p: Promise<unknown>) =>
        Promise.race([p.catch(() => {}), new Promise(resolve => setTimeout(resolve, Math.max(0, deadline - Date.now())))])

      await Promise.all(Array.from(document.images).map(img => withDeadline(img.decode())))

      const bgUrls = new Set<string>()
      document.querySelectorAll('*').forEach(el => {
        const bg = getComputedStyle(el).backgroundImage
        const match = bg && bg.match(/url\(["']?([^"')]+)["']?\)/)
        if (match) bgUrls.add(match[1])
      })
      await Promise.all(Array.from(bgUrls).map(src => withDeadline(new Promise((resolve, reject) => {
        const preload = new Image()
        preload.onload = () => resolve(undefined)
        preload.onerror = () => reject(new Error('background-image failed to load'))
        preload.src = src
      }))))
    })

    // Waits for every <iframe> (e.g. the venue's Google Maps embed) to fire its load event.
    // This only covers the iframe *document* loading, not the map tiles it then streams in
    // asynchronously inside — that's why this is paired with a fixed settle buffer below,
    // rather than assuming "loaded" means "fully rendered".
    const waitForIframes = () => page.evaluate(async () => {
      const deadline = Date.now() + 10000
      await Promise.all(Array.from(document.querySelectorAll('iframe')).map(frame => new Promise(resolve => {
        if (!frame.src) return resolve(undefined)
        try {
          if (frame.contentDocument?.readyState === 'complete') return resolve(undefined)
        } catch {
          // Cross-origin (e.g. Google Maps) — can't read readyState, fall through to the load event.
        }
        frame.addEventListener('load', () => resolve(undefined), { once: true })
        setTimeout(resolve, Math.max(0, deadline - Date.now()))
      })))
    })

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 })

    // Belt-and-suspenders: re-assert the override in case anything raced the injection above.
    await page.addStyleTag({ content: CAPTURE_MODE_CSS })

    // The envelope/intro-curtain overlays are supposed to skip themselves via the
    // ?capture=1 flag the page reads on mount (see page-client.tsx), but that depends on
    // client-side hydration timing. Force-remove anything marked data-capture-hide as a
    // guarantee, independent of that React state.
    await page.evaluate(() => {
      document.querySelectorAll('[data-capture-hide]').forEach(el => el.remove())
    })

    // Decide the capture's device-scale factor now, before any of the settling below, and
    // never touch the viewport again after this. setViewport() re-triggers Chrome's device
    // metrics override even when width/height are unchanged, which caused a reflow late in
    // an earlier version of this flow — that reflow could re-fire layout/resize-dependent
    // JS and visibly shift or overlap content relative to the real page. Section heights
    // here are Tailwind-fixed (h-screen, h-[100dvh], etc.), not image-aspect-ratio-dependent,
    // so measuring early is representative of the final height even before images below
    // the fold have loaded.
    const pageHeight = await page.evaluate(() => document.body.scrollHeight)
    const safeScale = Math.max(1, Math.min(2, Math.floor(MAX_CAPTURE_PIXEL_HEIGHT / pageHeight)))
    if (safeScale !== 1) {
      await page.setViewport({ width, height, deviceScaleFactor: safeScale, isMobile, hasTouch })
    }

    // Let webfonts finish loading before anything is measured/painted.
    await page.evaluate(() => (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts?.ready).catch(() => {})

    // First pass — catches eager/above-the-fold images (hero, etc.) that may still be
    // fetching or decoding even after networkidle0, since decode readiness isn't part of
    // what networkidle0 tracks.
    await waitForImages()

    // Walk the full page height so native lazy-loaded (`loading="lazy"`) images — and any
    // section that only fetches its data once scrolled near — actually trigger.
    await page.evaluate(async () => {
      const step = window.innerHeight
      let y = 0
      while (y < document.body.scrollHeight) {
        window.scrollTo(0, y)
        await new Promise(resolve => setTimeout(resolve, 150))
        y += step
      }
      window.scrollTo(0, 0)
    })

    // Let any requests the walk triggered (lazy images, scroll-gated data fetches) settle.
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 15000 }).catch(() => {})

    // Second pass — catches images that only appeared/started loading during the walk.
    await waitForImages()

    // The map is a lazy `loading="lazy"` iframe that only starts loading once scrolled
    // near. Bring it to the centre of the viewport, force English/US params on its src,
    // wait for it to load + for its tile requests to go quiet, then give the tile stream
    // a generous buffer (its load event fires well before the tiles finish painting —
    // especially on a cold serverless container).
    const hasMap = await page.evaluate(() => {
      const frame = Array.from(document.querySelectorAll('iframe')).find(f => /google\.[^/]+\/maps/.test(f.src))
      if (!frame) return false
      if (!/[?&]hl=/.test(frame.src)) frame.src = frame.src + (frame.src.includes('?') ? '&' : '?') + 'hl=en&gl=US'
      frame.scrollIntoView({ block: 'center' })
      return true
    })
    if (hasMap) {
      await waitForIframes()
      await page.waitForNetworkIdle({ idleTime: 1000, timeout: 12000 }).catch(() => {})
      await new Promise(resolve => setTimeout(resolve, 2500))
      const mapBox = await page.evaluate(() => {
        const frame = Array.from(document.querySelectorAll('iframe')).find(f => /google\.[^/]+\/maps/.test(f.src))
        const r = frame?.getBoundingClientRect()
        return frame ? { src: frame.src, w: Math.round(r?.width ?? 0), h: Math.round(r?.height ?? 0) } : null
      })
      console.error('[screenshot] map:', JSON.stringify({ ...mapStats, box: mapBox }))
    } else {
      await waitForIframes()
      await new Promise(resolve => setTimeout(resolve, 1500))
    }

    // Final diagnostic — list any <img> still broken (never loaded / zero-size) right
    // before capture, with its src, so a missing image in the output has a direct answer.
    const brokenImages = await page.evaluate(() =>
      Array.from(document.images)
        .filter(img => !img.complete || img.naturalWidth === 0)
        .map(img => img.src)
    )
    if (brokenImages.length > 0) {
      console.error('[screenshot] images still broken at capture time:', brokenImages)
    }

    // Final, direct enforcement of the reveal-visible rule, right before capture — sets
    // properties directly on each matching element's inline style so it can't be lost to
    // any stylesheet timing/removal issue. Logs what it actually found and did, since the
    // previous two attempts to fix this (targeted CSS rule, then this same inline-style
    // pass) reportedly didn't resolve it — this diagnostic is here so the next capture
    // gives concrete facts (what matched, what its computed style was, whether forcing it
    // changed anything) instead of another guess.
    const revealDiagnostics = await page.evaluate(() => {
      const matched = Array.from(document.querySelectorAll('.opacity-0:not(.fixed)')) as HTMLElement[]
      const before = matched.map(el => ({
        tag: el.tagName,
        cls: el.className,
        opacity: getComputedStyle(el).opacity,
        transform: getComputedStyle(el).transform,
      }))
      matched.forEach(el => {
        el.style.setProperty('opacity', '1', 'important')
        // translateY(0), not the keyword "none" — see CAPTURE_MODE_CSS's comment. "none"
        // measurably drops the CSS containing block a position:absolute descendant (e.g. a
        // card's decorative shadow layer) needs to stay positioned relative to this
        // element instead of jumping to whatever ancestor comes next.
        el.style.setProperty('transform', 'translateY(0)', 'important')
      })
      const after = matched.map(el => ({
        opacity: getComputedStyle(el).opacity,
        transform: getComputedStyle(el).transform,
      }))
      // Separately: anything else on the page still sitting at reduced opacity or a
      // non-identity transform that this selector didn't catch — evidence the hidden
      // state uses a different class/mechanism than assumed, if this comes back non-empty.
      const missed = Array.from(document.querySelectorAll('*'))
        .filter(el => !matched.includes(el as HTMLElement))
        .map(el => ({ el, cs: getComputedStyle(el) }))
        .filter(({ cs }) => parseFloat(cs.opacity) < 1 || (cs.transform !== 'none' && cs.transform !== ''))
        .slice(0, 20)
        .map(({ el, cs }) => ({
          tag: el.tagName,
          cls: (el as HTMLElement).className,
          opacity: cs.opacity,
          transform: cs.transform,
        }))
      return { matchedCount: matched.length, before, after, missed }
    })
    console.error('[screenshot] reveal-force diagnostics:', JSON.stringify(revealDiagnostics))

    // Setting styles via page.evaluate() doesn't guarantee a repaint has happened before
    // the next command runs — the style/layout/paint pipeline is scheduled separately from
    // JS execution. Two rAFs is the standard way to wait past both the current frame's
    // pending work and the one it schedules, so the screenshot below sees the forced
    // values actually painted rather than racing them.
    await page.evaluate(() => new Promise(resolve => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(undefined)))
    }))

    return await screenshotByScrolling(page, width, height)
  } finally {
    await page.close()
  }
}

// A single Page.captureScreenshot({ fullPage: true }) of a ~12000px invitation overflows
// what the serverless Chromium can rasterize + PNG-encode in one shot — it fails outright
// with "Unable to capture screenshot". Instead: scroll a viewport at a time, screenshot
// each viewport, and stitch the strips with sharp so no single raster is ever larger than
// one screen.
async function screenshotByScrolling(page: Page, cssWidth: number, cssHeight: number): Promise<Buffer> {
  // Fixed-position chrome (wedding nav, floating music button, any leftover overlay) would
  // be burned into every strip. It isn't in the current full-page output either — that's
  // taken scrolled to the top, where the nav auto-hides.
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>('*').forEach(el => {
      if (getComputedStyle(el).position === 'fixed') el.style.setProperty('display', 'none', 'important')
    })
  })

  const totalHeight = await page.evaluate(() => document.body.scrollHeight)

  const strips: Buffer[] = []
  let y = 0
  while (y < totalHeight) {
    // The browser clamps scrollTo to (scrollHeight - innerHeight), so near the bottom the
    // viewport still starts higher than `y` — crop back the overlap from the real scroll.
    await page.evaluate(target => window.scrollTo(0, target), y)
    await new Promise(resolve => setTimeout(resolve, 120))
    const scrollY = await page.evaluate(() => Math.round(window.scrollY))

    const shot = Buffer.from(await page.screenshot({ type: 'png', captureBeyondViewport: false }))
    const meta = await sharp(shot).metadata()
    const scale = (meta.width ?? cssWidth) / cssWidth // device pixel ratio actually used

    const overlapCss = y - scrollY // >= 0
    const stripCss = Math.min(cssHeight - overlapCss, totalHeight - y)
    strips.push(
      overlapCss > 0 || stripCss < cssHeight
        ? await sharp(shot)
            .extract({
              left: 0,
              top: Math.round(overlapCss * scale),
              width: meta.width ?? Math.round(cssWidth * scale),
              height: Math.max(1, Math.round(stripCss * scale)),
            })
            .png()
            .toBuffer()
        : shot
    )
    y += stripCss
  }

  const dims = await Promise.all(strips.map(s => sharp(s).metadata()))
  const outWidth = dims[0].width ?? cssWidth
  let cursor = 0
  const layers = strips.map((input, i) => {
    const top = cursor
    cursor += dims[i].height ?? 0
    return { input, top, left: 0 }
  })
  return sharp({
    create: { width: outWidth, height: cursor, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite(layers)
    .png()
    .toBuffer()
}
