export enum Status {
  Clean = 'Clean',
  Complete = 'Complete',
  Dirty = 'Dirty',
  Executing = 'Executing',
  Failed = 'Failed',
  Incomplete = 'Incomplete',
  Pending = 'Pending',
  Unknown = 'Unknown',
}

export const statusColors: Record<string, string> = {
  blue: '#007bff',
  green: '#28a745',
  red: '#dc3545',
  yellow: '#ffc107',
};

/**
 * Helper function that maps a status to a color.
 */
export function getColorForStatus(status: Status): string {
  if (status === Status.Clean) {
    return statusColors.blue;
  } else if (status === Status.Complete) {
    return statusColors.green;
  } else if (status === Status.Dirty) {
    return statusColors.red;
  } else if (status === Status.Executing) {
    return statusColors.yellow;
  } else if (status === Status.Failed) {
    return statusColors.red;
  } else if (Status.Incomplete) {
    return statusColors.yellow;
  } else if (Status.Pending) {
    return statusColors.yellow;
  } else {
    return statusColors.red;
  }
}
