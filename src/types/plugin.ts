import type { ValidationResult } from './form';

export type PluginCode = {
  getPlugin: () => Promise<Plugins>;
};

export type Plugins = {
  sequencing?: null;
  time?: {
    primary?: {
      format?: (date: Date) => string;
      formatString?: string;
      label?: string;
      parse?: (string: string) => Date;
      validate?: (string: string) => Promise<ValidationResult>;
    };
    secondary?: {
      format?: (date: Date) => string;
      label?: string;
      parse?: (string: string) => Date;
    };
    ticks?: {
      getTicks?: (start: Date, stop: Date, count: number) => Date[];
      tickLabelWidth?: number;
    };
  };
};
