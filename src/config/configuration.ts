export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  dbPath: process.env.DB_PATH || './data/scoreboard.db',
  pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '10000', 10),
  hourlySyncIntervalMs: parseInt(
    process.env.HOURLY_SYNC_INTERVAL_MS || '3600000',
    10,
  ),
  fullSyncIntervalMs: parseInt(
    process.env.FULL_SYNC_INTERVAL_MS || '86400000',
    10,
  ),
  espnRequestDelayMs: parseInt(process.env.ESPN_REQUEST_DELAY_MS || '200', 10),
  timelineDelayMs: parseInt(process.env.TIMELINE_DELAY_MS || '10000', 10),
  throttler: {
    ttl: parseInt(process.env.THROTTLE_TTL_MS || '1000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
  },
});
