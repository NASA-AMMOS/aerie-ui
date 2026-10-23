export type DropdownOptionValue = string | number;
export type SelectedDropdownOptionValue = DropdownOptionValue | null;

export type DropdownOption = {
  display: string;
  hasSelectPermission?: boolean;
  value: DropdownOptionValue;
};

export type DropdownOptions = DropdownOption[];

/**
 * One choice offered by {@link DownloadMenu}: `name` is the filename to save it as. `disabled` is never
 * reflected as the real `disabled`/`aria-disabled` attribute (that would also suppress the hover tooltip
 * showing `disabledReason`); callers just skip acting on a disabled option's selection.
 */
export type DownloadMenuOption = {
  disabled?: boolean;
  disabledReason?: string;
  label: string;
  name: string;
};
