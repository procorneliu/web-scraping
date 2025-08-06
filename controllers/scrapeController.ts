import type { Request, Response, NextFunction } from 'express';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';

import validUrl from 'valid-url';
import puppeteer from 'puppeteer';

interface productObject {
  [title: string]: {};
}
let products: {}[] = [];
const scrapeUrl = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { url } = req.body;
  if (!validUrl.isUri(url)) return next(new AppError('Invalid URL', 404));

  const browser = await puppeteer.launch();
  // const page = await browser.newPage();

  const productsContent: productObject = {};

  let queue = [url];

  while (queue.length) {
    const url = queue[queue.length - 1];
    console.log(url);
    const page = await browser.newPage();
    await page.goto(url, { timeout: 0 });
    productsContent[url] = await page.$eval('*', (el) => {
      const title = document.querySelector('h1, h2, h3, h4, h5, h6')?.textContent?.trim();
      const price = document.querySelector('.price')?.textContent?.trim();

      // products.push({ title });

      return { title, price };
    });
    products.push(productsContent[url]);
    products = products.filter((product) => Object.keys(product).length > 0);
    // productsContent[url] = await page.evaluate(() => {
    //   const title = document.querySelector('.js-name-detail')?.textContent?.trim();

    //   return { title };
    // });
    queue.pop();
    const hrefs = await page.$$eval('a', (el) => el.map((a) => a.href));

    const filteredHrefs = hrefs.filter(
      (href) =>
        href.startsWith(url) &&
        !href.includes('#') &&
        !href.includes('=') &&
        // href.includes('product/pasta-de-dinti-zettoc') &&
        href.includes('dormitor/model') &&
        productsContent[href] === undefined
    );

    const uniqueHrefs = [...new Set(filteredHrefs)];
    queue.push(...uniqueHrefs);
    queue = [...new Set(queue)];

    await page.close();
  }
  // await page.goto(url);

  // const content = await page.evaluate(() => {
  //   const titles = document.querySelectorAll('.tm-procuct-card');

  //   return Array.from(titles).map((el) => {
  //     const title = el.querySelector('.tm-procuct-card-title')?.textContent?.trim();

  //     return { title };
  //   });
  // });

  await browser.close();

  res.status(200).json({
    status: 'success',
    data: products,
  });
});

export default { scrapeUrl };
