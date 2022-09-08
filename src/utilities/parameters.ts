import { omitBy } from 'lodash-es';
import { isEmpty } from './generic';

export function getArgument(
  value: Argument,
  schema: ValueSchema,
  defaultValue?: Argument,
): { value: any; valueSource: ValueSource } {
  const type = schema.type;

  if (value !== null && value !== undefined) {
    return { value, valueSource: 'user' };
  } else if (defaultValue !== undefined) {
    return { value: defaultValue, valueSource: 'mission' };
  } else if (type === 'series') {
    return { value: [], valueSource: 'none' };
  } else if (type === 'struct') {
    const struct = Object.entries(schema.items).reduce((struct, [key, subSchema]) => {
      const { value } = getArgument(null, subSchema);
      return { ...struct, [key]: value };
    }, {});
    return { value: struct, valueSource: 'none' };
  } else {
    return { value: null, valueSource: 'none' };
  }
}

export function getArguments(argumentsMap: ArgumentsMap, formParameter: FormParameter): ArgumentsMap {
  const { name, value } = formParameter;
  const newArgument = { [name]: value };
  return omitBy({ ...argumentsMap, ...newArgument }, isEmpty);
}

export function getFormParameters(
  parametersMap: ParametersMap,
  argumentsMap: ArgumentsMap,
  requiredParameters: RequiredParametersList,
  defaultArgumentsMap: ArgumentsMap = {},
): FormParameter[] {
  const formParameters = Object.entries(parametersMap).map(([name, { order, schema }]) => {
    const arg: Argument = argumentsMap[name];
    const defaultArg: Argument | undefined = defaultArgumentsMap[name];
    const { value, valueSource } = getArgument(arg, schema, defaultArg);
    const required = requiredParameters.indexOf(name) > -1;

    // DOT:
    // Value comes from user if arg is not null or undefined (orange dot)
    // Otherwise, value comes from mission if default arg is not undefined (green dot)
    // Otherwise, there is no value and we don't need to show a dot (no dot)
    // Change output of getArgument to be {value, source}

    const formParameter: FormParameter = {
      error: null,
      name,
      order,
      required,
      schema,
      value,
      valueSource,
    };

    return formParameter;
  });

  return formParameters;
}
