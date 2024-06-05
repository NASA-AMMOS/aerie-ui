import { CustomErrorCodes, type ErrorCode } from '../../workers/customCodes';

export enum TimeTypes {
  ABSOLUTE = 'absolute',
  EPOCH = 'epoch',
  EPOCH_SIMPLE = 'epoch_simple',
  RELATIVE = 'relative',
  RELATIVE_SIMPLE = 'relative_simple',
}

export const ABSOLUTE_TIME = /^(\d{4})-(\d{3})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?$/;

export const RELATIVE_TIME = /^([0-9]{3}T)?([0-9]{2}):([0-9]{2}):([0-9]{2})(\.[0-9]+)?$/;
export const RELATIVE_SIMPLE = /(\d+)(\.[0-9]+)?$/;

export const EPOCH_TIME = /(^[+-]?)([0-9]{3}T)?([0-9]{2}):([0-9]{2}):([0-9]{2})(\.[0-9]+)?$/;
export const EPOCH_SIMPLE = /(^[+-]?)(\d+)(\.[0-9]+)?$/;

/**
 * Checks if the given time is balanced based on the specified time type.
 *
 * @param {string} time - The time to be checked.
 * @param {TimeTypes} type - The type of time (absolute, epoch, relative).
 * @return {{ error?: ErrorCode | undefined; warning?: ErrorCode | undefined }} - An object containing an error or warning message if the time is unbalanced.
 */
export function isTimeBalanced(
  time: string,
  type: TimeTypes,
): { error?: ErrorCode | undefined; warning?: ErrorCode | undefined } {
  switch (type) {
    case TimeTypes.ABSOLUTE:
      if (!ABSOLUTE_TIME.exec(time)) {
        return { error: CustomErrorCodes.InvalidAbsoluteTime() };
      }
      break;
    case TimeTypes.EPOCH:
      if (!EPOCH_TIME.exec(time)) {
        return { error: CustomErrorCodes.InvalidEpochTime() };
      }
      break;
    case TimeTypes.RELATIVE:
      if (!RELATIVE_TIME.exec(time)) {
        return { error: CustomErrorCodes.InvalidRelativeTime() };
      }
      break;
    case TimeTypes.EPOCH_SIMPLE:
    case TimeTypes.RELATIVE_SIMPLE:
      return {
        warning: {
          id: 0,
          message: `Epoch_Simple and Relative_Simple don't need to be balanced`,
        },
      };
    default:
      return {
        error: {
          id: CustomErrorCodes.Type.INVALID_NUMBER,
          message: `Error: TimeType ${type} is not supported.`,
        },
      };
  }

  const { sign, years, days, hours, minutes, seconds, milliseconds } = extractTime(time, type);

  switch (type) {
    case TimeTypes.ABSOLUTE: {
      if (years !== undefined && days !== undefined) {
        const isUnbalanced =
          (years >= 0 &&
            years <= 9999 &&
            days >= 0 &&
            days <= (isLeapYear(years) ? 366 : 365) &&
            hours >= 0 &&
            hours <= 23 &&
            minutes >= 0 &&
            minutes <= 59 &&
            seconds >= 0 &&
            seconds <= 59) === false;

        if (isUnbalanced) {
          return balanceAbsolute(years, days, hours, minutes, seconds, milliseconds);
        }
      }
      return {};
    }
    case TimeTypes.EPOCH:
    case TimeTypes.RELATIVE: {
      const isUnbalanced =
        (days !== undefined
          ? days >= 1 &&
            days <= 365 &&
            hours >= 0 &&
            hours <= 23 &&
            minutes >= 0 &&
            minutes <= 59 &&
            seconds >= 0 &&
            seconds <= 59
          : hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59) === false;

      if (isUnbalanced) {
        return balanceDuration(sign, days ?? 0, hours, minutes, seconds, milliseconds, type);
      }
      return {};
    }
  }
}

/**
 * Extracts the time components from a given time string based on the specified time type.
 *
 * @param {string} time - The time string to extract components from.
 * @param {TimeTypes} type - The type of time (absolute, epoch, relative).
 * @return {{ sign?: '+' | '-'; days?: number; hours: number; milliseconds: number; minutes: number; seconds: number; years?: number }} - An object containing the extracted time components.
 */
function extractTime(
  time: string,
  type: TimeTypes,
): {
  sign?: '+' | '-';
  // eslint-disable-next-line @typescript-eslint/member-ordering
  days?: number;
  hours: number;
  milliseconds: number;
  minutes: number;
  seconds: number;
  years?: number;
} {
  const regex = getTimeRegex(type);
  const matches = regex.exec(time);

  if (!matches) {
    return { hours: 0, milliseconds: 0, minutes: 0, seconds: 0 };
  }

  switch (type) {
    case TimeTypes.ABSOLUTE: {
      const [, years = '0', days = '0', hours = '0', minutes = '0', seconds = '0', milliseconds = '0'] = matches;
      const [yearsNum, daysNum, hoursNum, minuteNum, secondsNum, millisecondNum] = [
        years,
        days,
        hours,
        minutes,
        seconds,
        milliseconds,
      ].map(Number);
      return {
        days: daysNum,
        hours: hoursNum,
        milliseconds: millisecondNum,
        minutes: minuteNum,
        seconds: secondsNum,
        years: yearsNum,
      };
    }

    case TimeTypes.EPOCH: {
      const [, sign = undefined, days = undefined, hours = '0', minutes = '0', seconds = '0', milliseconds = '0'] =
        matches;
      const [hoursNum, minuteNum, secondsNum, millisecondNum] = [hours, minutes, seconds, milliseconds].map(Number);
      const daysNum = days !== undefined ? Number(days.replace('T', '')) : days;
      return {
        days: daysNum,
        hours: hoursNum,
        milliseconds: millisecondNum,
        minutes: minuteNum,

        seconds: secondsNum,
        sign: (sign === '' ? undefined : sign) as '+' | '-' | undefined,
      };
    }

    case TimeTypes.RELATIVE: {
      const [, days = undefined, hours = '0', minutes = '0', seconds = '0', milliseconds = '0'] = matches;
      const [hoursNum, minuteNum, secondsNum, millisecondNum] = [hours, minutes, seconds, milliseconds].map(Number);
      const daysNum = days !== undefined ? Number(days.replace('T', '')) : days;
      return {
        days: daysNum,
        hours: hoursNum,
        milliseconds: millisecondNum,
        minutes: minuteNum,
        seconds: secondsNum,
      };
    }
  }

  return { hours: 0, milliseconds: 0, minutes: 0, seconds: 0 };
}

/**
 * Balances the duration by normalizing the time and determining if it exceeds the maximum allowed duration.
 *
 * @param {('+' | '-' | undefined)} sign - The sign of the duration.
 * @param {number} unbalanceDays - The number of days to balance.
 * @param {number} unbalancedHours - The number of hours to balance.
 * @param {number} unbalanceMinutes - The number of minutes to balance.
 * @param {number} unbalanceSeconds - The number of seconds to balance.
 * @param {number} unbalanceMilliseconds - The number of milliseconds to balance.
 * @param {TimeTypes.EPOCH | TimeTypes.RELATIVE} [type] - The type of time.
 * @return {{ error?: ErrorCode | undefined; warning?: ErrorCode | undefined }} - An object containing an error or warning code.
 */
function balanceDuration(
  sign: '+' | '-' | undefined,
  unbalanceDays: number,
  unbalancedHours: number,
  unbalanceMinutes: number,
  unbalanceSeconds: number,
  unbalanceMilliseconds: number,
  type?: TimeTypes.EPOCH | TimeTypes.RELATIVE,
): { error?: ErrorCode | undefined; warning?: ErrorCode | undefined } {
  const { days, hours, minutes, seconds, milliseconds } = normalizeTime(
    unbalanceDays,
    unbalancedHours,
    unbalanceMinutes,
    unbalanceSeconds,
    unbalanceMilliseconds,
  );

  const DD = days !== 0 ? `${formatNumber(days, 3)}T` : '';
  const HH = days !== 0 ? formatNumber(hours, 2) : formatNumber(hours, 2);
  const MM = formatNumber(minutes, 2);
  const SS = formatNumber(seconds, 2);
  const sss = formatNumber(milliseconds * 1000, 3);

  const balancedTime = `${sign ? sign : ''}${DD}${HH}:${MM}:${SS}[.${sss}]`;

  if (days > 365) {
    switch (type) {
      case TimeTypes.RELATIVE:
        return {
          error: CustomErrorCodes.MaxRelativeTime(balancedTime),
        };
      case TimeTypes.EPOCH:
        return {
          error: CustomErrorCodes.MaxEpochTime(balancedTime, sign),
        };
      default:
        return {
          error: {
            id: 0,
            message: `The time type ${type} is not a valid duration type.`,
          },
        };
    }
  } else {
    return {
      warning: CustomErrorCodes.UnbalancedTime(balancedTime),
    };
  }
}

/**
 * Balances the absolute time components by normalizing them and formatting them into a balanced time string.
 *
 * @param {number} unbalanceYears - The number of years to be unbalanced.
 * @param {number} unbalanceDays - The number of days to be unbalanced.
 * @param {number} unbalancedHours - The number of hours to be unbalanced.
 * @param {number} unbalanceMinutes - The number of minutes to be unbalanced.
 * @param {number} unbalanceSeconds - The number of seconds to be unbalanced.
 * @param {number} unbalanceMilliseconds - The number of milliseconds to be unbalanced.
 * @return {{ error?: ErrorCode | undefined; warning?: ErrorCode | undefined }} - An object containing an error or warning message if the balanced time exceeds the maximum allowed time.
 */
function balanceAbsolute(
  unbalanceYears: number,
  unbalanceDays: number,
  unbalancedHours: number,
  unbalanceMinutes: number,
  unbalanceSeconds: number,
  unbalanceMilliseconds: number,
): { error?: ErrorCode | undefined; warning?: ErrorCode | undefined } {
  const { years, days, hours, minutes, seconds, milliseconds } = normalizeTime(
    unbalanceDays,
    unbalancedHours,
    unbalanceMinutes,
    unbalanceSeconds,
    unbalanceMilliseconds,
    unbalanceYears,
  );

  const YY = years !== 0 && years !== undefined ? `${formatNumber(years, 4)}-` : '0000-';
  const DD = (years !== 0 && days === 0) || days !== 0 ? `${formatNumber(days, 3)}T` : '000T';
  const HH = days !== 0 ? formatNumber(hours, 2) : formatNumber(hours, 2);
  const MM = formatNumber(minutes, 2);
  const SS = formatNumber(seconds, 2);
  const sss = formatNumber(milliseconds, 3);

  const balancedTime = `${YY}${DD}${HH}:${MM}:${SS}.[${sss}]`;

  if (years && years > 9999) {
    return {
      error: CustomErrorCodes.MaxAbsoluteTime(balancedTime),
    };
  }

  return {
    warning: CustomErrorCodes.UnbalancedTime(balancedTime),
  };
}

/**
 * Normalizes the given time values by adjusting milliseconds, seconds, minutes, hours, and days.
 * If years are provided, also normalizes years.
 *
 * @param {number} days - The number of days.
 * @param {number} hours - The number of hours.
 * @param {number} minutes - The number of minutes.
 * @param {number} seconds - The number of seconds.
 * @param {number} milliseconds - The number of milliseconds.
 * @param {number} [years] - The number of years (optional).
 * @return {{ days: number; hours: number; milliseconds: number; minutes: number; seconds: number; years?: number }} - The normalized time values.
 */

function normalizeTime(
  days: number,
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds: number,
  years?: number,
): { days: number; hours: number; milliseconds: number; minutes: number; seconds: number; years?: number } {
  // Normalize milliseconds and seconds
  seconds += Math.floor(milliseconds / 1000);
  milliseconds = milliseconds % 1000;

  // Normalize seconds and minutes
  minutes += Math.floor(seconds / 60);
  seconds = seconds % 60;

  // Normalize minutes and hours
  hours += Math.floor(minutes / 60);
  minutes = minutes % 60;

  // Normalize hours and days
  days += Math.floor(hours / 24);
  hours = hours % 24;

  // Normalize days and years
  if (years !== undefined) {
    const isLY = isLeapYear(years);
    years += Math.floor(days / (isLY ? 366 : 365));
    days = days % (isLY ? 366 : 365);
  }

  // Return the normalized values
  return { days, hours, milliseconds, minutes, seconds, years };
}

/**
 * Determines whether a given year is a leap year.
 *
 * @param {number} year - The year to check.
 * @return {boolean} Returns true if the year is a leap year, false otherwise.
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Formats a number to a specified size by adding leading zeros if necessary.
 *
 * @param {number} number - The number to format.
 * @param {number} size - The desired size of the formatted number.
 * @return {string} The formatted number as a string.
 */
function formatNumber(number: number, size: number): string {
  const isNegative = number < 0;
  const absoluteNumber = Math.abs(number).toString();
  const formattedNumber = absoluteNumber.padStart(size, '0');
  return isNegative ? `-${formattedNumber}` : formattedNumber;
}

/**
 * Returns the regular expression corresponding to the given time type.
 *
 * @param {TimeTypes} type - The time type to retrieve the regular expression for.
 * @return {RegExp} The regular expression corresponding to the given time type.
 */
function getTimeRegex(type: TimeTypes): RegExp {
  switch (type) {
    case TimeTypes.ABSOLUTE:
      return ABSOLUTE_TIME;
    case TimeTypes.RELATIVE:
      return RELATIVE_TIME;
    case TimeTypes.EPOCH:
      return EPOCH_TIME;
    case TimeTypes.EPOCH_SIMPLE:
      return EPOCH_SIMPLE;
    case TimeTypes.RELATIVE_SIMPLE:
      return RELATIVE_SIMPLE;
  }
}
