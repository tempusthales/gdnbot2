import { DateTime, Duration } from 'luxon';
import cheerio from 'cheerio';

import logger, { LogTag } from '../helpers/logger';
import { axiosGDN, GDN_URLS, APIMember } from '../helpers/axiosGDN';
import { axiosSA } from '../helpers/axiosSA';

const userIDRegex = /\/member\.php\?s=&action=getinfo&userid=([\d]+)/i;

/**
 * Blacklist users who are permabanned on SA. This scrapes Leper's Colony by month and year.
 *
 * `month` should be a number between 1-12, inclusive
 *
 * Current permaban table markup looks like this:
 *
 * <a name="list"></a>
 * <table class="standard full" style="clear:left;">
    <tr>
      <th>Type</th>
      <th nowrap>Date</th>
      <th>Horrible Jerk</th>
      <th>Punishment Reason</th>
      <th nowrap>Requested By</th>
      <th nowrap>Approved By</th>
    </tr>
    <tr>
      <td align="left">
        <b>
          <a href="/showthread.php?goto=post&amp;postid=501534401" target="new">
            PERMABAN
          </a>
        </b>
      </td>
      <td nowrap>
        01/10/20 01:25pm
      </td>
      <td nowrap>
        <b>
          <a href="/member.php?s=&amp;action=getinfo&amp;userid=180972" target="_blank">
            Karpaw
          </a>
        </b>
      </td>
      <td>You wrote this: "As someone who identifies as a national socialist, I agree with this
      sentiment.
        "<br />
        <br />
        You actually wrote those words.</td>
      <td nowrap>
        <a href="/member.php?s=&amp;action=getinfo&amp;userid=40838" target="_blank" nowrap>
          VideoGames
        </a>
      </td>
      <td nowrap>
        <a href="/member.php?s=&amp;action=getinfo&amp;userid=103775" target="_blank" nowrap>
          Cyrano4747
        </a>
      </td>
    </tr>
 *
 * The goal is to grab the `userid` from the <a> in the third <td> (the "Horrible Jerk" column)
 */
export default async function syncSAPermabans (
  tag: LogTag,
  month?: number,
  year?: number,
): Promise<void> {
  // Default to calculating last month and year if one isn't specified
  if (!month || !year) {
    logger.warn(tag, `No month (${month}) and/or year (${year}) specified`);
    const lastMonth = DateTime.fromObject({ zone: 'America/Los_Angeles' })
      .minus(Duration.fromObject({ months: 1 }));
    month = lastMonth.month;
    year = lastMonth.year;
  }

  logger.info(tag, `[TASK START] Syncing SA permabans for ${month}/${year}`);

  // Request permaban HTML
  const { data: permabanHTML } = await axiosSA.get(
    `https://forums.somethingawful.com/banlist.php?actfilt=9&ban_month=${month}&ban_year=${year}`,
  );

  const $ = cheerio.load(permabanHTML);

  const permabannedIDs = new Set<string>();
  $('a[name=list]').next('table').find('tr').each((idx, row) => {
    if (idx === 0) {
      return;
    }

    const href: string = $(row).find('td > b > a').get(1).attribs.href;

    const matchedURL = userIDRegex.exec(href);
    if (matchedURL) {
      permabannedIDs.add(matchedURL[1]);
    }
  });

  const ids: string[] = Array.from(permabannedIDs);

  logger.info({ ...tag, ids }, `Submitting ${ids.length} permabanned SA users`);

  try {
    const { data } = await axiosGDN.post<APIMember[]>(GDN_URLS.PERMABAN, {
      sa_ids: ids,
      month,
      year,
    });

    const discordIDs = data.map(member => member.discord_id);
    logger.info({ ...tag, discordIDs }, `Blacklisted ${discordIDs.length} Discord members`);
  } catch (err) {
    logger.error({ ...tag, err }, 'Error submitting permabanned users');
  }
}
