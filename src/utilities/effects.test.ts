import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as Errors from '../stores/errors';
import type { User } from '../types/app';
import effects from './effects';
import * as Modals from './modal';
import * as Requests from './requests';

vi.mock('$env/dynamic/public', () => import.meta.env); // https://github.com/sveltejs/kit/issues/8180
vi.mock('./toast', () => ({
  showFailureToast: vi.fn(),
  showSuccessToast: vi.fn(),
}));
const catchErrorSpy = vi.fn();

const user: User = {
  activeRole: 'aerie_admin',
  allowedRoles: ['aerie_admin'],
  defaultRole: 'aerie_admin',
  id: 'test',
  permissibleQueries: {
    apply_preset_to_activity: true,
  },
  token: 'token',
};

describe('Handle modal and requests in effects', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    catchErrorSpy.mockReset();
  });

  describe('applyPresetToActivity', () => {
    it('should correctly handle null responses', async () => {
      vi.spyOn(Requests, 'reqHasura').mockResolvedValue({
        apply_preset_to_activity: null,
      });

      vi.spyOn(Modals, 'showConfirmModal').mockResolvedValueOnce({ confirm: true });
      vi.spyOn(Errors, 'catchError').mockImplementationOnce(catchErrorSpy);

      await effects.applyPresetToActivity(1, 1, 1, 3, user);

      expect(catchErrorSpy).toHaveBeenCalledOnce();
    });
  });

  describe('checkConstraints', () => {
    it('should correctly handle null responses', async () => {
      vi.spyOn(Requests, 'reqHasura').mockResolvedValue({
        checkConstraintsResponse: null,
      });

      vi.spyOn(Modals, 'showConfirmModal').mockResolvedValueOnce({ confirm: true });
      vi.spyOn(Errors, 'catchError').mockImplementationOnce(catchErrorSpy);

      await effects.checkConstraints(user);

      expect(catchErrorSpy).toHaveBeenCalledOnce();
    });
  });

  describe('createActivityDirective', () => {
    it('should correctly handle null responses', async () => {
      vi.spyOn(Requests, 'reqHasura').mockResolvedValue({
        insert_activity_directive_one: null,
      });

      vi.spyOn(Errors, 'catchError').mockImplementationOnce(catchErrorSpy);

      await effects.createActivityDirective({}, '2020-100T00:00:00', '', 'foo', {}, user);

      expect(catchErrorSpy).toHaveBeenCalledOnce();
    });
  });
});
