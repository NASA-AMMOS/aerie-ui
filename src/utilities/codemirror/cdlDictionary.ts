import type {
  CommandDictionary,
  Enum,
  EnumValue,
  FswCommand,
  FswCommandArgument,
  FswCommandArgumentEnum,
  FswCommandArgumentMap,
  Header,
  NumericRange,
} from '@nasa-jpl/aerie-ampcs';

const START_LOOKUP_ARG = /^\s*LOOKUP ARGUMENT\s*:\s*(\w+)\s*$/;
const END_LOOKUP_ARG = /^\s*END\s+LOOKUP\s+ARGUMENT\s*$/;
const START_NUMERIC_ARG = /^\s*NUMERIC ARGUMENT\s*:\s*(\w+)\s*$/;
const END_NUMERIC_ARG = /^\s*END\s+NUMERIC\s+ARGUMENT\s*$/;
const START_STEM = /^\s*STEM\s*:\s*(\w+)\s*\(.*\)\s*$/;
const END_STEM = /^\s*END\s*STEM\s*$/;
const CONVERSION = /^\s*CONVERSION\s*:\s*(\w+(?:\s+\w+)?)/;

export function parseCdlDictionary(contents: string, id?: string, path?: string): CommandDictionary {
  const lines = contents.split('\n').filter(line => line.trim());

  let mission_name = '';
  let version = '';
  const spacecraft_ids: number[] = [];

  const lineIterator = lines.values();

  for (const line of lineIterator) {
    const projectMatch = line.match(/^PROJECT\s*:\s*"([^"]*)"/);
    if (projectMatch) {
      mission_name = projectMatch[1];
      break;
    }
  }

  for (const line of lineIterator) {
    const versionMatch = line.match(/^VERSION\s*:\s*"([^"]+)"/);
    if (versionMatch) {
      version = versionMatch[1];
      break;
    }
  }

  SC_LITERALS_LOOP: for (const line of lineIterator) {
    if (line === 'SPACECRAFT LITERALS') {
      for (const childLine of lineIterator) {
        if (childLine === 'END SPACECRAFT LITERALS') {
          break SC_LITERALS_LOOP;
        }
        const spacecraftIdMatch = childLine.match(/^\s*(\d+)\s*=\s*'[\dA-Fa-f]+'/);
        if (spacecraftIdMatch) {
          spacecraft_ids.push(parseInt(spacecraftIdMatch[1]));
        }
      }
    }
  }

  const header: Readonly<Header> = {
    mission_name,
    schema_version: '1.0',
    spacecraft_ids,
    version,
  };

  const enums: Enum[] = [];
  const enumMap: { [name: string]: Enum } = {};
  const globalArguments: FswCommandArgumentMap = {};
  const fswCommands: FswCommand[] = [];

  // parse globals and stems
  // assumes all global arguments are defined prior to stems
  for (const line of lineIterator) {
    if (line.match(START_LOOKUP_ARG)) {
      const lookupLines: string[] = [line];
      for (const lineOfLookup of lineIterator) {
        lookupLines.push(lineOfLookup);
        if (lineOfLookup.match(END_LOOKUP_ARG)) {
          const [lookupArg, lookupEnum] = parseLookupArgument(lookupLines);
          // empty enums aren't allowed in ampcs dictionary format
          if (lookupEnum.values.length) {
            enums.push(lookupEnum);
            enumMap[lookupEnum.name] = lookupEnum;
            globalArguments[lookupArg.name] = lookupArg;
          }
          break;
        }
      }
    } else if (line.match(START_NUMERIC_ARG)) {
      const numericLines: string[] = [line];
      for (const lineOfNumeric of lineIterator) {
        numericLines.push(lineOfNumeric);
        if (lineOfNumeric.match(END_NUMERIC_ARG)) {
          const numericArgument = parseNumericArgument(numericLines);
          globalArguments[numericArgument.name] = numericArgument;
          break;
        }
      }
    } else if (line.match(START_STEM)) {
      const numericLines: string[] = [line];
      for (const stemLine of lineIterator) {
        numericLines.push(stemLine);
        if (stemLine.match(END_STEM)) {
          fswCommands.push(parseStem(numericLines, globalArguments));
          break;
        }
      }
    }
  }

  return {
    enumMap,
    enums,
    fswCommandMap: Object.fromEntries(fswCommands.map(cmd => [cmd.stem, cmd])),
    fswCommands,
    header,
    hwCommandMap: {},
    hwCommands: [],
    id: id ?? '',
    path: path ?? '',
  };
}

export function parseStem(lines: string[], globalArguments: FswCommandArgumentMap): FswCommand {
  let stem = '';
  for (const line of lines) {
    const m = line.match(START_STEM);
    if (m) {
      stem = m[1];
      break;
    }
  }

  let description = '';
  const descriptionLineNumber = lines.findIndex(line => /!@\s+ATTACHMENT\s*:\s*desc/.test(line)) + 1;
  const descriptionLineMatch = lines.at(descriptionLineNumber)?.match(/^!@\s*"(.*)"\s*$/);
  if (descriptionLineMatch) {
    description = descriptionLineMatch[1];
  }

  const fswArguments: FswCommandArgument[] = [];

  for (const line of lines) {
    const readArgMatch = line.match(/^\s*READ\s+ARGUMENT\s+(\w+)\s*/);
    if (readArgMatch) {
      const globalArg = globalArguments[readArgMatch[1]];
      if (globalArg) {
        fswArguments.push(globalArg);
      }
    }
  }

  return {
    argumentMap: Object.fromEntries(fswArguments.map(arg => [arg.name, arg])),
    arguments: fswArguments,
    description,
    stem,
    type: 'fsw_command',
  };
}

export function parseNumericArgument(lines: string[]): FswCommandArgument {
  const lineIterator = lines.values();

  let name = '';
  for (const line of lineIterator) {
    const m = line.match(START_NUMERIC_ARG);
    if (m) {
      name = m[1];
      break;
    }
  }

  let conversion = '';
  let range: NumericRange | null = null;

  for (const line of lines) {
    if (line.match(END_NUMERIC_ARG)) {
      break;
    } else if (conversion) {
      const rangeMatch = line.match(/^\s*'([-\w]+)'\s*to\s*'([-\w]+)/);
      if (rangeMatch) {
        if (conversion.includes('DECIMAL')) {
          range = {
            max: parseInt(rangeMatch[2], 10),
            min: parseInt(rangeMatch[1], 10),
          };
          // console.log(`Range ${range}`);
        } else if (conversion === 'HEX') {
          range = {
            max: parseInt(rangeMatch[2], 16),
            min: parseInt(rangeMatch[1], 16),
          };
        } else if (conversion === 'IEEE64FLOAT') {
          range = {
            max: Number.MAX_VALUE,
            min: Number.MIN_VALUE,
          };
        }
      }
    } else {
      const conversionMatch = line.match(CONVERSION);
      if (conversionMatch) {
        conversion = conversionMatch[1].trim();
      }
    }
  }

  if (conversion === 'ASCII_STRING') {
    return {
      arg_type: 'var_string',
      default_value: null,
      description: '',
      max_bit_length: null,
      name,
      prefix_bit_length: null,
      valid_regex: null,
    };
  } else if (conversion.includes('DECIMAL') || conversion === 'HEX' || conversion === 'MPFTIME') {
    return {
      arg_type: 'integer',
      bit_length: null,
      default_value: null,
      description: '',
      name,
      range,
      units: '',
    };
  }

  return {
    arg_type: 'float',
    bit_length: null,
    default_value: null,
    description: '',
    name,
    range,
    units: '',
  };
}

export function parseLookupArgument(lines: string[]): [FswCommandArgumentEnum, Enum] {
  const lineIterator = lines.values();

  let name = '';
  for (const line of lineIterator) {
    const lookupStartMatch = line.match(START_LOOKUP_ARG);
    if (lookupStartMatch) {
      name = lookupStartMatch[1];
    }
  }

  let conversion = '';
  const values: EnumValue[] = [];

  for (const line of lines) {
    if (line.match(END_LOOKUP_ARG)) {
      break;
    } else if (conversion) {
      const lookupMatch = line.match(/^\s*'(\w+)'\s*=\s*'(\w+)'/);
      if (lookupMatch) {
        const symbol = lookupMatch[1];
        const valueStr = lookupMatch[2];
        let numeric: number | null = null;
        if (conversion === 'DECIMAL') {
          numeric = parseInt(valueStr, 10);
        } else if (conversion === 'HEX') {
          numeric = parseInt(valueStr, 16);
        }
        values.push({
          numeric,
          symbol,
        });
      }
    } else {
      const conversionMatch = line.match(CONVERSION);
      if (conversionMatch) {
        conversion = conversionMatch[1];
      }
    }
  }

  const enum_name = name;
  return [
    {
      arg_type: 'enum',
      bit_length: null,
      default_value: null,
      description: '',
      enum_name,
      name,
      range: values.map(value => value.symbol),
    },
    {
      name: enum_name,
      values,
    },
  ];
}

function escapeHtml(unsafe: string) {
  return unsafe
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function toAmpcsXml(cdl: CommandDictionary): string {
  const spacecraftIds = cdl.header.spacecraft_ids.map(sc => `<spacecraft_id value="${sc.toString(10)}" />`);
  const enumDefs = cdl.enums.map(enumDef => {
    if (!enumDef.values.length) {
      console.log(`no values: ${enumDef.name}`);
      return '';
    }
    const enumVals = enumDef.values.map(v => `<enum symbol="${v.symbol}" numeric="${v.numeric}"/>`);
    return `<enum_table name="${enumDef.name}">
      <values>
        ${enumVals.join('\n')}
      </values>
    </enum_table>`;
  });

  const commandDefs = cdl.fswCommands.map(cmdDef => {
    const argumentDefs: string[] = cmdDef.arguments.map(argDef => {
      switch (argDef.arg_type) {
        case 'float':
        case 'unsigned':
        case 'numeric':
        case 'integer': {
          const xmlTag = {
            float: 'float_arg',
            integer: 'integer_arg',
            numeric: 'integer_arg',
            unsigned: 'unsigned_arg',
          }[argDef.arg_type];

          let rangeText = '';
          if (argDef.range) {
            rangeText = `<range_of_values>
  <include min="${argDef.range.min}" max="${argDef.range.max}" />
</range_of_values>`;
          }

          return `<${xmlTag} name="${argDef.name}" bit_length="${argDef.bit_length ?? 32}" units="bytes">
            ${rangeText}
          <description>${argDef.description || 'placeholder description'}</description>
        </${xmlTag}>`;
        }
        case 'enum': {
          return `<enum_arg name="${argDef.name}" bit_length="${argDef.bit_length ?? 8}" enum_name="${argDef.enum_name}">
            <description>${argDef.description || 'placeholder description'}</description>
          </enum_arg>`;
        }
      }
      return ``;
    });
    const argumentsBlock = argumentDefs.filter(argDef => argDef.trim().length).length
      ? `<arguments>
        ${argumentDefs.join('\n')}
      </arguments>`
      : '';
    return `<fsw_command opcode="0x0000" stem="${cmdDef.stem}" class="TEST">
      ${argumentsBlock}
      <categories>
        <module>cmd_svc</module>
        <ops_category>CMD</ops_category>
      </categories>
      <description>${escapeHtml(cmdDef.description) || ' '}</description>
      <completion>TBD</completion>
      <fsw_specification custom_validation_required="No" command_priority="Nominal"/>
      <restricted_modes>
        <prime_string_restriction prime_string_only="No"/>
      </restricted_modes>
    </fsw_command>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<command_dictionary>
  <header mission_name="${cdl.header.mission_name}" version="${cdl.header.version}" schema_version="${cdl.header.schema_version}">
    <spacecraft_ids>
      ${spacecraftIds.join('\n')}
    </spacecraft_ids>
  </header>
  <uplink_file_types>
    <file_type name="generic" id="0" extension="dat" file_format_spec="None"/>
    <file_type name="load_and_go" id="2" extension="lgo" file_format_spec="File Format SIS: Sequence Files D-102376"/>
    <file_type name="sequence" id="1" extension="seq" file_format_spec="File Format SIS: Sequence Files D-102376"/>
  </uplink_file_types>
  <enum_definitions>
    ${enumDefs.join('\n')}
  </enum_definitions>
  <command_definitions>
    ${commandDefs.join('\n')}
  </command_definitions>
</command_dictionary>
`;
}
