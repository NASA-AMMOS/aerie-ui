import { parse, type FswCommandArgumentInteger } from '@nasa-jpl/aerie-ampcs';
import { readFileSync } from 'fs';
import { describe, expect, test } from 'vitest';
import { parseCdlDictionary, toAmpcsXml } from './cdlDictionary';

const contents = readFileSync('/Users/joswig/Documents/Aerie/Juno/JNO_6.0.4_REV_M00', 'utf-8');

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

STEM : CAT1_TEST_COMMAND1 ( ccode : 16, data : 0 )

cmd-type : CAT1

READ ARGUMENT arg_0_lookup

ccode := [ 16 ] '0001' HEX

!@ ATTACHMENT : desc
!@    "Test Command with lookup argument"
!@ END ATTACHMENT

END STEM

STEM : CAT1_TEST_COMMAND_WITH_2ARGS ( ccode : 16, data : 0 )

cmd-type : CAT1

READ ARGUMENT arg_0_lookup
READ ARGUMENT arg_1_number

ccode := [ 16 ] '0002' HEX

!@ ATTACHMENT : desc
!@    "Test Command with 2 arguments"
!@ END ATTACHMENT

END STEM


`;

describe('cdl parse tests', async () => {
  test('inline definition', () => {
    const cdlDictionary = parseCdlDictionary(cdlString);
    expect(cdlDictionary.header.mission_name).toEqual('Unit_test');
    expect(cdlDictionary.header.spacecraft_ids).toEqual([255]);

    expect(cdlDictionary.fswCommands.length).toEqual(2);
    expect((cdlDictionary.fswCommands[1].arguments[1] as FswCommandArgumentInteger).range?.min).toEqual(-255);
    expect((cdlDictionary.fswCommands[1].arguments[1] as FswCommandArgumentInteger).range?.max).toEqual(255);
  });

  test('to ampcs', () => {
    const cdlDictionary = parseCdlDictionary(cdlString);
    const xmlDictionary = toAmpcsXml(cdlDictionary);
    console.log(xmlDictionary);
  });

  test('basic', () => {
    // parseCdlDictionary(contents);
    const cdlDictionary = parseCdlDictionary(contents);
    const xmlDictionary = toAmpcsXml(cdlDictionary);
    parse(xmlDictionary);
    // writeFileSync(`/Users/joswig/Downloads/Juno.xml`, xmlDictionary);
  });
});
