import { DMChannel, CollectorFilter, AwaitMessagesOptions } from 'discord.js';

interface CollectorResults {
  cancelled: boolean;
}

const filter: CollectorFilter = text => text.content.length > 0;
const collectorOptions: AwaitMessagesOptions = {
  max: 1,
  maxProcessed: 3,
  errors: ['time'],
  // milliseconds (5 minutes)
  time: 300000,
};

/**
 * A collector specifically for requesting the user to confirm they've placed the auth hash in
 * their SA profile. This should trigger the verification step of the authme process.
 */
export default async function confirmHashPlacementCollector (
  channel: DMChannel,
): Promise<CollectorResults> {
  return channel.awaitMessages(filter, collectorOptions)
    .then(() => ({ cancelled: false }))
    .catch(() => ({ cancelled: true }));
}
