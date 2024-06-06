import { base } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { SearchParameters } from '../../../enums/searchParameters';
import { externalEventTypes } from '../../../stores/external-event';
import { planReadOnlyMergeRequest } from '../../../stores/plan';
import effects from '../../../utilities/effects';
import { getSearchParameterNumber } from '../../../utilities/generic';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params, url }) => {
  const { user } = await parent();

  const { id } = params;
  const planId = parseFloat(id);

  if (!Number.isNaN(planId)) {
    let initialPlan = await effects.getPlan(planId, user);

    if (initialPlan) {
      if (initialPlan.is_locked) {
        planReadOnlyMergeRequest.set(true);
      }

      // if plan doesn't have a scheduling spec, create one at this point
      // this code only runs if a user manually deletes their scheduling specification somehow
      if (!initialPlan.scheduling_specification) {
        const { start_time_doy, end_time_doy, revision } = initialPlan;
        const schedulingSpec = await effects.createSchedulingPlanSpecification(
          {
            analysis_only: false,
            horizon_end: end_time_doy,
            horizon_start: start_time_doy,
            plan_id: planId,
            plan_revision: revision,
            simulation_arguments: {},
          },
          user,
        );

        initialPlan = {
          ...initialPlan,
          scheduling_specification: schedulingSpec ? schedulingSpec : null,
        };
      }

      const initialActivityTypes = await effects.getActivityTypes(initialPlan.model_id, user);
      const initialResourceTypes = await effects.getResourceTypes(initialPlan.model_id, user, 20);
      const initialExternalEventTypes: string[] = get(externalEventTypes); // TODO: in MPS-111, get this from a database instead of a store. Getting a store on page mount doesn't grab values correctly
      const initialPlanTags = await effects.getPlanTags(initialPlan.id, user);
      const initialView = await effects.getView(
        url.searchParams,
        user,
        initialActivityTypes,
        initialResourceTypes,
        initialExternalEventTypes
        initialPlan.model.view,
      );
      const initialPlanSnapshotId = getSearchParameterNumber(SearchParameters.SNAPSHOT_ID, url.searchParams);
      const extensions = await effects.getExtensions(user);

      return {
        extensions,
        initialActivityTypes,
        initialPlan,
        initialPlanSnapshotId,
        initialPlanTags,
        initialView,
        user,
      };
    }
  }

  redirect(302, `${base}/plans`);
};
