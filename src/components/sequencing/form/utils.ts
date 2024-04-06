
import type {
  FswCommandArgument,
  FswCommandArgumentEnum,
  FswCommandArgumentFixedString,
  FswCommandArgumentFloat,
  FswCommandArgumentInteger,
  FswCommandArgumentNumeric,
  FswCommandArgumentRepeat,
  FswCommandArgumentUnsigned,
  FswCommandArgumentVarString,
} from '@nasa-jpl/aerie-ampcs';
import type { SyntaxNode } from '@lezer/common';

export function isFswCommandArgumentEnum(arg: FswCommandArgument): arg is FswCommandArgumentEnum {
  return arg.arg_type === 'enum';
}

export function isFswCommandArgumentInteger(arg: FswCommandArgument): arg is FswCommandArgumentInteger {
  return arg.arg_type === 'integer';
}

export function isFswCommandArgumentFloat(arg: FswCommandArgument): arg is FswCommandArgumentFloat {
  return arg.arg_type === 'float';
}

export function isFswCommandArgumentNumeric(arg: FswCommandArgument): arg is FswCommandArgumentNumeric {
  return arg.arg_type === 'numeric';
}

export function isFswCommandArgumentUnsigned(arg: FswCommandArgument): arg is FswCommandArgumentUnsigned {
  return arg.arg_type === 'unsigned';
}

export function isFswCommandArgumentRepeat(arg: FswCommandArgument): arg is FswCommandArgumentRepeat {
  return arg.arg_type === 'repeat';
}

export function isFswCommandArgumentVarString(arg: FswCommandArgument): arg is FswCommandArgumentVarString {
  return arg.arg_type === 'var_string';
}

export function isFswCommandArgumentFixedString(arg: FswCommandArgument): arg is FswCommandArgumentFixedString {
  return arg.arg_type === 'fixed_string';
}

export function isNumberArg(arg: FswCommandArgument): arg is NumberArg {
  return (
    isFswCommandArgumentFloat(arg) ||
    isFswCommandArgumentInteger(arg) ||
    isFswCommandArgumentNumeric(arg) ||
    isFswCommandArgumentUnsigned(arg)
  );
}

export function isStringArg(arg: FswCommandArgument): arg is StringArg {
  return isFswCommandArgumentVarString(arg) || isFswCommandArgumentFixedString(arg);
}

export type StringArg = FswCommandArgumentVarString | FswCommandArgumentFixedString;

export type NumberArg =
  | FswCommandArgumentFloat
  | FswCommandArgumentInteger
  | FswCommandArgumentNumeric
  | FswCommandArgumentUnsigned;

export type ArgTextDef = {
  node?: SyntaxNode;
  text?: string;
  argDef?: FswCommandArgument;
  children?: ArgTextDef[];
  parentArgDef?: FswCommandArgumentRepeat;
};

export function getMissingArgDefs(argInfoArray: ArgTextDef[]) {
  return argInfoArray
    .filter((argInfo): argInfo is { argDef: FswCommandArgument } => !argInfo.node && !!argInfo.argDef)
    .map(argInfo => argInfo.argDef);
}

export function isQuoted(s: string) {
  return s.startsWith('"') && s.endsWith('"');
}

export function unquoteUnescape(s: string) {
  if (isQuoted(s)) {
    return s.slice(1, -1).replaceAll('\\"', '"');
  }
  return s;
}

export function quoteEscape(s: string) {
  return `"${s.replaceAll('"', '\\"')}"`;
}
