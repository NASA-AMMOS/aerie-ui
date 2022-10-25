type Plan = PlanSchema & { end_time_doy: string; start_time_doy: string };

type PlanInsertInput = Pick<PlanSchema, 'duration' | 'model_id' | 'name' | 'start_time'>;

type RelatedPlan = {
  id: number;
  name: string;
};

type PlanSchema = {
  child_plans: RelatedPlan[];
  duration: string;
  id: number;
  model: Model;
  model_id: number;
  name: string;
  parent_plan: RelatedPlan | null;
  revision: number;
  scheduling_specifications: Pick<SchedulingSpec, 'id'>[];
  simulations: [{ simulation_datasets: [{ id: number }] }];
  start_time: string;
};

type PlanSlim = Pick<Plan, 'end_time_doy' | 'id' | 'model_id' | 'name' | 'revision' | 'start_time' | 'start_time_doy'>;
