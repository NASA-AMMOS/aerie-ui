export type AdaptationCode = {
  getAdaptations: () => Promise<Adaptations>;
};

export type Adaptations = {
  sequencing?: null;
  time?: {
    primary?: {
      format?: (date: Date) => string;
      label?: string;
      parse?: (string: string) => Date;
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
