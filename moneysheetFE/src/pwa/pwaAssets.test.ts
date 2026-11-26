// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

const root = fileURLToPath(new URL('../../', import.meta.url))
it('provides a same-origin standalone manifest and installable PNG icons', () => {
 const manifest = JSON.parse(readFileSync(`${root}/public/manifest.webmanifest`, 'utf8'))
 expect(manifest).toMatchObject({ id: '/', name: 'MoneySheet', short_name: 'MoneySheet', start_url: '/', scope: '/', display: 'standalone' })
 expect(manifest.prefer_related_applications).not.toBe(true)
 for (const size of [192, 512]) {
  const icon = manifest.icons.find((item: { sizes: string }) => item.sizes === `${size}x${size}`)
  expect(icon.type).toBe('image/png')
  expect(icon.src).toMatch(/^\/icons\/[^/]+\.png$/)
  const bytes = readFileSync(`${root}/public${icon.src}`)
  expect(bytes.subarray(1, 4).toString()).toBe('PNG')
  expect(bytes.readUInt32BE(16)).toBe(size)
  expect(bytes.readUInt32BE(20)).toBe(size)
 }
})
it('links the manifest and iPhone icon in the HTML shell', () => {
 const html = readFileSync(`${root}/index.html`, 'utf8')
 expect(html).toContain('rel="manifest" href="/manifest.webmanifest"')
 expect(html).toContain('name="theme-color"')
 expect(html).toContain('rel="apple-touch-icon"')
 const icon = readFileSync(`${root}/public/icons/apple-touch-icon.png`)
 expect(icon.readUInt32BE(16)).toBe(180)
 expect(icon.readUInt32BE(20)).toBe(180)
})
