import logger, { LogTag } from '../helpers/logger';

/**
 * Blacklist users who are permabanned on SA
 *
 * This scrapes Leper's Colony by month and year
 */
export default async function syncSAPermabans (
  tag: LogTag,
  month: number,
  year: number,
): Promise<void> {
  logger.info(tag, `[TASK START] Syncing SA permabans for ${month}/${year}`);
}
