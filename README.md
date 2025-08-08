# Scraper Microservice

A simple Node.js microservice that scrapes product data from e-commerce websites and returns the results in CSV format.

_Tested using these links:_ http://valdimobila.md/ | https://mobildor.md/ | http://sakurashop.md/

For web crawling and scraping, I used the Puppeteer library. Data is extracted by referencing the \<meta> tags found in the HTML code. Microservice work well for pages like these above or something similar. Every e-commerce website is different, so is almost impossible to create a universal scraper that will work 100% for each link. I think the best result can be acquired by including AI (like OpenAI) in your app, that will extract information for you (_this costs $$, that's why I couldn't implement it for now_).

---

- **POST** `/api/v1/scrape/start` → Start a scraping job for a given URL, returns a `job_id` immediately
- **GET** `/api/v1/scrape/status/:id` → Check job status (`pending`, `in_progress`, `completed`, `failed`)
- **GET** `/api/v1/scrape/download/:id` → Download the generated `products.csv` file

---

## 🚀 Getting Started

_Run these commands in terminal._

### 1️⃣ Clone the repository

```bash
git clone https://github.com/procorneliu/web-scraping.git
cd web-scraping
```

### 2️⃣ Run with Docker (Recommended)

You only need **Docker installed**.
Install here: https://www.docker.com/get-started/

#### Build the image:

```bash
docker build -t web-scraping .
```

#### Run the container:

```bash
docker run -p 3000:3000 web-scraping
```

The API will be available at:

```
http://localhost:3000
```

---

### 3️⃣ Run locally with Node.js

Install here: https://nodejs.org/en/download
If you already have Node.js installed:

```bash
npm install
npm start
```

---

## API Usage Examples

_Run these commands in terminal._

The instructions below use "curl" so that no configuration is required to start testing.
For a better experience, use Postman (https://www.postman.com/downloads/), as I did when testing the application.

### Start a new scraping job

```bash
curl -X POST http://localhost:3000/api/v1/scrape/start -H "Content-Type: application/json" -d '{"url": "https://your_url.com"}'
```

**Response:**

```json
{
  "job_id": "17772feb-6bad-4e43-94ad-3c825c4498a0"
}
```

---

### Check job status

```bash
curl http://localhost:3000/api/v1/scrape/status/:id
```

**Response:**

```json
{
  "status": "in_progress"
}
```

---

### Download results (CSV)

```bash
curl -o products.csv http://localhost:3000/api/v1/scrape/download/:id
```
