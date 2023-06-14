/**
 * Represents an error code with an ID and a message.
 */
export interface ErrorCode {
  id: number;
  message: string;
}

/**
 * Contains custom error code definitions along with their error messages.
 */
export const CustomErrorCodes = {
  InvalidAbsoluteTime: (): ErrorCode => {
    return {
      id: -1,
      message: `Time Error: Incorrectly formatted absolute time string.
      Received : Malformed Absolute time.
      Expected: YYYY-DOYThh:mm:ss[.sss]`,
    };
  },

  /**
   * InvalidArgumentCount error code and message.
   * @param {number} value - The provided argument count.
   * @param {number} min - The minimum allowed argument count.
   * @param {number} max - The maximum allowed argument count.
   */
  InvalidArgumentCount: (value: number, min: number, max: number): ErrorCode => {
    return {
      id: -8,
      message: `Argument Count Error: The provided arguments for repetition is outside the valid range.
    Received: ${value} repeating arguments.
    Expected: Repetition within the range of [${min}, ${max}]]`,
    };
  },

  /**
   * InvalidEnum error code and message.
   * @param {string} value - The received ENUM argument.
   * @param {string} expected - The expected ENUM values.
   */
  InvalidEnum: (value: string, expected: string): ErrorCode => {
    return {
      id: -6,
      message: `ENUM Error: Unexpected ENUM argument.
    Received: ${value}
    Expected: ${expected}`,
    };
  },

  /**
   * InvalidInteger error code and message.
   * @param {string} value - The received argument value.
   */
  InvalidInteger: (value: string): ErrorCode => {
    return {
      id: -4,
      message: `Number Error: Argument is not a integer.
    Received: ${value}
    Expected: An integer.`,
    };
  },

  /**
   * InvalidNumber error code and message.
   * @param {string} value - The received argument value.
   */
  InvalidNumber: (value: string): ErrorCode => {
    return {
      id: -4,
      message: `Number Error: Invalid Argument Type
    Received: ${value}
    Expected: A valid number.`,
    };
  },

  /**
   * InvalidRange error code and message.
   * @param {number} num - The received argument value.
   * @param {number} min - The minimum allowed value.
   * @param {number} max - The maximum allowed value.
   */
  InvalidRange: (num, min, max): ErrorCode => {
    return {
      id: -7,
      message: `Range Error: Argument Out of Bounds.
  Received: ${num}
  Expected: A number within the range of [${min}, ${max}]].`,
    };
  },

  InvalidRelativeTime: (): ErrorCode => {
    return {
      id: -2,
      message: `Time Error: Incorrectly formatted duration string.
      Received: A malformed duration.
      Expected: hh:mm:ss[.sss]`,
    };
  },

  /**
   * InvalidUnsignedInteger error code and message.
   * @param {string} value - The received argument value.
   */
  InvalidUnsignedInteger: (value: string): ErrorCode => {
    return {
      id: -5,
      message: `Number Error: Argument is not unsigned.
    Received: ${value}
    Expected: A signed value`,
    };
  },
  UncaughtArgumentType: (): ErrorCode => {
    return { id: -3, message: `Error: Command Argument Type Mismatch` };
  },
};
