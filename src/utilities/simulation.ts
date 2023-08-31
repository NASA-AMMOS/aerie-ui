import type { SimulationDataset } from '../types/simulation';
import { getUnixEpochTimeFromInterval } from './time';

/**
 * Returns the string version of an object of unknown type or returns null if this operation fails.
 */
export function getSimulationProgress(simulationDataset: SimulationDataset | null) {
  if (!simulationDataset || !simulationDataset.simulation_start_time || !simulationDataset.simulation_end_time) {
    return 0;
  }
  const simulationStartTimeMS = new Date(simulationDataset.simulation_start_time).getTime();
  const simulationEndTimeMS = new Date(simulationDataset.simulation_end_time).getTime();
  let simulationExtentMS = 0;
  if (
    (simulationDataset.status === 'incomplete' || simulationDataset.status === 'failed') &&
    simulationDataset.extent?.extent
  ) {
    simulationExtentMS =
      getUnixEpochTimeFromInterval(simulationDataset.simulation_start_time, simulationDataset.extent?.extent) -
      simulationStartTimeMS;
  } else if (simulationDataset.status === 'success') {
    simulationExtentMS = simulationEndTimeMS - simulationStartTimeMS;
  }
  const simulationDuration = simulationEndTimeMS - simulationStartTimeMS;
  return (simulationExtentMS / simulationDuration) * 100 || 0;
}
