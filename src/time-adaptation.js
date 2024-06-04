import { bisector, range } from 'd3-array';
import { Spice } from 'timecraftjs';

const LMST_SC_ID = -168900;
const SPICE_LMST_RE = /^\d\/(\d+):(\d{2}):(\d{2}):(\d{2}):(\d+)?$/;
const DISPLAY_LMST_RE = /^(Sol-)?(\d+)M(\d{2}):(\d{2}):(\d{2})(.(\d*))?$/;

let spiceInstance = undefined;

// Mars seconds since Sol-0
function msss0(lmst) {
  const sols = +lmst.split('M')[0];
  const hours = +lmst.split('M')[1].split(':')[0];
  const minutes = +lmst.split('M')[1].split(':')[1];
  const seconds = +lmst.split('M')[1].split(':')[2];
  // seconds = seconds.split('.')[0]
  const sss0 = sols * 86400 + hours * 3600 + minutes * 60 + seconds;
  return sss0;
}

function msss0_to_lmst(msss0) {
  let sols = String(Math.floor(msss0 / 86400));
  let secondsLeft = msss0 % 86400;
  let hours = String(Math.floor(secondsLeft / 3600));
  secondsLeft = secondsLeft % 3600;
  let minutes = String(Math.floor(secondsLeft / 60));
  secondsLeft = secondsLeft % 60;
  let seconds = String(secondsLeft.toFixed(2));
  while (sols.length < 5) {
    sols = '0' + sols;
  }
  while (hours.length < 2) {
    hours = '0' + hours;
  }
  while (minutes.length < 2) {
    minutes = '0' + minutes;
  }
  while (seconds.length < 5) {
    seconds = '0' + seconds;
  }
  const lmst = sols + 'M' + hours + ':' + minutes + ':' + seconds;
  return lmst;
}

function trimLeadingZeroes(s) {
  return parseInt(s, 10).toString(10);
}

function lmstToEphemeris(lmst) {
  const matcher = lmst.match(DISPLAY_LMST_RE);
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
  return spiceInstance.scs2e(LMST_SC_ID, sclkch);
}

function ephemerisToLMST(et) {
  const lmst = spiceInstance.sce2s(LMST_SC_ID, et);
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

function ephemerisToUTC(et) {
  return spiceInstance.et2utc(et, 'ISOC', 100);
}

function lmstToUTC(lmst) {
  if (spiceInstance) {
    try {
      const et = lmstToEphemeris(lmst);
      const utc = ephemerisToUTC(et);
      return utc;
    } catch (error) {
      console.log('error :>> ', error);
    }
  }
  return '';
}

function utcToLmst(utc) {
  if (spiceInstance) {
    try {
      const et = spiceInstance.str2et(utc);
      return ephemerisToLMST(et);
    } catch (error) {
      console.error(error);
      return '';
    }
  }
  return 'no spice';
}

export function lmstTicks(start, stop, tickCount) {
  const lmstStart = utcToLmst(start.toISOString().slice(0, -1));
  const lmstEnd = utcToLmst(stop.toISOString().slice(0, -1));
  console.log('lmstStart :>> ', lmstStart);
  console.log('lmstEnd :>> ', lmstEnd);
  const lsmtStartSeconds = msss0(lmstStart);
  const lsmtStartSols = lsmtStartSeconds / 60 / 60 / 24;
  const lsmtEndSeconds = msss0(lmstEnd);
  const lsmtEndSols = lsmtEndSeconds / 60 / 60 / 24;
  // TODO handle duration = 0 case
  const lmstDurationSeconds = lsmtEndSeconds - lsmtStartSeconds;
  console.log('lsmtStartSols :>> ', lsmtStartSols);
  console.log('lsmtEndSols :>> ', lsmtEndSols);
  console.log('lsmtStartSeconds :>> ', lsmtStartSeconds);
  console.log('lsmtEndSeconds :>> ', lsmtEndSeconds);
  console.log('lmstDurationSeconds :>> ', lmstDurationSeconds);

  // const minVal = start.getTime(); // utc ms
  // const maxVal = stop.getTime(); // utc ms
  // console.log('minVal :>> ', minVal);
  // console.log('maxVal :>> ', maxVal);
  let stepSize;

  // const labelWidth = 105;
  // const allowedTicks = Math.floor((range[1] - range[0]) / labelWidth) + 1;
  const stepSizeSols = lmstDurationSeconds / 60 / 60 / 24 / tickCount;

  // const earthMarsDayRatio = 1.0274912517;
  // const dayInSeconds = 86400.0;
  // const x1 = start.getTime(); // utc ms
  // const x2 = stop.getTime(); // utc ms
  // const durationUtcMs = x2 - x1;
  // // const durationSols = ((durationUtcMs / 1000) * solSecond) / 60 / 60 / 24;
  // const durationSols = (durationUtcMs / 1000 / 60 / 60 / 24) * earthMarsDayRatio;
  // const solStepSize = durationSols / allowedTicks;
  console.log('tickCount :>> ', tickCount);
  // console.log('solStepSize :>> ', solStepSize);
  // console.log('durationUtcMs :>> ', durationUtcMs);
  // console.log('durationSols :>> ', durationSols);

  const dayInSeconds = 86400;

  const lmstSteps = [
    0.1 / dayInSeconds,
    0.5 / dayInSeconds,
    1 / dayInSeconds,
    2 / dayInSeconds,
    5 / dayInSeconds,
    10 / dayInSeconds,
    15 / dayInSeconds,
    20 / dayInSeconds,
    30 / dayInSeconds,
    (1 * 60) / dayInSeconds,
    (2 * 60) / dayInSeconds,
    (5 * 60) / dayInSeconds,
    (10 * 60) / dayInSeconds,
    (15 * 60) / dayInSeconds,
    (20 * 60) / dayInSeconds,
    (30 * 60) / dayInSeconds,
    (1 * 60 * 60) / dayInSeconds,
    (2 * 60 * 60) / dayInSeconds,
    (3 * 60 * 60) / dayInSeconds,
    (4 * 60 * 60) / dayInSeconds,
    (6 * 60 * 60) / dayInSeconds,
    (8 * 60 * 60) / dayInSeconds,
    (12 * 60 * 60) / dayInSeconds,
    1,
    2,
    5,
    10,
    25,
    50,
    100,
    250,
    500,
    1000,
    2500,
    5000,
    1000,
  ];

  const bisectTicks = bisector(d => d).left;
  const i = bisectTicks(lmstSteps, stepSizeSols, 0);
  stepSize = lmstSteps[i];
  console.log('stepSize :>> ', stepSize);

  // round the domain to nearest step size values
  const minValRounded = Math.round(lsmtStartSols / stepSize) * stepSize;
  const maxValRounded = Math.round(lsmtEndSols / stepSize) * stepSize;
  console.log('minValRounded :>> ', minValRounded);
  console.log('maxValRounded :>> ', maxValRounded);

  const ticks = range(minValRounded, maxValRounded, stepSize)
    .map(x => {
      const utcString = lmstToUTC(msss0_to_lmst(x * 24 * 60 * 60));
      return new Date(utcString + 'Z');
    })
    .filter(date => date.getTime() >= start && date.getTime() <= stop);

  return ticks;
}

async function initializeSpice() {
  try {
    const initializingSpice = await new Spice().init();

    // Load the kernels
    const kernelBuffers = await Promise.all(
      [
        'http://localhost:3000/kernels/m2020_lmst_ops210303_v1.tsc',
        'http://localhost:3000/kernels/m2020.tls',
        'http://localhost:3000/kernels/m2020.tsc',
      ].map(url => fetch(url).then(res => res.arrayBuffer())),
    );

    // Load the kernels into Spice
    for (let i = 0; i < kernelBuffers.length; i++) {
      initializingSpice.loadKernel(kernelBuffers[i]);
    }
    spiceInstance = initializingSpice;
    console.log('Spice initialized');
    return true;
  } catch (error) {
    console.log('Error initializing spice:', error);
    return false;
  }

  // const utc = new Date().toISOString().slice(0, -1);
  // console.log(`utc: ${utc}`);
  // console.log(`et: ${initializingSpice.utc2et(utc)}`);
  // console.log(`MIN_SCLK: ${initializingSpice.scs2e(LMST_SC_ID, '00000:00:00:00:00')}`);
  // console.log(`lmst: ${utcToLmst(utc)}`);
}

export async function getAdaptation() {
  const success = await initializeSpice();
  if (success) {
    return {
      time: {
        primary: {
          format: date => {
            const dateWithoutTZ = date.toISOString().slice(0, -1);
            return utcToLmst(dateWithoutTZ).slice(0, -6);
          },
          label: 'LMST',
          parse: string => lmstToUTC(string),
        },
        secondary: {
          format: date => date.toISOString().slice(0, -5),
          label: 'UTC',
          parse: string => new Date(string),
        },
        ticks: {
          getTicks: (start, stop, count) => lmstTicks(start, stop, count),
          tickLabelWidth: 110,
        },
      },
    };
  } else {
    return {};
  }
}
