// Рендер набора стоп-кадров одной композиции за один бандл + контактный лист.
// node scripts/stills.mjs Ep1 out/stills 0,6,30,90,180,...
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import fs from 'fs';
import path from 'path';

const [, , compId, outDir, framesArg, propsArg] = process.argv;
const frames = framesArg.split(',').map((s) => {
  if (s.includes(':')) {
    const [m, sec] = s.split(':');
    return Math.round((Number(m) * 60 + Number(sec)) * 30);
  }
  return Number(s);
});
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const browserExecutable = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
const browser = await openBrowser('chrome', {browserExecutable, chromiumOptions: {gl: 'swiftshader'}});
const inputProps = propsArg ? JSON.parse(propsArg) : {};
const composition = await selectComposition({serveUrl, id: compId, inputProps, puppeteerInstance: browser});
for (const f of frames) {
  const out = path.join(outDir, `${compId}_${String(f).padStart(5, '0')}.png`);
  const t0 = Date.now();
  await renderStill({composition, serveUrl, frame: f, output: out, inputProps, puppeteerInstance: browser, overwrite: true});
  console.log(`${out}  ${Date.now() - t0}ms`);
}
await browser.close({silent: true});
