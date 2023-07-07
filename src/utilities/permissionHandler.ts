import type { Action, ActionReturn } from 'svelte/action';
import type { Plugin, Props } from 'tippy.js';
import tippy from 'tippy.js';

interface PermissionHandlerProps extends Partial<Omit<Props, 'content'>> {
  hasPermission?: boolean;
  permissionError?: string;
}

/**
 * @see https://dev.to/danawoodman/svelte-quick-tip-using-actions-to-integrate-with-javascript-libraries-tippy-tooltips-2m94
 */
export const permissionHandler: Action<HTMLElement, PermissionHandlerProps> = (
  node: Element,
  { permissionError, ...params }: PermissionHandlerProps = {},
): ActionReturn<any, any> => {
  // Determine the title to show. We want to prefer
  // the permissionError content passed in first, then the
  // HTML title attribute then the aria-label
  // in that order.
  const existingError = node.getAttribute('aria-errormessage');
  const tabIndex = node.getAttribute('tabindex');
  const classList = node.className;
  const { hasPermission } = params;

  // Clear out the HTML title attribute since
  // we don't want the default behavior of it
  // showing up on hover.
  const htmlNode = node as HTMLElement;
  if (htmlNode?.title) {
    htmlNode.title = '';
  }

  // Support any of the Tippy props by forwarding all "params":
  // https://atomiks.github.io/tippyjs/v6/all-props/
  const tip: any = tippy(node, {
    ...params,
    ...(permissionError !== null ? { content: permissionError } : {}),
    plugins: [permission],
  });

  const preventClick = (event: Event) => {
    event.stopPropagation();
    event.stopImmediatePropagation();
    event.preventDefault();
  };

  const preventFocus = (event: Event) => {
    if (event.target !== null) {
      (event.target as HTMLElement).blur();
    }
  };

  const handlePermission = (hasPermission: boolean = true, permissionError?: string) => {
    if (hasPermission === false) {
      node.setAttribute('tabindex', '-1');
      node.setAttribute('readonly', 'readonly');
      node.setAttribute('class', `${classList} permission-disabled`);
      // Let's make sure the "aria-errormessage" attribute
      // is set so our element is accessible:
      // https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-errormessage
      if (permissionError) {
        node.setAttribute('aria-errormessage', permissionError);
      }
      node.addEventListener('mousedown', preventClick);
      node.addEventListener('mouseup', preventClick);
      node.addEventListener('click', preventClick);
      node.addEventListener('focus', preventFocus);
    } else {
      if (tabIndex !== null) {
        node.setAttribute('tabindex', tabIndex);
      } else {
        node.removeAttribute('tabindex');
      }

      if (existingError) {
        node.setAttribute('aria-errormessage', existingError);
      } else {
        node.removeAttribute('aria-errormessage');
      }
      node.removeAttribute('readonly');
      node.setAttribute('class', classList);
      node.removeEventListener('mousedown', preventClick);
      node.removeEventListener('mouseup', preventClick);
      node.removeEventListener('click', preventClick);
      node.removeEventListener('focus', preventFocus);
    }
  };

  handlePermission(hasPermission, permissionError);

  return {
    // Clean up the Tippy instance on unmount.
    destroy: () => {
      node.removeEventListener('mousedown', preventClick);
      node.removeEventListener('mouseup', preventClick);
      node.removeEventListener('click', preventClick);
      node.removeEventListener('focus', preventFocus);

      tip.destroy();
    },

    // If the props change, let's update the Tippy instance.
    update: ({ hasPermission, permissionError, ...newParams }: PermissionHandlerProps) => {
      handlePermission(hasPermission, permissionError);
      tip.setProps({ content: permissionError, hasPermission, ...newParams });
    },
  };
};

const permission: Plugin<PermissionHandlerProps & { hasPermission?: boolean }> = {
  defaultValue: false,
  fn(instance) {
    return {
      onBeforeUpdate(instance, partialProps) {
        if (partialProps.hasPermission !== false) {
          instance.disable();
        } else {
          instance.enable();
        }
      },
      onCreate() {
        if (instance.props.hasPermission !== false) {
          instance.disable();
        }
      },
    };
  },
  name: 'hasPermission',
};
