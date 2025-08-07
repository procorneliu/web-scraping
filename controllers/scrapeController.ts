import { type Request, type Response, type NextFunction, text } from 'express';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';

import validUrl from 'valid-url';
import puppeteer from 'puppeteer';

type MetaItem = {
  property: string;
  content: string;
};

let products: MetaItem[][] = [];

const scrapeUrl = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { url } = req.body;
  if (!validUrl.isUri(url)) return next(new AppError('Invalid URL', 404));

  const browser = await puppeteer.launch();

  const productsContent: any = {};

  let queue = [url];
  let num = 0;

  while (queue.length && num < 10) {
    const url = queue[queue.length - 1];
    console.log(url);
    const page = await browser.newPage();
    await page.goto(url, { timeout: 0 });

    productsContent[url] = await page.evaluate(() => {
      const allowed = ['og:title', 'og:description', 'og:image', 'og:url', 'product:price:amount'];

      const metaTags = Array.from(document.querySelectorAll('meta'))
        .map((tag) => {
          if (allowed.includes(tag.getAttribute('property')!))
            if (tag.getAttribute('property')! && tag.getAttribute('content')) {
              const key = tag.getAttribute('property')!.split(':')[1].trim();
              return {
                [key]: tag.getAttribute('content'),
              };
            }
        })
        .filter((el) => el);

      return metaTags;
    });

    // Add only if this is not main page
    products.push(productsContent[url]);
    products = products.filter((product) => Object.keys(product).length > 0);

    queue.pop();
    const hrefs = await page.$$eval('a', (el) => el.map((a) => a.href));

    const filteredHrefs = hrefs.filter(
      (href) =>
        href.replace('https://', '').split('/').length - 1 > 2 &&
        href.startsWith(url) &&
        !href.includes('#') &&
        !href.includes('=') &&
        !href.includes('contact') &&
        !href.includes('about') &&
        !href.includes('blog') &&
        productsContent[href] === undefined
    );

    const uniqueHrefs = [...new Set(filteredHrefs)];
    queue.push(...uniqueHrefs);
    queue = [...new Set(queue)];

    await page.close();
    num++;

    // Skip saving information from main page
    if (url === req.body.url) {
      products.pop();
    }
  }

  await browser.close();

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: products,
  });
});

export default { scrapeUrl };
