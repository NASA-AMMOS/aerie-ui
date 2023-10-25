import type { UnitsMap } from './activity';
import type { ValueSchema } from './schema';

export type EffectiveArguments = {
  arguments: ArgumentsMap;
  errors: ParametersErrorMap;
  success: boolean;
};

export type FormParameter<T = ValueSchema> = {
  errors: string[] | null;
  file?: File;
  index?: number;
  key?: string;
  name: string;
  order: number;
  required?: boolean;
  schema: T;
  units?: string | UnitsMap;
  value: Argument;
  valueSource: ValueSource;
};

export type SimpleFormParameter<T = ValueSchema> = FormParameter<T> & {
  units?: string;
};

export type RecFormParameter<T = ValueSchema> = FormParameter<T> & {
  units?: UnitsMap;
};

export type Argument = any;

export type ArgumentsMap = Record<ParameterName, Argument>;

export type Parameter = { order: number; schema: ValueSchema };

export type ParameterError = { message: string; schema: ValueSchema };

export type ParametersErrorMap = Record<ParameterName, ParameterError>;

export type ParameterName = string;

export type RequiredParametersList = ParameterName[];

export type ParametersMap = Record<ParameterName, Parameter>;

export type ParameterValidationError = {
  message: string;
  subjects: string[];
};

export type ParameterValidationResponse = {
  errors?: ParameterValidationError[];
  success: boolean;
};

export type ParameterType = 'activity' | 'simulation';
export type ValueSource = 'user on model' | 'user on preset' | 'preset' | 'mission' | 'none';
