import type { Profile, Resource, ResourceValue } from '../types/simulation';
import { getIntervalInMs } from './time';

/**
 * Samples a list of profiles at their change points. Converts the sampled profiles to Resources.
 */
export function sampleProfiles(
  profiles: Profile[] | null,
  planStartTimeYmd: string | null,
  duration: string | null,
  offset?: string,
): Resource[] {
  const resources: Resource[] = [];

  if (profiles && planStartTimeYmd && duration) {
    const planOffset = getIntervalInMs(offset);
    const planStart = new Date(planStartTimeYmd).getTime() + planOffset;
    const planDuration = getIntervalInMs(duration);

    for (const profile of profiles) {
      const { name, profile_segments, type: profileType } = profile;
      const { schema, type } = profileType;
      const values: ResourceValue[] = [];

      for (let i = 0; i < profile_segments.length; ++i) {
        const segment = profile_segments[i];
        const nextSegment = profile_segments[i + 1];

        const segmentOffset = getIntervalInMs(segment.start_offset);
        const nextSegmentOffset = nextSegment ? getIntervalInMs(nextSegment.start_offset) : planDuration;

        const { dynamics } = segment;

        if (type === 'discrete') {
          values.push({
            x: planStart + segmentOffset,
            y: dynamics,
          });
          values.push({
            x: planStart + nextSegmentOffset,
            y: dynamics,
          });
        } else if (type === 'real') {
          values.push({
            x: planStart + segmentOffset,
            y: dynamics.initial,
          });
          values.push({
            x: planStart + nextSegmentOffset,
            y: dynamics.initial + dynamics.rate * ((nextSegmentOffset - segmentOffset) / 1000),
          });
        }
      }

      resources.push({ name, schema, values });
    }
  }

  return resources;
}
