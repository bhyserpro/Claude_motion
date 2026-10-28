import {Config} from '@remotion/cli/config';
import fs from 'fs';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
// SwiftShader в этом контейнере рисует SVG в ~3 раза быстрее, чем SwANGLE
Config.setChromiumOpenGlRenderer('swiftshader');

// В облачном контейнере уже есть Chromium с доверенным сертификатом прокси (NSS) —
// используем его, если он на месте; иначе Remotion скачает свой браузер.
const LOCAL_SHELL = '/opt/pw-browsers/chromium';
const browser = process.env.REMOTION_BROWSER ?? (fs.existsSync(LOCAL_SHELL) ? LOCAL_SHELL : null);
if (browser) {
  Config.setBrowserExecutable(browser);
}
