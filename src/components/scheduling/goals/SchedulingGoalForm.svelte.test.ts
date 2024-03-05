import { cleanup, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_ROLE } from '../../../utilities/permissions';
import SchedulingGoalForm from './SchedulingGoalForm.svelte';

vi.mock('$env/dynamic/public', () => import.meta.env); // https://github.com/sveltejs/kit/issues/8180

describe('Scheduling Goal Form component', () => {
  afterEach(() => {
    cleanup();
  });

  it('Should not assume all plans have a scheduling spec', () => {
    const { container } = render(SchedulingGoalForm, {
      user: {
        activeRole: ADMIN_ROLE,
        allowedRoles: [ADMIN_ROLE],
        defaultRole: ADMIN_ROLE,
        id: 'foo',
        permissibleQueries: {},
        rolePermissions: {},
        token: '',
      },
    });

    const planDropdown: HTMLSelectElement | null = container.querySelector('.st-select[name="plan"]');

    // Ensure the page and dropdown were rendered;
    expect(planDropdown).not.to.exist;
  });
});
