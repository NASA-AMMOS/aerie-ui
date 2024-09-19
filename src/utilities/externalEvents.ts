import type { ExternalEvent, ExternalEventId, ExternalEventPkey, ExternalEventType } from '../types/external-event';
import type {
  DerivationGroup,
  ExternalSourcePkey,
  ExternalSourceSlim,
  ExternalSourceType,
} from '../types/external-source';

// External Event Row/Hash Functions
export function getRowIdExternalEventWhole(externalEvent: ExternalEvent): ExternalEventId {
  return (
    externalEvent.pkey.derivation_group_name +
    externalEvent.pkey.source_key +
    externalEvent.pkey.event_type_name +
    externalEvent.pkey.key
  );
}

export function getRowIdExternalEvent(externalEventPkey: ExternalEventPkey): ExternalEventId {
  return (
    externalEventPkey.derivation_group_name +
    externalEventPkey.source_key +
    externalEventPkey.event_type_name +
    externalEventPkey.key
  );
}

export function getRowIdExternalEventType(externalEventType: ExternalEventType): string {
  return externalEventType.name;
}

// External Source Row/Hash Functions
export function getRowIdExternalSourceSlim(externalSourceSlim: ExternalSourceSlim): string {
  return externalSourceSlim.pkey.derivation_group_name + externalSourceSlim.pkey.key;
}

export function getRowIdExternalSource(externalSourcePkey: ExternalSourcePkey): string {
  return externalSourcePkey.derivation_group_name + externalSourcePkey.key;
}

export function getRowIdDerivationGroup(derivationGroup: DerivationGroup): string {
  return `${derivationGroup.name}:${derivationGroup.source_type_name}`;
}

export function getRowIdExternalSourceType(externalSourceType: ExternalSourceType): string {
  return externalSourceType.name;
}
