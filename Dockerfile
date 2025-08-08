FROM node:24-slim

# Install all CHROMIUM packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# SKIP DOWNLOADING DEFAULT PUPPETEER BROWSER
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package*.json ./
RUN npm ci \
    && npm cache clean --force

COPY . .

EXPOSE 3000

CMD ["npm", "start"]