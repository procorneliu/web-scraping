import express from 'express';
import scrapeController from '../controllers/jobController';

const route = express.Router();

// POST route for starting web scraping
route.post('/start', scrapeController.startScrapingJob);

// GET route for requesting job status by ID
route.get('/status/:id', scrapeController.getJobStatus);

// GET route for downloading job data by ID
route.get('/download/:id', scrapeController.downloadCSV);

export default route;
