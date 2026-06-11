import { connectDB } from './config/db';
import { env } from './config/env';
import { startInternalCron } from './cron';
import app from './app';

async function main() {
  await connectDB();
  if (env.ENABLE_INTERNAL_CRON) startInternalCron();
  app.listen(env.PORT, () => console.log(`[server] FlowDesk API on http://localhost:${env.PORT}`));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
