import { merge } from 'lodash-es';
import type { Adaptations } from '../types/adaptation';

const adaptations: Adaptations = {};

export async function loadAdaptationCode(path: string) {
  const code = await import(path);
  const adaptation = await code.getAdaptation();
  return merge(adaptation, adaptations);
}
// export class UserAdaptations {
//   adaptations: Adaptations;

//   constructor() {
//     this.adaptations = {};
//   }

//   async loadAdaptationCode(path: AdaptationCode) {
//     const a = await import('../time-adaptation.js');
//     // a.getAdaptation();
//     console.log('a :>> ', a);
//     const adaptation = await a.getAdaptation();
//     // const adaptation = Function(`return ${adaptation}`);
//     // const partialAdaptations = (await adaptation.getAdaptations()) ?? {};
//     this.adaptations = merge(adaptation, adaptations);
//     console.log(this.adaptations);
//   }
// }
