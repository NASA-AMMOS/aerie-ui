import { type FswCommandArgumentInteger, type FswCommandArgumentVarString } from '@nasa-jpl/aerie-ampcs';
import { describe, expect, test } from 'vitest';
import { parseCdlDictionary, toAmpcsXml } from './cdlDictionary';

const cdlString = `!
! Example dictionary
! for demo purposes the first line is required to be an empty comment
PROJECT : "Unit_test"
VERSION : "1.2.3.4"
FIELD DELIMITER :,
COMMAND DELIMITER :;
BRACKETS :()
MAXIMUM COMMANDS PER MESSAGE: 40
MAXIMUM BITS PER MESSAGE: 2304

SITES
  EXAMPLE_SITE = 0
END SITES

CLASSIFICATIONS : cmd-type
  CAT1
  CAT2
END CLASSIFICATIONS


SPACECRAFT LITERALS
   CONVERSION : HEX
   LENGTH : 10
   255 = 'FF'
END SPACECRAFT LITERALS

LOOKUP ARGUMENT : arg_0_lookup
   TITLE : "Used in commands"
   CONVERSION : HEX
   LENGTH : 32
   'CHOICE_A' = '0'
   'CHOICE_B' = '1'
   'CHOICE_C' = '2'
END LOOKUP ARGUMENT

NUMERIC ARGUMENT : arg_1_number
   TITLE : "Used in 1 commands"
   CONVERSION : SIGNED DECIMAL
   LENGTH : 16
   '-255' to '255'
END NUMERIC ARGUMENT

NUMERIC ARGUMENT : arg_2_string
   TITLE : "Used in 13 commands"
   CONVERSION : ASCII_STRING
   LENGTH : 312
END NUMERIC ARGUMENT

NUMERIC ARGUMENT : arg_3_string
   TITLE : "Used in 2 commands"
   CONVERSION : ASCII_STRING
   LENGTH : 1024
   DEFAULT : ''
END NUMERIC ARGUMENT

NUMERIC ARGUMENT : arg_4_number_units
   TITLE : "Used in 1 commands"
   CONVERSION : DECIMAL
   LENGTH : 32
   '1' to '500000000' : "Rows"
END NUMERIC ARGUMENT

NUMERIC ARGUMENT : arg_5_number_complex_units
   TITLE : "Used in 1 commands"
   CONVERSION : DECIMAL
   LENGTH : 16
   '0' to '3600' : "Pckts/Hr"
END NUMERIC ARGUMENT

STEM : CAT1_TEST_COMMAND1 ( ccode : 16, data : 0 )

cmd-type : CAT1

READ ARGUMENT arg_0_lookup

ccode := [ 16 ] '0001' HEX

!@ ATTACHMENT : desc
!@    "Test Command with lookup argument"
!@ END ATTACHMENT

END STEM

STEM : CAT1_TEST_COMMAND_WITH_3ARGS ( ccode : 16, data : 0 )

cmd-type : CAT1

READ ARGUMENT arg_0_lookup
READ ARGUMENT arg_1_number
READ ARGUMENT arg_2_string
READ ARGUMENT arg_3_string
READ ARGUMENT arg_4_number_units
READ ARGUMENT arg_5_number_complex_units

ccode := [ 16 ] '0002' HEX

!@ ATTACHMENT : desc
!@    "Test Command with 3 arguments"
!@ END ATTACHMENT

END STEM


STEM : CAT2_STEM_INLINE_ARG ( ccode : 16, data : 0 )

cmd-type : CAT2

LOOKUP ARGUMENT : arg_inline
   TITLE : "Used in 1 commands"
   CONVERSION : HEX
   LENGTH : 8
   'AAA' = '0'
   'BBB' = '1'
   'CCC' = '2'
   'DDD' = '3'
END LOOKUP ARGUMENT

READ ARGUMENT arg_inline

ccode := [ 16 ] '0002' HEX

!@ ATTACHMENT : desc
!@    "Test Command with inline argument"
!@ END ATTACHMENT

END STEM


`;

describe('cdl parse tests', async () => {
  test('inline definition', () => {
    const cdlDictionary = parseCdlDictionary(cdlString);
    expect(cdlDictionary.header.mission_name).toBe('Unit_test');
    expect(cdlDictionary.header.spacecraft_ids).toEqual([255]);

    expect(cdlDictionary.fswCommands.length).toBe(3);

    expect(cdlDictionary.fswCommands[1].arguments.length).toBe(6);
    const arg1Range = (cdlDictionary.fswCommands[1].arguments[1] as FswCommandArgumentInteger).range;
    expect(arg1Range?.min).toBe(-255);
    expect(arg1Range?.max).toBe(255);

    const arg_2_string: FswCommandArgumentVarString = cdlDictionary.fswCommands[1].argumentMap
      .arg_2_string as FswCommandArgumentVarString;
    expect(arg_2_string.arg_type).toBe('var_string');
    expect(arg_2_string.max_bit_length).toBe(312);

    expect(cdlDictionary.fswCommands[1].description).toEqual('Test Command with 3 arguments');

    console.log(JSON.stringify(cdlDictionary, null, 2));
  });

  test('round trip', () => {
    const cdlDictionary = parseCdlDictionary(cdlString);
    const xmlDictionary = toAmpcsXml(cdlDictionary);
    if (xmlDictionary) {
      // expect(JSON.stringify(parse(xmlDictionary), null, 2)).toBe(JSON.stringify(cdlDictionary, null, 2));
    }
  });

  // test('basic', () => {
  //   // const contents = readFileSync('/Users/joswig/Documents/Aerie/Juno/JNO_6.0.4_REV_M00_edited', 'utf-8');
  //   const contents = readFileSync('/Users/joswig/Documents/Aerie/MRO/MRO_6.1.REV_W26', 'utf-8');
  //   const cdlDictionary = parseCdlDictionary(contents);

  //   console.log(cdlDictionary.header.spacecraft_ids);

  //   const xmlDictionary = toAmpcsXml(cdlDictionary);
  //   writeFileSync('/Users/joswig/Downloads/MRO.xml', xmlDictionary);
  //   const parsedcdlDictionary = parse(xmlDictionary);

  //   console.log(JSON.stringify(parsedcdlDictionary.fswCommandMap.FILE_DELETE, null, 2));

  //   // cdlDictionary.fswCommands.forEach(cnd => console.log(`${cnd.description}`));

  //   // expect(JSON.stringify(cdlDictionary, null, 2)).toEqual(JSON.stringify(parsedcdlDictionary, null, 2));
  // });
});
