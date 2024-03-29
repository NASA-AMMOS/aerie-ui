export type ParsedDoyString = {
  doy: number;
  hour: number;
  min: number;
  ms: number;
  sec: number;
  time: string;
  year: number;
};

export type ParsedDurationString = {
  days: number;
  hours: number;
  isNegative: boolean;
  microseconds: number;
  milliseconds: number;
  minutes: number;
  seconds: number;
  years: number;
};

export type ParsedYmdString = {
  day: number;
  hour: number;
  min: number;
  month: number;
  ms: number;
  sec: number;
  time: string;
  year: number;
};
