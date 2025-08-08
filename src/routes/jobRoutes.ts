import express from 'express';
import scrapeController from '../controllers/jobController';

const route = express.Router();

route.post('/start', scrapeController.startScrapingJob);

route.get('/status/:id', scrapeController.getJobStatus);

route.get('/download/:id', scrapeController.downloadCSV);

export default route;
