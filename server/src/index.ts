import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { PORT } from './config';
import { requireApiSecret } from './middleware/auth';
import { requestLogger } from './middleware/logging';
import { sosRouter } from './routes/sos';
import { statusRouter } from './routes/status';
import { familyRouter } from './routes/family';

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));
app.use(requestLogger);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api', requireApiSecret);
app.use('/api', sosRouter);
app.use('/api', statusRouter);
app.use('/api', familyRouter);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`ResQ-Link server listening on :${PORT}`);
});
