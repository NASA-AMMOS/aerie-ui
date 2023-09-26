import type { UserId } from './app';
import type { SimulationDataset } from './simulation';

export type PlanSnapshot = {
  description: string;
  plan_id: number;
  revision: number;
  simulation: SimulationDataset | null;
  snapshot_id: number;
  snapshot_name: string;
  taken_at: string;
  taken_by: UserId;
};
