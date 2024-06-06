import type { ExternalEventDB } from "../types/external-event";
import gql from '../utilities/gql';
import { selectedPlanExternalSourceIds } from './external-source';
import { gqlSubscribable } from './subscribable';

export const externalEventsDB = gqlSubscribable<ExternalEventDB[]>(
  gql.SUB_PLAN_EXTERNAL_EVENTS,
  { source_ids: selectedPlanExternalSourceIds },
  [],
  null,
);