import type { ActivityOptions } from '../types/timeline';

export enum ViewConstants {
  MIN_ROW_HEIGHT = 24,
  MIN_MARGIN_LEFT = 190,
}

export const ViewDefaultActivityOptions: ActivityOptions = {
  activityHeight: 20,
  composition: 'both',
  displayMode: 'grouped',
  hierarchyMode: 'all',
  labelVisibility: 'auto',
};
