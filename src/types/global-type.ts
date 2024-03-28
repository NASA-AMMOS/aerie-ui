export enum GlobalTypes {
  int = 'int',
  flt = 'flt',
  str = 'str',
  uint = 'uint',
}

export type GlobalType = {
  name: string;
  type: GlobalTypes;
};
