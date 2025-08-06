import express from 'express';
import scrapeController from '../controllers/scrapeController';

const route = express.Router();

route.post('/', scrapeController.scrapeUrl);

export default route;
