import { SPACECRAFT_ID } from './MissionConstants';
import { round as LSMTRound } from './date/LMSTFormat';
import { round as SCETRound } from './date/SCETFormat';

const spacecraftIdForLMST = -1000 * SPACECRAFT_ID - 900; // -168900 id of imaginary spacecraft whose SCLK keeps LMST
const spacecraftId = -1 * SPACECRAFT_ID;
const SPICE_LMST_RE = /^\d\/(\d+):(\d{2}):(\d{2}):(\d{2}):(\d+)?$/;
const MSLICE_LMST_RE = /^(Sol-)?(\d+)M(\d{2}):(\d{2}):(\d{2})(.(\d*))?$/;

let MIN_SCLK = 666913419.014; // spice dies if you go below this range
let MAX_T32 = 1200755715; // Year 2038 problem
let spiceySetup = false;

const UTC_SCET = 'UTC/SCET';
const SCLK_SCLKD = 'SCLK/SCLKD';
const LST_LMST = 'LST/LMST';
const ET_SECONDS = 'ET/SECONDS';

interface SpiceLib {
  scs2e: (id: number, s: string) => number;
  sce2s: (id: number, et: number) => string;
  str2et: (s: string) => number;
  et2utc: (et: number, isod: string, n: number) => string;
  set_error_report_then_reset: () => void;
  is_ready: boolean;
}

declare let spicey: SpiceLib; // spicey puts itself in global namespace

function setupSpicey() {
  if (typeof window !== 'undefined') {
    // prevents spice from becoming fubar after a bad input
    spicey.set_error_report_then_reset();
  }

  MIN_SCLK = spicey.scs2e(spacecraftIdForLMST, '00000:00:00:00:00');

  // 03:14:07 UTC on 19 January 2038
  MAX_T32 = fromUTC('2038-019T03:14:06'); // fromUTC('2038-019T03:14:07') should be valid, but slincii doesn't like it

  spiceySetup = true;
}

// Check for config complete
function isSpiceySetup() {
  return spiceySetup;
}

function isSpiceyReady() {
  if (typeof spicey === 'undefined') {
    return false;
  }
  return spicey.is_ready;
}

function configSpicey() {
  if (isSpiceyReady()) {
    setupSpicey();
  } else {
    if (typeof window !== 'undefined') {
      window.addEventListener('spiceyready', () => {
        setupSpicey();
      });
    }
  }
}

function getMinSclk() {
  return MIN_SCLK;
}

function getMaxT32() {
  return MAX_T32;
}

configSpicey();

// "1/00000:00:00:00:95962"

// 666913420 min allowed m2020 sclk before spice dies
function fromSCLK(doubleSclk: number): number {
  const floor = Math.floor(doubleSclk);
  const fraction = doubleSclk - floor;
  const foo = Math.floor(fraction * Math.pow(2, 16));
  const stringSclk = floor + '-' + foo;
  return spicey.scs2e(spacecraftId, stringSclk);
}

function toSCLK(et: number): number {
  const sclkStr = spicey.sce2s(spacecraftId, et);
  // sclkStr = "1/0436236010-12059"
  const split: string[] = sclkStr.substring(2).split('-');
  return parseInt(split[0], 10) + parseInt(split[1], 10) / Math.pow(2, 16);
}

function fromUTC(utc: string): number {
  return spicey.str2et(utc);
}

function toUTC(et: number): string {
  return spicey.et2utc(et, 'ISOD', 100);
}

function fromLMST(lmst: string): number {
  const matcher = lmst.match(MSLICE_LMST_RE);
  if (!matcher) {
    return NaN;
  }

  const sol = trimLeadingZeroes(matcher[2] || '');
  const hour = matcher[3] || '';
  const mins = matcher[4] || '';
  const secs = matcher[5] || '';
  const subsecs = parseFloat(matcher[6] || '0')
    .toFixed(5)
    .substring(2);
  const sclkch = `${sol}:${hour}:${mins}:${secs}:${subsecs}`;
  // const sclkch = sol + ':' + hour + ':' + mins + ':' + secs + ':' + subsecs;
  return spicey.scs2e(spacecraftIdForLMST, sclkch);
}

function toLMST(et: number): string {
  const lmst: string = spicey.sce2s(spacecraftIdForLMST, et);
  // something like "1/01641:07:16:13:65583"
  const m = lmst.match(SPICE_LMST_RE);
  if (m) {
    const sol = trimLeadingZeroes(m[1]);
    const hour = m[2];
    const mins = m[3];
    const secs = m[4];
    const subsecs = m[5] || '0';
    return sol + 'M' + hour + ':' + mins + ':' + secs + '.' + subsecs;
  }
  return '';
}

function trimLeadingZeroes(s: string): string {
  return parseInt(s, 10).toString(10);
}

function convert(inputTime: string, sourceFormat: string, targetFormat: string, round: boolean): string {
  if (!spicey) {
    return 'SPICE_LOADING'; // spicey still loading
  }

  let et: number;

  if (SCLK_SCLKD === sourceFormat) {
    et = fromSCLK(parseFloat(inputTime));
  } else if (UTC_SCET === sourceFormat) {
    et = fromUTC(inputTime);
  } else if (LST_LMST === sourceFormat) {
    et = fromLMST(inputTime);
  } else if (ET_SECONDS === sourceFormat) {
    et = parseFloat(inputTime);
  } else {
    return '';
  }

  if (SCLK_SCLKD === targetFormat) {
    return format(toSCLK(et), round);
  }

  let converted;
  if (UTC_SCET === targetFormat) {
    converted = toUTC(et);
  } else if (LST_LMST === targetFormat) {
    converted = toLMST(et);
  } else if (ET_SECONDS === targetFormat) {
    converted = format(et, round);
  } else {
    converted = '';
  }
  return round ? roundTime(converted, targetFormat) : converted;
}

function roundTime(t: string, targetFormat: string) {
  if (UTC_SCET === targetFormat) {
    return SCETRound(t);
  } else if (LST_LMST === targetFormat) {
    return LSMTRound(t);
  }

  return t;
}

function format(d: number, round: boolean): string {
  return round ? d.toFixed() : d.toString(10);
}

export { ET_SECONDS, LST_LMST, SCLK_SCLKD, UTC_SCET, convert, getMaxT32, getMinSclk, isSpiceySetup };
