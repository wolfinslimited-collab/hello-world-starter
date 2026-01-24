import NP from "number-precision";

/**
 * A utility library for high-precision arithmetic
 * solving the 0.1 + 0.2 floating point issue.
 */
export const math = {
  /**
   * Addition: sum(0.1, 0.2, 0.3) => 0.6
   */
  sum: (...args: number[]): number => {
    return NP.plus(...args);
  },

  /**
   * Subtraction: mine(1, 0.9) => 0.1
   * Note: Subtracts all subsequent numbers from the first.
   */
  mine: (...args: number[]): number => {
    return NP.minus(...args);
  },

  /**
   * Multiplication: mul(0.1, 0.2) => 0.02
   */
  mul: (...args: number[]): number => {
    return NP.times(...args);
  },

  /**
   * Division: div(1.21, 1.1) => 1.1
   */
  div: (...args: number[]): number => {
    return NP.divide(...args);
  },
  normal: (args: number): number => {
    return NP.strip(args);
  },

  /**
   * Rounding: round(0.105, 2) => 0.11
   */
  round: (num: number, decimal: number): number => {
    return NP.round(num, decimal);
  },
};
