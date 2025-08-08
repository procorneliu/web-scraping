import puppeteer, { type Page } from 'puppeteer';
import validUrl from 'valid-url';

// Declaring INTERFACES and TYPES for Typescript
type ProductField = {
  [key: string]: string;
};

type ProductContent = {
  [key: string]: ProductField;
};

// prettier-ignore
// Ignoring all links that contains these words
const IGNORED_KEYWORD = ['#', '%', '=', 'contact', 'about', 'blog', 'info', 'page', 'category', 'terms', 'help',
                        'user', 'login', 'account', 'brand'];

// Extracting all URLs from current page
const findAllUrl = async (page: Page, mainSiteUrl: string, productsContent: ProductContent) => {
  // Using puppeteer to get all 'href' values of 'a' elements
  const hrefs = await page.$$eval('a', (el) => el.map((a) => a.href));

  // Filter unwanted URLs
  const filteredHrefs = hrefs.filter(
    (href) =>
      // Filter short URLs
      href.replace('https://', '').split('/').length - 1 >= 3 &&
      // External and internal URLs
      href.startsWith(mainSiteUrl) &&
      // Check if URLs contains forbidden words
      !IGNORED_KEYWORD.some((keyword) => href.includes(keyword)) &&
      // Check if URLs data in not already stored
      productsContent[href] === undefined
  );

  // Remove dublicates
  const uniqueHrefs = [...new Set(filteredHrefs)];

  return uniqueHrefs;
};

// Extracting page data from <meta> tags
const getMetaData = async (page: Page) => {
  // Using puppeteer to evaluate page
  const data = await page.evaluate(() => {
    // Onyl for <meta> tags that contains this properties
    const allowedMetaProperties = ['og:title', 'og:description', 'og:image', 'og:url', 'product:price:amount'];

    // Extract property name and contante value from <meta>
    const getData = (tag: HTMLMetaElement) => {
      // <meta> attributes
      const property = tag.getAttribute('property');
      const content = tag.getAttribute('content');

      // Check if <meta> contains property and content attributes
      // Check if tag property name is in allowed list
      if (property && content && allowedMetaProperties.includes(property)) {
        const key = property.split(':')[1].trim();
        const value = content.replace(/\s+/g, ' ').trim();
        return {
          [key]: value,
        };
      }
    };

    // Loop over all <meta> tags with 'getData()'
    const metaTags = Array.from(document.querySelectorAll('meta'))
      .map((tag) => getData(tag))
      .filter(Boolean);

    // return as object
    return Object.assign({}, ...metaTags);
  });

  return data;
};

// Helper function that add to queue only new, unique links
// Removing last link, that was already scraped
const updateQueue = (queue: string[], newLinks: string[]) => {
  return Array.from(new Set([...queue.slice(0, -1), ...newLinks]));
};

// FUNCTIONS THAT IS CRAWLING AND SCRAPING ALL DATA
const scrapePage = async (pageUrl: string): Promise<ProductField[]> => {
  // Opening browser using puppeteer
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  // variable where all products data are stored in objects
  const products: ProductField[] = [];
  // variable where all products data are stored in objects and can be referenced by [url]
  const productsContent: ProductContent = {};

  // All links that needs to be scraped
  let queue: string[] = [pageUrl];

  let num = 0;
  // RUN until in queue exists a URL
  while (queue.length && num < 7) {
    // Check if URL exists and is valid
    const url = queue[queue.length - 1];
    if (!url && validUrl.isUri(url)) continue;

    // Opening new page
    const page = await browser.newPage();

    try {
      // Going to URL
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (err) {
      console.log(`Failed to load! ${url}`, err);
      await page.close();
      continue;
    }

    // Show crawling paths if in DEV mode
    if (process.env.NODE_ENV === 'development') {
      console.log(url);
    }

    const content = await getMetaData(page);
    productsContent[url] = content;

    // Checking if page contains url and image property
    // All products page should contain it
    const isValidProductPage = content.url && content.image && url !== pageUrl;

    if (isValidProductPage) {
      products.push(content);
    }

    // Getting all found links from current page
    const newLinks = await findAllUrl(page, url, productsContent);

    // Filtering from unwanted links
    queue = updateQueue(queue, newLinks);

    // Closing current page
    await page.close();
    num++;
  }

  // Closing browser
  await browser.close();

  return products;
};

export default scrapePage;
