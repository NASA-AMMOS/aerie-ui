import type { ValidationResult } from './form';

export type PluginCode = {
  getPlugin: () => Promise<Plugins>;
};

export type PluginTime = {
  format?: (date: Date) => string;
  formatString?: string;
  label?: string;
  parse?: (string: string) => Date;
  validate?: (string: string) => Promise<ValidationResult>;
};

export type Plugins = {
  time?: {
    additional?: PluginTime[]; // TODO bikeshed
    primary?: PluginTime;
    ticks?: {
      getTicks?: (start: Date, stop: Date, count: number) => Date[];
      tickLabelWidth?: number;
    };
  };
};
