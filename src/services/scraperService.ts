import puppeteer, { type Page } from 'puppeteer';
import { type Job, updateJob } from '../jobs/jobStore';

type ProductField = {
  [key: string]: string;
};

type ProductsContent = {
  [key: string]: ProductField;
};

// prettier-ignore
const IGNORED_KEYWORD = ['#', '%', '=', 'contact', 'about', 'blog', 'info', 'page', 'category', 'terms', 'help', 'user','login', 'account', 'brand'];

const findAllUrl = async (page: Page, mainSiteUrl: string, productsContent: ProductsContent) => {
  const hrefs = await page.$$eval('a', (el) => el.map((a) => a.href));

  const filteredHrefs = hrefs.filter(
    (href) =>
      href.replace('https://', '').split('/').length - 1 >= 3 &&
      href.startsWith(mainSiteUrl) &&
      !IGNORED_KEYWORD.some((keyword) => href.includes(keyword)) &&
      productsContent[href] === undefined
  );

  const uniqueHrefs = [...new Set(filteredHrefs)];

  return uniqueHrefs;
};

const getMetaData = async (page: Page) => {
  const data = await page.evaluate(() => {
    const allowedMetaProperties = ['og:title', 'og:description', 'og:image', 'og:url', 'product:price:amount'];

    const getData = (tag: HTMLMetaElement) => {
      const property = tag.getAttribute('property');
      const content = tag.getAttribute('content');

      if (property && content && allowedMetaProperties.includes(property)) {
        const key = property.split(':')[1].trim();
        const value = content.replace(/\s+/g, ' ').trim();
        return {
          [key]: value,
        };
      }
    };

    const metaTags = Array.from(document.querySelectorAll('meta'))
      .map((tag) => getData(tag))
      .filter(Boolean);

    return Object.assign({}, ...metaTags);
  });

  return data;
};

const startPageScrape = async (pageUrl: string, job: Job) => {
  const browser = await puppeteer.launch();

  const products: ProductField[] = [];
  const productsContent: ProductsContent = {};
  let queue = [pageUrl];

  let num = 0; // will be removed

  updateJob(job.job_id, { status: 'in_progress' });

  while (queue.length && num < 7) {
    const url = queue[queue.length - 1];
    if (!url) continue;

    const page = await browser.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (err) {
      updateJob(job.job_id, { status: 'failed' });

      queue.pop();
      await page.close();

      continue;
    }

    console.log(url); // will be removed

    const content = await getMetaData(page);
    productsContent[url] = content;

    // Here checking if page contains url and image property, because all products pages contains one
    const isValidProductPage = content.url && content.image;
    const isNotMaingPage = !(url === pageUrl);
    if (isValidProductPage && isNotMaingPage) {
      products.push(content);
    }

    const newLinks = await findAllUrl(page, url, productsContent);

    queue.pop();
    queue.push(...newLinks);
    queue = [...new Set(queue)];

    await page.close();
    num++;
  }

  await browser.close();

  const result = products.map((product) => {
    return Array.isArray(product) ? Object.assign({}, ...product) : product;
  });

  updateJob(job.job_id, { status: 'completed', result });
};

export default startPageScrape;
