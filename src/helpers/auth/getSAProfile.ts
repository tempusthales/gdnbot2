import cheerio from 'cheerio';
import { oneLine } from 'common-tags';

import logger, { LogTag } from '../logger';
import { axiosSA, SA_URLS } from '../axiosSA';

interface SAProfile {
  profile?: CheerioStatic,
  reason?: string;
}

const reasonErrorLoadingProfile = oneLine`
  A system error occurred while reading your SA profile. The bot owner has been notified. Thank
  you for your patience while they get this fixed!
`;

/**
 * Grab the user's SA Profile page and wrap it in Cheerio
 */
export default async function getSAProfile (
  tag: LogTag,
  username?: string,
  userID?: string,
): Promise<SAProfile> {
  let url = SA_URLS.PROFILE;
  if (username) {
    logger.info(tag, `Retrieving SA profile page by username: "${username}"`);
    url += `&username=${encodeURIComponent(username)}`;
  } else if (userID) {
    logger.info(tag, `Retrieving SA profile page by user ID: ${userID}`);
    url += `&userid=${encodeURIComponent(userID)}`;
  }

  try {
    // Request HTML
    const resp = await axiosSA.get<string>(url);
    // Wrap it in Cheerio for easy traversal
    const profile = cheerio.load(resp.data);

    return {
      profile,
    };
  } catch (err) {
    logger.error({ ...tag, err }, 'Error retrieving SA profile page');
    return {
      reason: reasonErrorLoadingProfile,
    };
  }
}
