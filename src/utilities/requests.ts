import { get } from 'svelte/store';
import { defaultEnv, env as envStore, user as userStore } from '../stores/app';
import { gatewayUrl, hasuraUrl, schedulerUrl } from './app';
import * as gql from './gql';
import {
  getDoyTime,
  getDoyTimeFromDuration,
  getIntervalFromDoyRange,
} from './time';

/* Helpers. */

function toActivity(activity: any, startTime: Date): Activity {
  return {
    arguments: activity.arguments,
    children: [],
    duration: 0,
    id: activity.id,
    parent: null,
    startTime: getDoyTimeFromDuration(startTime, activity.startOffset),
    type: activity.type,
  };
}

async function reqHasura<T = any>(
  query: string,
  variables: QueryVariables = {},
): Promise<Record<string, T>> {
  let response: Response;
  let json: any;

  try {
    const user = get<User | null>(userStore);
    const HASURA_URL = hasuraUrl();

    const body = { query, variables };
    const options = {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        'x-auth-sso-token': user.ssoToken ?? '',
      },
      method: 'POST',
    };

    response = await fetch(HASURA_URL, options);
    json = await response.json();

    if (!response.ok) throw new Error(response.statusText);
    if (json.errors) throw new Error(json.errors[0].message);

    const { data } = json;
    return data;
  } catch (e) {
    console.log(e);
    console.log(response);
    console.log(json);
    return null;
  }
}

/* Requests. */

const req = {
  async createActivity(
    newActivity: CreateActivity,
    planId: number,
    planStartTime: string,
  ): Promise<Activity | null> {
    try {
      const start_offset = getIntervalFromDoyRange(
        planStartTime,
        newActivity.startTime,
      );
      const activityInput = {
        arguments: newActivity.arguments,
        plan_id: planId,
        start_offset,
        type: newActivity.type,
      };
      const data = await reqHasura(gql.CREATE_ACTIVITY, {
        activity: activityInput,
      });
      const { createActivity } = data;
      const { id } = createActivity;
      const activity: Activity = {
        ...newActivity,
        children: [],
        duration: 0,
        id,
        parent: null,
      };

      return activity;
    } catch (e) {
      console.log(e);
      return null;
    }
  },

  async createConstraint(
    newConstraint: CreateConstraint,
  ): Promise<Constraint | null> {
    try {
      const constraintInput = {
        definition: newConstraint.definition,
        description: newConstraint.description,
        model_id: newConstraint.modelId,
        name: newConstraint.name,
        plan_id: newConstraint.planId,
        summary: newConstraint.summary,
      };
      const data = await reqHasura(gql.CREATE_CONSTRAINT, {
        constraint: constraintInput,
      });
      const { createConstraint } = data;
      const { id } = createConstraint;
      const constraint: Constraint = {
        ...newConstraint,
        id,
      };

      return constraint;
    } catch (e) {
      console.log(e);
      return null;
    }
  },

  async createModel(
    name: string,
    version: string,
    file: File,
  ): Promise<CreateModel | null> {
    try {
      const jar_id = await req.uploadFile(file);
      const modelInput = {
        jar_id,
        mission: '',
        name,
        version,
      };
      const data = await reqHasura(gql.CREATE_MODEL, { model: modelInput });
      const { createModel } = data;
      const { id } = createModel;
      const model: CreateModel = {
        id,
        jarId: jar_id,
        name,
        version,
      };

      return model;
    } catch (e) {
      console.log(e);
      return null;
    }
  },

  async createPlan(
    endTime: string,
    modelId: number,
    name: string,
    startTime: string,
  ): Promise<CreatePlan | null> {
    try {
      const planInput = {
        duration: getIntervalFromDoyRange(startTime, endTime),
        model_id: modelId,
        name,
        start_time: startTime,
      };
      const data = await reqHasura(gql.CREATE_PLAN, { plan: planInput });
      const { createPlan } = data;
      const { id } = createPlan;
      const plan: CreatePlan = {
        endTime,
        id,
        modelId,
        name,
        startTime,
      };

      return plan;
    } catch (e) {
      console.log(e);
      return null;
    }
  },

  async createSimulation(
    plan_id: number,
    simulation_template_id: number | null = null,
    simulationArguments: ArgumentsMap = {},
  ): Promise<boolean> {
    try {
      const simulationInput = {
        arguments: simulationArguments,
        plan_id,
        simulation_template_id,
      };
      await reqHasura(gql.CREATE_SIMULATION, { simulation: simulationInput });
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  },

  async createView(view: View): Promise<CreateViewResponse> {
    let response: Response;
    let json: CreateViewResponse;
    try {
      const user = get<User | null>(userStore);
      const GATEWAY_URL = gatewayUrl();

      const options = {
        body: JSON.stringify({ view }),
        headers: {
          'Content-Type': 'application/json',
          'x-auth-sso-token': user?.ssoToken,
        },
        method: 'POST',
      };

      response = await fetch(`${GATEWAY_URL}/view`, options);
      json = await response.json();
      if (!response.ok) throw new Error(response.statusText);

      return json;
    } catch (e) {
      console.log(e);
      console.log(response);
      console.log(json);
      return {
        errors: null,
        message: 'An unexpected error occurred',
        success: false,
        view: null,
      };
    }
  },

  async deleteActivity(id: number): Promise<boolean> {
    try {
      await reqHasura(gql.DELETE_ACTIVITY, { id });
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  },

  async deleteConstraint(id: number): Promise<boolean> {
    try {
      await reqHasura(gql.DELETE_CONSTRAINT, { id });
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  },

  async deleteFile(id: number): Promise<boolean> {
    let response: Response;
    let json: any;
    try {
      const user = get<User | null>(userStore);
      const GATEWAY_URL = gatewayUrl();

      const options = {
        headers: {
          'x-auth-sso-token': user?.ssoToken,
        },
        method: 'DELETE',
      };

      response = await fetch(`${GATEWAY_URL}/file/${id}`, options);
      json = await response.json();
      if (!response.ok) throw new Error(response.statusText);

      return true;
    } catch (e) {
      console.log(e);
      console.log(response);
      console.log(json);
      return false;
    }
  },

  async deleteModel(id: number, jarId: number): Promise<boolean> {
    try {
      await req.deleteFile(jarId);
      await reqHasura(gql.DELETE_MODEL, { id });
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  },

  async deletePlanAndSimulations(id: number): Promise<boolean> {
    try {
      await reqHasura(gql.DELETE_PLAN_AND_SIMULATIONS, { id });
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  },

  async deleteView(id: number): Promise<DeleteViewResponse> {
    let response: Response;
    let json: DeleteViewResponse;
    try {
      const user = get<User | null>(userStore);
      const GATEWAY_URL = gatewayUrl();

      const options = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-sso-token': user?.ssoToken,
        },
        method: 'DELETE',
      };

      response = await fetch(`${GATEWAY_URL}/view/${id}`, options);
      json = await response.json();
      if (!response.ok) throw new Error(response.statusText);

      return json;
    } catch (e) {
      console.log(e);
      console.log(response);
      console.log(json);
      return {
        message: 'An unexpected error occurred',
        nextView: null,
        success: false,
      };
    }
  },

  async getActivitiesForPlan(planId: number): Promise<Activity[]> {
    try {
      const data = await reqHasura(gql.GET_ACTIVITIES_FOR_PLAN, { planId });
      const { activities = [], plan } = data;
      const startTime = new Date(plan.startTime);
      const newActivities = activities.map((activity: any) =>
        toActivity(activity, startTime),
      );

      return newActivities;
    } catch (e) {
      console.log(e);
      return [];
    }
  },

  async getEffectiveActivityArguments(
    modelId: number,
    activityTypeName: string,
    argumentsMap: ArgumentsMap,
  ): Promise<EffectiveArguments | null> {
    try {
      const data = await reqHasura<EffectiveArguments>(
        gql.GET_EFFECTIVE_ACTIVITY_ARGUMENTS,
        {
          activityTypeName,
          arguments: argumentsMap,
          modelId,
        },
      );
      const { effectiveActivityArguments } = data;
      return effectiveActivityArguments;
    } catch (e) {
      console.log(e);
      return null;
    }
  },

  async getEffectiveModelArguments(
    modelId: number,
    argumentsMap: ArgumentsMap,
  ): Promise<EffectiveArguments | null> {
    try {
      const data = await reqHasura<EffectiveArguments>(
        gql.GET_EFFECTIVE_MODEL_ARGUMENTS,
        {
          arguments: argumentsMap,
          modelId,
        },
      );
      const { effectiveModelArguments } = data;
      return effectiveModelArguments;
    } catch (e) {
      console.log(e);
      return null;
    }
  },

  async getModels(): Promise<CreateModel[]> {
    try {
      const data = await reqHasura(gql.GET_MODELS);
      const { models = [] } = data;
      return models;
    } catch (e) {
      console.log(e);
      return [];
    }
  },

  async getPlan(id: number): Promise<Plan | null> {
    try {
      const data = await reqHasura(gql.GET_PLAN, { id });
      const { plan } = data;
      const startTime = new Date(plan.startTime);

      return {
        ...plan,
        activities: plan.activities.map((activity: any) =>
          toActivity(activity, startTime),
        ),
        endTime: getDoyTimeFromDuration(startTime, plan.duration),
        startTime: getDoyTime(startTime),
      };
    } catch (e) {
      console.log(e);
      return null;
    }
  },

  async getPlansAndModels(): Promise<{
    models: CreatePlanModel[];
    plans: CreatePlan[];
  }> {
    try {
      const data = await reqHasura(gql.GET_PLANS_AND_MODELS);
      const { models, plans } = data;

      return {
        models,
        plans: plans.map((plan: any) => {
          const startTime = new Date(plan.startTime);
          return {
            ...plan,
            endTime: getDoyTimeFromDuration(startTime, plan.duration),
            startTime: getDoyTime(startTime),
          };
        }),
      };
    } catch (e) {
      console.log(e);
      return { models: [], plans: [] };
    }
  },

  async getView(query: URLSearchParams): Promise<View | null> {
    let response: Response;
    let json: GetViewResponse;
    try {
      const user = get<User | null>(userStore);
      const GATEWAY_URL = gatewayUrl();
      const viewId = query.has('viewId') ? query.get('viewId') : 'latest';

      const options = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-sso-token': user?.ssoToken,
        },
        method: 'GET',
      };

      response = await fetch(`${GATEWAY_URL}/view/${viewId}`, options);
      json = await response.json();
      if (!response.ok) throw new Error(response.statusText);

      const { view } = json;
      return view;
    } catch (e) {
      console.log(e);
      console.log(response);
      console.log(json);
      return null;
    }
  },

  async getViews(): Promise<View[] | null> {
    let response: Response;
    let json: View[];
    try {
      const user = get<User | null>(userStore);
      const GATEWAY_URL = gatewayUrl();

      const options = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-sso-token': user?.ssoToken,
        },
        method: 'GET',
      };

      response = await fetch(`${GATEWAY_URL}/views`, options);
      json = await response.json();
      if (!response.ok) throw new Error(response.statusText);

      return json;
    } catch (e) {
      console.log(e);
      console.log(response);
      console.log(json);
      return null;
    }
  },

  async login(username: string, password: string): Promise<ReqLoginResponse> {
    let response: Response;
    let json: any;
    try {
      const GATEWAY_URL = gatewayUrl();
      const body = JSON.stringify({ password, username });
      const options = {
        body,
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      };

      response = await fetch(`${GATEWAY_URL}/auth/login`, options);
      json = await response.json();
      if (!response.ok) throw new Error(response.statusText);

      return json;
    } catch (e) {
      console.log(e);
      console.log(response);
      console.log(json);
      return {
        message: 'An unexpected error occurred',
        ssoToken: null,
        success: false,
        username: null,
      };
    }
  },

  async logout(ssoToken: string): Promise<ReqLogoutResponse> {
    let response: Response;
    let json: any;
    try {
      const GATEWAY_URL = gatewayUrl();
      const options = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-sso-token': ssoToken,
        },
        method: 'DELETE',
      };

      response = await fetch(`${GATEWAY_URL}/auth/logout`, options);
      json = await response.json();
      if (!response.ok) throw new Error(response.statusText);

      return json;
    } catch (e) {
      console.log(e);
      console.log(response);
      console.log(json);
      return { message: 'An unexpected error occurred', success: false };
    }
  },

  async resourceTypes(modelId: number): Promise<ResourceType[]> {
    try {
      const data = await reqHasura<ResourceType[]>(gql.RESOURCE_TYPES, {
        modelId,
      });
      const { resourceTypes } = data;
      return resourceTypes;
    } catch (e) {
      console.log(e);
      return [];
    }
  },

  async schedule(planId: number): Promise<SchedulingResponse> {
    let response: Response;
    let json: SchedulingResponse;
    try {
      const user = get<User | null>(userStore);
      const SCHEDULER_URL = schedulerUrl();

      const body = {
        action: { name: 'SCHEDULE' },
        input: { planId: `${planId}` },
        session_variables: { 'x-hasura-role': '' },
      };
      const options = {
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
          'x-auth-sso-token': user?.ssoToken,
        },
        method: 'POST',
      };

      response = await fetch(`${SCHEDULER_URL}/schedule`, options);
      json = await response.json();
      if (!response.ok) throw new Error(response.statusText);
      return json;
    } catch (e) {
      console.log(e);
      console.log(response);
      console.log(json);
      return { status: 'failed' };
    }
  },

  async session(ssoToken: string): Promise<ReqSessionResponse> {
    let response: Response;
    let json: any;
    try {
      const GATEWAY_URL = gatewayUrl();
      const options = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-sso-token': ssoToken,
        },
        method: 'GET',
      };

      response = await fetch(`${GATEWAY_URL}/auth/session`, options);
      json = await response.json();
      if (!response.ok) throw new Error(response.statusText);

      return json;
    } catch (e) {
      console.log(e);
      console.log(response);
      console.log(json);
      return {
        message: 'An unexpected error occurred',
        success: false,
      };
    }
  },

  async setAppStores(fetch: Fetch, session: App.Session): Promise<void> {
    let response: Response;
    let json: any;
    try {
      response = await fetch('/env');
      json = await response.json();
      if (!response.ok) throw new Error(response.statusText);
      envStore.set(json);
      userStore.set(session.user || null);
    } catch (e) {
      console.log(e);
      console.log(response);
      console.log(json);
      envStore.set(defaultEnv);
      userStore.set(session?.user || null);
    }
  },

  async simulate(
    modelId: number,
    planId: number,
  ): Promise<{
    activitiesMap?: ActivitiesMap;
    constraintViolations?: ConstraintViolation[];
    resources?: Resource[];
    status: 'complete' | 'failed' | 'incomplete';
  }> {
    try {
      const data = await reqHasura<SimulateResponse>(gql.SIMULATE, { planId });
      const { simulate } = data;
      const { results, status }: SimulateResponse = simulate;

      if (status === 'complete') {
        // Activities.
        const activitiesMap: ActivitiesMap = {};
        for (const [id, activity] of Object.entries(results.activities)) {
          activitiesMap[id] = {
            arguments: activity.arguments,
            children: activity.children,
            duration: activity.duration,
            id: parseFloat(id),
            parent: activity.parent,
            startTime: activity.startTimestamp,
            type: activity.type,
          };
        }

        // Resources.
        const resourceTypes: ResourceType[] = await req.resourceTypes(modelId);
        const resourceTypesMap = resourceTypes.reduce(
          (map: Record<string, ValueSchema>, { name, schema }) => {
            map[name] = schema;
            return map;
          },
          {},
        );
        const resources: Resource[] = Object.entries(results.resources).map(
          ([name, values]) => ({
            name,
            schema: resourceTypesMap[name],
            startTime: results.start,
            values,
          }),
        );

        // Constraint Violations.
        const constraintViolations: ConstraintViolation[] = Object.entries(
          results.constraints,
        ).flatMap(([name, violations]) =>
          violations.map(violation => ({
            associations: violation.associations,
            constraint: { name },
            windows: violation.windows,
          })),
        );

        return { activitiesMap, constraintViolations, resources, status };
      } else {
        return { status };
      }
    } catch (e) {
      console.log(e);
      return { status: 'failed' };
    }
  },

  async updateActivity(
    activity: UpdateActivity,
    planStartTime: string,
  ): Promise<UpdateActivity | null> {
    const activityInput: UpdateActivityInput = {};

    if (activity.arguments) {
      activityInput.arguments = activity.arguments;
    }

    if (activity.startTime) {
      activityInput.start_offset = getIntervalFromDoyRange(
        planStartTime,
        activity.startTime,
      );
    }

    try {
      await reqHasura(gql.UPDATE_ACTIVITY, {
        activity: activityInput,
        id: activity.id,
      });
      return activity;
    } catch (e) {
      console.log(e);
      return null;
    }
  },

  async updateConstraint(updatedConstraint: Constraint): Promise<Constraint> {
    try {
      const constraintInput = {
        definition: updatedConstraint.definition,
        description: updatedConstraint.description,
        model_id: updatedConstraint.modelId,
        name: updatedConstraint.name,
        plan_id: updatedConstraint.planId,
        summary: updatedConstraint.summary,
      };
      await reqHasura(gql.UPDATE_CONSTRAINT, {
        constraint: constraintInput,
        id: updatedConstraint.id,
      });
      return updatedConstraint;
    } catch (e) {
      console.log(e);
      return null;
    }
  },

  async updateSimulation(simulation: Simulation): Promise<Simulation | null> {
    try {
      const data = await reqHasura<Simulation>(gql.UPDATE_SIMULATION, {
        id: simulation.id,
        simulation: {
          arguments: simulation.arguments,
          simulation_template_id: simulation?.template?.id ?? null,
        },
      });
      const { updateSimulation } = data;
      return updateSimulation;
    } catch (e) {
      console.log(e);
      return null;
    }
  },

  async updateView(view: View): Promise<UpdateViewResponse> {
    let response: Response;
    let json: UpdateViewResponse;
    try {
      const user = get<User | null>(userStore);
      const GATEWAY_URL = gatewayUrl();

      const options = {
        body: JSON.stringify({ view }),
        headers: {
          'Content-Type': 'application/json',
          'x-auth-sso-token': user?.ssoToken,
        },
        method: 'PUT',
      };

      response = await fetch(`${GATEWAY_URL}/view/${view.id}`, options);
      json = await response.json();
      if (!response.ok) throw new Error(response.statusText);

      return json;
    } catch (e) {
      console.log(e);
      console.log(response);
      console.log(json);
      return {
        errors: null,
        message: 'An unexpected error occurred',
        success: false,
      };
    }
  },

  async uploadFile(file: File): Promise<number | null> {
    let response: Response;
    let json: any;
    try {
      const user = get<User | null>(userStore);
      const GATEWAY_URL = gatewayUrl();

      const body = new FormData();
      body.append('file', file, file.name);
      const options = {
        body,
        headers: {
          'x-auth-sso-token': user?.ssoToken,
        },
        method: 'POST',
      };

      response = await fetch(`${GATEWAY_URL}/file`, options);
      json = await response.json();
      if (!response.ok) throw new Error(response.statusText);

      const { id } = json;
      return id;
    } catch (e) {
      console.log(e);
      console.log(response);
      console.log(json);
      return null;
    }
  },

  async uploadFiles(files: File[]): Promise<boolean> {
    try {
      for (const file of files) {
        await req.uploadFile(file);
      }
      return true;
    } catch (e) {
      console.log(e);
      return false;
    }
  },

  async validateActivityArguments(
    activityTypeName: string,
    modelId: number,
    argumentsMap: ArgumentsMap,
  ): Promise<ParameterValidationResponse> {
    try {
      const data = await reqHasura<ParameterValidationResponse>(
        gql.VALIDATE_ACTIVITY_ARGUMENTS,
        {
          activityTypeName,
          arguments: argumentsMap,
          modelId,
        },
      );

      const { validateActivityArguments } = data;
      return validateActivityArguments;
    } catch (e) {
      console.log(e);
      const { message } = e;
      return { errors: [message], success: false };
    }
  },

  async validateConstraint(body: string) {
    let response: Response;
    let json: any;
    try {
      const GATEWAY_URL = gatewayUrl();
      const options = {
        body,
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      };

      response = await fetch(`${GATEWAY_URL}/constraint/validate`, options);
      json = await response.json();
      if (!response.ok) throw new Error(response.statusText);

      return json;
    } catch (e) {
      console.log(e);
      console.log(response);
      console.log(json);
      return {
        errors: ['An unexpected error occurred'],
        valid: false,
      };
    }
  },
};

export default req;
