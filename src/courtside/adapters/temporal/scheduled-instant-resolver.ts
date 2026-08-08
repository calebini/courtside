import {Temporal} from '@js-temporal/polyfill';

import type {ScheduledInstantResolver} from '@/courtside/services/manage-game';

export class TemporalScheduledInstantResolver implements ScheduledInstantResolver {
  resolve(localDateTime: string, timeZone: string): Date | null {
    try {
      const plainDateTime = Temporal.PlainDateTime.from(localDateTime);
      const zonedDateTime = plainDateTime.toZonedDateTime(timeZone, {
        disambiguation: 'reject'
      });
      return new Date(zonedDateTime.epochMilliseconds);
    } catch {
      return null;
    }
  }
}
