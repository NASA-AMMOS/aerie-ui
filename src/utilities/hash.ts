//https://stackoverflow.com/questions/40958727/javascript-generate-unique-number-based-on-string
// https://github.com/bryc/code/blob/master/jshash/experimental/cyrb53.js

import type { ExternalEventDB, ExternalEventPkey } from '../types/external-event';
import type { ExternalSourcePkey, ExternalSourceSlim } from '../types/external-source';

/*
    cyrb53a (c) 2023 bryc (github.com/bryc)
    License: Public domain. Attribution appreciated.
    The original cyrb53 has a slight mixing bias in the low bits of h1.
    This shouldn't be a huge problem, but I want to try to improve it.
    This new version should have improved avalanche behavior, but
    it is not quite final, I may still find improvements.
    So don't expect it to always produce the same output.
*/
export const cyrb53a = function (str: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 0x85ebca77);
    h2 = Math.imul(h2 ^ ch, 0xc2b2ae3d);
  }
  h1 ^= Math.imul(h1 ^ (h2 >>> 15), 0x735a2d97);
  h2 ^= Math.imul(h2 ^ (h1 >>> 15), 0xcaf649a9);
  h1 ^= h2 >>> 16;
  h2 ^= h1 >>> 16;
  return 2097152 * (h2 >>> 0) + (h1 >>> 11);
};

export function getRowIdExternalSourceSlim(externalSourceSlim: ExternalSourceSlim) {
  // https://stackoverflow.com/questions/40958727/javascript-generate-unique-number-based-on-string
  return cyrb53a(
    externalSourceSlim.pkey.derivation_group_name +
      externalSourceSlim.pkey.key +
      externalSourceSlim.pkey.source_type_name,
  );
}

export function getRowIdExternalSource(externalSourcePkey: ExternalSourcePkey) {
  // https://stackoverflow.com/questions/40958727/javascript-generate-unique-number-based-on-string
  return cyrb53a(
    externalSourcePkey.derivation_group_name + externalSourcePkey.key + externalSourcePkey.source_type_name,
  );
}

export function getRowIdExternalEventWhole(externalEvent: ExternalEventDB) {
  // https://stackoverflow.com/questions/40958727/javascript-generate-unique-number-based-on-string
  return cyrb53a(
    externalEvent.pkey.derivation_group_name +
      externalEvent.pkey.source_key +
      externalEvent.pkey.event_type_name +
      externalEvent.pkey.key,
  );
}

export function getRowIdExternalEvent(externalEventPkey: ExternalEventPkey) {
  // https://stackoverflow.com/questions/40958727/javascript-generate-unique-number-based-on-string
  return cyrb53a(
    externalEventPkey.derivation_group_name +
      externalEventPkey.source_key +
      externalEventPkey.event_type_name +
      externalEventPkey.key,
  );
}
