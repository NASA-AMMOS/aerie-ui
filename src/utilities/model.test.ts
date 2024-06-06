import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ModelSlim, ModelStatus, ModelStatusRollup } from '../types/model';
import { getModelStatusRollup } from './model';

type ModelTest = Pick<
  ModelSlim,
  'refresh_activity_type_logs' | 'refresh_model_parameter_logs' | 'refresh_resource_type_logs'
>;

type TestTuple = [string, ModelTest, keyof ModelStatusRollup, ModelStatus];

describe('Model util functions', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getModelStatusRollup', () => {
    const testCases: TestTuple[] = [
      [
        'a activity log extracting',
        {
          refresh_activity_type_logs: [],
          refresh_model_parameter_logs: [],
          refresh_resource_type_logs: [],
        },
        'activityLogStatus',
        'extracting',
      ],
      [
        'a activity log extracted',
        {
          refresh_activity_type_logs: [
            {
              error: null,
              error_message: null,
              success: true,
            },
          ],
          refresh_model_parameter_logs: [],
          refresh_resource_type_logs: [],
        },
        'activityLogStatus',
        'complete',
      ],
      [
        'a activity log error',
        {
          refresh_activity_type_logs: [
            {
              error: 'error',
              error_message: 'error',
              success: false,
            },
          ],
          refresh_model_parameter_logs: [],
          refresh_resource_type_logs: [],
        },
        'activityLogStatus',
        'error',
      ],
      [
        'a parameter log extracting',
        {
          refresh_activity_type_logs: [],
          refresh_model_parameter_logs: [],
          refresh_resource_type_logs: [],
        },
        'parameterLogStatus',
        'extracting',
      ],
      [
        'a parameter log extracted',
        {
          refresh_activity_type_logs: [],
          refresh_model_parameter_logs: [
            {
              error: null,
              error_message: null,
              success: true,
            },
          ],
          refresh_resource_type_logs: [],
        },
        'parameterLogStatus',
        'complete',
      ],
      [
        'a parameter log error',
        {
          refresh_activity_type_logs: [],
          refresh_model_parameter_logs: [
            {
              error: 'error',
              error_message: 'error',
              success: false,
            },
          ],
          refresh_resource_type_logs: [],
        },
        'parameterLogStatus',
        'error',
      ],
      [
        'a resource log extracting',
        {
          refresh_activity_type_logs: [],
          refresh_model_parameter_logs: [],
          refresh_resource_type_logs: [],
        },
        'resourceLogStatus',
        'extracting',
      ],
      [
        'a resource log extracted',
        {
          refresh_activity_type_logs: [],
          refresh_model_parameter_logs: [],
          refresh_resource_type_logs: [
            {
              error: null,
              error_message: null,
              success: true,
            },
          ],
        },
        'resourceLogStatus',
        'complete',
      ],
      [
        'a resource log error',
        {
          refresh_activity_type_logs: [],
          refresh_model_parameter_logs: [],
          refresh_resource_type_logs: [
            {
              error: 'error',
              error_message: 'error',
              success: false,
            },
          ],
        },
        'resourceLogStatus',
        'error',
      ],
      [
        'a model extracting',
        {
          refresh_activity_type_logs: [
            {
              error: null,
              error_message: null,
              success: true,
            },
          ],
          refresh_model_parameter_logs: [],
          refresh_resource_type_logs: [],
        },
        'modelStatus',
        'extracting',
      ],
      [
        'a model extracted',
        {
          refresh_activity_type_logs: [
            {
              error: null,
              error_message: null,
              success: true,
            },
          ],
          refresh_model_parameter_logs: [
            {
              error: null,
              error_message: null,
              success: true,
            },
          ],
          refresh_resource_type_logs: [
            {
              error: null,
              error_message: null,
              success: true,
            },
          ],
        },
        'modelStatus',
        'complete',
      ],
      [
        'a model error',
        {
          refresh_activity_type_logs: [],
          refresh_model_parameter_logs: [],
          refresh_resource_type_logs: [
            {
              error: 'error',
              error_message: 'error',
              success: false,
            },
          ],
        },
        'modelStatus',
        'error',
      ],
    ];

    it.each<TestTuple>(testCases)(
      'should return %s status',
      (_message: string, model: ModelTest, accessor: keyof ModelStatusRollup, result: ModelStatus) => {
        expect(getModelStatusRollup(model)[accessor]).toEqual(result);
      },
    );
  });
});
