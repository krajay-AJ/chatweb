import express from 'express';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    logger.info(`🚀 Server is running on port ${PORT}`);
    console.log(`🚀 Server is running on port ${PORT}`);
});
