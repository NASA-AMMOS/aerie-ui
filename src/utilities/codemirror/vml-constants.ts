// The value here must match the rule and token names in vml.grammar

export const RULE_TEXT_FILE = 'Text_file';

export const RULE_FUNCTIONS = 'Functions';
export const RULE_FUNCTION = 'Function';

export const RULE_COMMON_FUNCTION = 'Common_Function';

export const RULE_BLOCK = 'Block';

export const RULE_IF = 'If';
export const RULE_ELSE_IF = 'Else_if';
export const RULE_ELSE = 'Else';
export const RULE_END_IF = 'End_if';

export const RULE_WHILE = 'While';
export const RULE_END_WHILE = 'End_while';

export const RULE_FOR = 'For_statement';
export const RULE_END_FOR = 'End_for';

export const RULE_ASSIGNMENT = 'Assignment';
export const RULE_STATEMENT = 'Statement';
export const RULE_TIME_TAGGED_STATEMENT = 'Time_tagged_statement';
export const RULE_VM_MANAGEMENT = 'Vm_management';
export const RULE_SPAWN = 'Spawn';
export const RULE_HALT = 'Halt';
export const RULE_PAUSE = 'Pause';
export const RULE_RESUME = 'Resume';
export const RULE_ISSUE = 'Issue';
export const RULE_FUNCTION_NAME = 'Function_name';
export const RULE_SIMPLE_EXPR = 'Simple_expr';
export const RULE_CALL_PARAMETER = 'Call_parameter';
export const RULE_CALL_PARAMETERS = 'Call_parameters';
export const RULE_FLOW = 'Flow';
export const RULE_SIMPLE_CALL = 'Simple_call';
export const RULE_EXTERNAL_CALL = 'External_call';
export const RULE_CONSTANT = 'Constant';

// Terminals in grammar
export const TOKEN_ERROR = '⚠';
export const TOKEN_STRING_CONST = 'STRING_CONST';
export const TOKEN_DOUBLE_CONST = 'DOUBLE_CONST';
export const TOKEN_INT_CONST = 'INT_CONST';
export const TOKEN_UINT_CONST = 'UINT_CONST';
export const TOKEN_HEX_CONST = 'HEX_CONST';
export const TOKEN_TIME_CONST = 'TIME_CONST';

export const TOKEN_EXTERNAL_CALL = 'EXTERNAL_CALL';
export const TOKEN_CALL = 'CALL';
export const TOKEN_ISSUE = 'ISSUE';
export const TOKEN_SPAWN = 'SPAWN';

export const TOKEN_IF = 'IF';
export const TOKEN_ELSE_IF = 'ELSE_IF';
export const TOKEN_ELSE = 'ELSE';
export const TOKEN_END_IF = 'END_IF';
export const TOKEN_THEN = 'THEN';

export const TOKEN_WHILE = 'WHILE';
export const TOKEN_END_WHILE = 'END_WHILE';

export const TOKEN_FOR = 'FOR';
export const TOKEN_TO = 'TO';
export const TOKEN_STEP = 'STEP';
export const TOKEN_DO = 'DO';
export const TOKEN_END_FOR = 'END_FOR';
