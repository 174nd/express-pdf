import express from "express";
import { readFileSync } from 'fs';
import * as puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import stream from 'stream';

const app = express();
const port = 3330;

async function generatePdf(options){
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium-browser',
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-extensions"],
  });
  const page = await browser.newPage();
  Handlebars.registerHelper('ifCond', (v1, v2, options) => v1 === v2 ? options.fn(this) : options.inverse(this));
  Handlebars.registerHelper('currency', (v1) => 'Rp. ' + new Intl.NumberFormat().format(v1));
  let html = Handlebars.compile(await readFileSync(options.path, 'utf8'))(options.data ?? {})
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await page.emulateMediaType('screen');

  const pdf = await page.pdf(options.options ?? {
    margin: { top: '50px', right: '50px', bottom: '50px', left: '50px' },
    format: 'A4',
  });

  await browser.close();
  return pdf;
}

app.get('/', async (req, res) => {
  const filename = "sampleReport.pdf";
  var readStream = new stream.PassThrough();
  readStream.end(await generatePdf({
    path: 'test.handlebars',
    options: {
      margin: { top: '50px', right: '50px', bottom: '50px', left: '50px' },
      displayHeaderFooter: true,
      headerTemplate: `<span style="font-size: 15px;">Header</span>`,
      footerTemplate: `<span style="font-size: 15px;">Footer <span class='pageNumber'></span> / <span class='totalPages'></span></span>`,
      format: 'A4',
    }
  }));
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });

  readStream.pipe(res);
})

app.listen(port, () => {
  console.log(`Example app for express listening on port ${port}`)
})