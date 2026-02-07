import { Duration, Schedule } from 'effect';

export const API_RETRY_POLICY = Schedule.exponential(
  Duration.millis(500),
  1
).pipe(Schedule.intersect(Schedule.recurs(3)));

export const API_TIMEOUT_POLICY = Duration.seconds(30);
