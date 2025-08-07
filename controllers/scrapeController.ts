import { type Request, type Response, type NextFunction, text } from 'express';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';

import validUrl from 'valid-url';
import puppeteer from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import { Parser } from '@json2csv/plainjs';

type MetaItem = {
  property: string;
  content: string;
};

type ProductField = {
  [key: string]: string;
};
type ProductEntry = ProductField;

type ProductsContent = {
  [url: string]: MetaItem;
};

type JobItem = {
  [jobId: string]: {
    status: string;
    result: ProductEntry[] | null;
  };
};

let jobs: JobItem = {};
let products: MetaItem[] = [];

const scrapeUrl = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { url } = req.body;
  if (!validUrl.isUri(url)) return next(new AppError('Invalid URL', 404));

  const jobId: string = uuidv4();

  res.status(200).json({
    jobId,
  });

  jobs[jobId] = {
    status: 'pending',
    result: null,
  };

  const browser = await puppeteer.launch();

  const productsContent: ProductsContent = {};

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
          if (
            tag.getAttribute('property') &&
            tag.getAttribute('content') &&
            allowed.includes(tag.getAttribute('property')!)
          ) {
            const key = tag.getAttribute('property')!.split(':')[1].trim();
            const value = tag.getAttribute('content')?.replace(/\s+/g, ' ').trim();
            return {
              [key]: value,
            };
          }
        })
        .filter((el) => el);

      return metaTags;
    });

    // Here checking if page contains url property, because all products pages contains one
    // productsContent[url].map((el: any) => {
    //   if (el.url) {
    //     products.push(productsContent[url]);
    //     products = products.filter((product) => Object.keys(product).length > 0);
    //   }
    // });

    // Here checking if page contains url and image property, because all products pages contains one
    const hasURL = productsContent[url].some((el: any) => el.url);
    if (hasURL) {
      products.push(productsContent[url]);
      products = products.filter((product) => Object.keys(product).length > 0);
    }

    queue.pop();
    const hrefs = await page.$$eval('a', (el) => el.map((a) => a.href));

    const filteredHrefs = hrefs.filter(
      (href) =>
        href.replace('https://', '').split('/').length - 1 >= 3 &&
        href.startsWith(url) &&
        !href.includes('#') &&
        !href.includes('%') &&
        !href.includes('=') &&
        !href.includes('contact') &&
        !href.includes('about') &&
        !href.includes('blog') &&
        !href.includes('info') &&
        !href.includes('page') &&
        !href.includes('category') &&
        !href.includes('terms') &&
        !href.includes('help') &&
        !href.includes('user') &&
        !href.includes('login') &&
        !href.includes('account') &&
        !href.includes('brand') &&
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

  const result = products.map((product) => {
    return Array.isArray(product) ? Object.assign({}, ...product) : product;
  });

  jobs[jobId] = {
    status: 'completed',
    result,
  };
});

const getJobStatus = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  res.status(200).json({
    status: jobs[id].status,
  });
});

const getCSVFile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!jobs[id]) {
    return next(new AppError('Job not ready or not found. Please wait and try again!', 404));
  }

  if (jobs[id].status === 'pending') {
    return next(new AppError('Job not ready or not found. Please wait and try again!', 404));
  }

  const opts = {
    fields: ['url', 'title', 'description', 'image'],
    quote: '"',
    escapedQuote: '""',
    delimiter: ';',
    eol: '\n',
    header: true,
  };

  const parser = new Parser(opts);
  const csv = parser.parse(jobs[id].result!);

  res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
});

export default { scrapeUrl, getJobStatus, getCSVFile };
