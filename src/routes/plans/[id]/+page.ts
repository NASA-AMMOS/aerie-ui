import { base } from '$app/paths';
import { redirect } from '@sveltejs/kit';
import { SearchParameters } from '../../../enums/searchParameters';
import { planReadOnly } from '../../../stores/plan';
import type { PlanMergeRequestSchema } from '../../../types/plan';
import effects from '../../../utilities/effects';
import { getSearchParameterNumber } from '../../../utilities/generic';
import { featurePermissions } from '../../../utilities/permissions';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params, url }) => {
  const { user } = await parent();

  const { id } = params;
  const planId = parseFloat(id);

  if (!Number.isNaN(planId)) {
    let initialPlan = await effects.getPlan(planId, user);

    if (initialPlan) {
      // If the plan is in merge review, check if the current user can review the merge.
      if (initialPlan.is_locked) {
        const initialMergeRequest: PlanMergeRequestSchema | null = await effects.getPlanMergeRequestInProgress(
          planId,
          user,
        );

        if (initialMergeRequest) {
          const {
            plan_snapshot_supplying_changes: { plan: sourcePlan },
            plan_receiving_changes: targetPlan,
          } = initialMergeRequest;

          const hasReviewPermission = featurePermissions.planBranch.canReviewRequest(
            user,
            sourcePlan,
            targetPlan,
            initialPlan.model,
          );

          // If the user can review the merge, take them to the merge review screen.
          if (hasReviewPermission) {
            throw redirect(302, `${base}/plans/${id}/merge`);
          }

          planReadOnly.set(true);
        }
      }

      // if plan doesn't have a scheduling spec, create one at this point
      if (!initialPlan.scheduling_specification) {
        const { start_time_doy, end_time_doy, revision } = initialPlan;
        const schedulingSpec = await effects.createSchedulingSpec(
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
      const initialPlanTags = await effects.getPlanTags(initialPlan.id, user);
      const initialView = await effects.getView(url.searchParams, user, initialActivityTypes, initialResourceTypes);
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

  throw redirect(302, `${base}/plans`);
};
