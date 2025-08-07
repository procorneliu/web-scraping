import express from 'express';
import scrapeController from '../controllers/scrapeController';

const route = express.Router();

route.get('/job-status/:id', scrapeController.getJobStatus);
route.get('/download/:id', scrapeController.getCSVFile);
route.post('/start-job', scrapeController.scrapeUrl);

export default route;
