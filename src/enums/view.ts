import type { ActivityOptions } from '../types/timeline';

export enum ViewConstants {
  MIN_ROW_HEIGHT = 24,
  MIN_MARGIN_LEFT = 190,
}

export const ViewDefaultActivityOptions: ActivityOptions = {
  activityHeight: 16,
  composition: 'both',
  displayMode: 'compact',
  hierarchyMode: 'all',
  labelVisibility: 'auto',
};
