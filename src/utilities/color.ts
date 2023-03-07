// FROM https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
// Version 4.1
export const pSBC = (p, c0, c1, l) => {
  let r,
    g,
    b,
    P,
    f,
    t,
    h,
    a = typeof c1 == 'string';
  const m = Math.round;
  if (
    typeof p != 'number' ||
    p < -1 ||
    p > 1 ||
    typeof c0 != 'string' ||
    (c0[0] != 'r' && c0[0] != '#') ||
    (c1 && !a)
  ) {
    return null;
  }
  (h = c0.length > 9),
    (h = a ? (c1.length > 9 ? true : c1 == 'c' ? !h : false) : h),
    (f = pSBC.pSBCr(c0)),
    (P = p < 0),
    // eslint-disable-next-line sort-keys
    (t = c1 && c1 != 'c' ? pSBC.pSBCr(c1) : P ? { r: 0, g: 0, b: 0, a: -1 } : { r: 255, g: 255, b: 255, a: -1 }),
    (p = P ? p * -1 : p),
    (P = 1 - p);
  if (!f || !t) {
    return null;
  }
  if (l) {
    (r = m(P * f.r + p * t.r)), (g = m(P * f.g + p * t.g)), (b = m(P * f.b + p * t.b));
  } else {
    (r = m((P * f.r ** 2 + p * t.r ** 2) ** 0.5)),
      (g = m((P * f.g ** 2 + p * t.g ** 2) ** 0.5)),
      (b = m((P * f.b ** 2 + p * t.b ** 2) ** 0.5));
  }
  /* @ts-ignore */
  (a = f.a), (t = t.a), (f = a >= 0 || t >= 0), (a = f ? (a < 0 ? t : t < 0 ? a : a * P + t * p) : 0);
  if (h) {
    return 'rgb' + (f ? 'a(' : '(') + r + ',' + g + ',' + b + (f ? ',' + m(a * 1000) / 1000 : '') + ')';
  } else {
    return (
      '#' +
      (4294967296 + r * 16777216 + g * 65536 + b * 256 + (f ? m(a * 255) : 0)).toString(16).slice(1, f ? undefined : -2)
    );
  }
};

/* TODO try using this one instead since it's TS */
// https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
type ColorObject = Record<'r' | 'g' | 'b' | 'a', number>;
const singleColorSpace = 16 * 16; // 256
const blueSpace = singleColorSpace;
const greenSpace = blueSpace * singleColorSpace; // 65536
const redSpace = greenSpace * singleColorSpace; // 16777216
/* eslint-disable regex/invalid */
// adapted to TS from https://github.com/PimpTrizkit/PJs/wiki/12.-Shade,-Blend-and-Convert-a-Web-Color-(pSBC.js)
export const toColorObject = (rgbOrHex: string): ColorObject => {
  const { length } = rgbOrHex;
  const outputColor = {} as ColorObject;
  if (length > 9) {
    const rgbaColor = rgbOrHex.split(',');
    const [rgbaAndRed, green, blue, alpha] = rgbaColor;

    if (rgbaAndRed.slice(0, 3) !== 'rgb') {
      throw new Error('Invalid color format');
    }
    const red = rgbaAndRed[3] === 'a' ? rgbaAndRed.slice(5) : rgbaAndRed.slice(4);

    const rgbaLength = rgbaColor.length;
    if (rgbaLength < 3 || rgbaLength > 4) {
      return null;
    }
    outputColor.r = parseInt(red, 10);
    outputColor.g = parseInt(green, 10);
    outputColor.b = parseInt(blue, 10);
    outputColor.a = alpha ? parseFloat(alpha) : -1;
  } else {
    if (length === 8 || length === 6 || length < 4) {
      throw new Error('Invalid hex color format');
    }
    let HexColor = rgbOrHex;
    if (length < 6) {
      HexColor = `#${rgbOrHex[1]}${rgbOrHex[1]}${rgbOrHex[2]}${rgbOrHex[2]}${rgbOrHex[3]}${rgbOrHex[3]}${
        length > 4 ? rgbOrHex[4] + rgbOrHex[4] : ''
      }`;
    }
    if (length === 9 || length === 5) {
      const hexRed = parseInt(HexColor.slice(1, 3), 16);
      outputColor.r = hexRed;

      const hexGreen = parseInt(HexColor.slice(3, 5), 16);
      outputColor.g = hexGreen;

      const hexBlue = parseInt(HexColor.slice(5, 7), 16);
      outputColor.b = hexBlue;

      const hexAlpha = parseInt(HexColor.slice(7, 9), 16);
      outputColor.a = Math.round((hexAlpha / 255) * 100) / 100;
    } else {
      const hexRed = parseInt(HexColor.slice(1, 3), 16);
      outputColor.r = hexRed;

      const hexGreen = parseInt(HexColor.slice(3, 5), 16);
      outputColor.g = hexGreen;

      const hexBlue = parseInt(HexColor.slice(5, 7), 16);
      outputColor.b = hexBlue;

      outputColor.a = -1;
    }
  }
  return outputColor;
};

const black: ColorObject = { r: 0, g: 0, b: 0, a: -1 };
const white: ColorObject = { r: 255, g: 255, b: 255, a: -1 };
export const tint = (
  ratio: number,
  inputColor: string,
  { toColor, useLinear, reformat }: { toColor?: string; useLinear?: boolean; reformat?: boolean } = {},
) => {
  const { round } = Math;
  const clampedRatio = Math.min(Math.max(ratio, -1), 1);
  if (ratio < -1 || ratio > 1) {
    // eslint-disable-next-line no-console
    console.info(`Ratio should be between -1 and 1 and it is ${ratio}. It will be clamped to ${clampedRatio}`);
  }
  let baseColor = inputColor;
  if (inputColor[0] !== 'r' && inputColor[0] !== '#') {
    baseColor = '#000';
    // eslint-disable-next-line no-console
    console.info(
      `Invalid input color format. "${inputColor}" should be rgb(a) or hex. It will fallback to "${baseColor}"`,
    );
  }
  let isRGBformat = baseColor.length > 9 || baseColor.includes('rgb(');
  isRGBformat = reformat ? !isRGBformat : isRGBformat;

  if (toColor) {
    const isToColorRgbFormat = (toColor && toColor?.length > 9) || toColor?.includes('rgb(');
    isRGBformat = reformat ? !isToColorRgbFormat : isToColorRgbFormat;
  }
  const formattedBaseColor = toColorObject(baseColor);
  const isNegativeRatio = clampedRatio < 0;
  const toColorDefault = isNegativeRatio ? black : white;
  const formattedToColor = toColor && !reformat ? toColorObject(toColor) : toColorDefault;
  const toColorRatio = Math.abs(clampedRatio);
  const baseRatio = 1 - toColorRatio;

  const outputColor = {} as ColorObject;
  if (useLinear) {
    outputColor.r = round(baseRatio * formattedBaseColor.r + toColorRatio * formattedToColor.r);
    outputColor.g = round(baseRatio * formattedBaseColor.g + toColorRatio * formattedToColor.g);
    outputColor.b = round(baseRatio * formattedBaseColor.b + toColorRatio * formattedToColor.b);
  } else {
    outputColor.r = round((baseRatio * formattedBaseColor.r ** 2 + toColorRatio * formattedToColor.r ** 2) ** 0.5);
    outputColor.g = round((baseRatio * formattedBaseColor.g ** 2 + toColorRatio * formattedToColor.g ** 2) ** 0.5);
    outputColor.b = round((baseRatio * formattedBaseColor.b ** 2 + toColorRatio * formattedToColor.b ** 2) ** 0.5);
  }

  const blendedAlpha = formattedBaseColor.a * baseRatio + formattedToColor.a * toColorRatio;

  outputColor.a = formattedToColor.a < 0 ? formattedBaseColor.a : blendedAlpha;

  const hasAlpha = formattedBaseColor.a >= 0 || formattedToColor.a >= 0;
  if (isRGBformat) {
    return `rgb${hasAlpha ? 'a' : ''}(${outputColor.r},${outputColor.g},${outputColor.b}${
      hasAlpha ? `,${round(outputColor.a * 1000) / 1000}` : ''
    })`;
  }
  return `#${(
    outputColor.r * redSpace +
    outputColor.g * greenSpace +
    outputColor.b * blueSpace +
    (hasAlpha ? round(outputColor.a * 255) : 0)
  )
    .toString(16)
    // If no Alpha, we remove the last 2 hex digits
    .slice(0, hasAlpha ? undefined : -2)}`;
};

pSBC.pSBCr = d => {
  const i = parseInt;
  let n = d.length,
    x = {};
  if (n > 9) {
    const [r, g, b, a] = (d = d.split(','));
    n = d.length;
    if (n < 3 || n > 4) {
      return null;
    }
    (x.r = i(r[3] == 'a' ? r.slice(5) : r.slice(4))), (x.g = i(g)), (x.b = i(b)), (x.a = a ? parseFloat(a) : -1);
  } else {
    if (n == 8 || n == 6 || n < 4) {
      return null;
    }
    if (n < 6) {
      d = '#' + d[1] + d[1] + d[2] + d[2] + d[3] + d[3] + (n > 4 ? d[4] + d[4] : '');
    }
    d = i(d.slice(1), 16);
    if (n == 9 || n == 5) {
      (x.r = (d >> 24) & 255),
        (x.g = (d >> 16) & 255),
        (x.b = (d >> 8) & 255),
        (x.a = Math.round((d & 255) / 0.255) / 1000);
    } else {
      (x.r = d >> 16), (x.g = (d >> 8) & 255), (x.b = d & 255), (x.a = -1);
    }
  }
  return x;
};

const isValidHex = hex => /^#([A-Fa-f0-9]{3,4}){1,2}$/.test(hex);

const getChunksFromString = (st, chunkSize) => st.match(new RegExp(`.{${chunkSize}}`, 'g'));

const convertHexUnitTo256 = hexStr => parseInt(hexStr.repeat(2 / hexStr.length), 16);

const getAlphafloat = (a, alpha) => {
  if (typeof a !== 'undefined') {
    return a / 255;
  }
  if (typeof alpha != 'number' || alpha < 0 || alpha > 1) {
    return 1;
  }
  return alpha;
};

export const hexToRgba = (hex, alpha) => {
  if (!isValidHex(hex)) {
    return 'rgba(0,0,0,1)';
  }
  const chunkSize = Math.floor((hex.length - 1) / 3);
  const hexArr = getChunksFromString(hex.slice(1), chunkSize);
  const [r, g, b, a] = hexArr.map(convertHexUnitTo256);
  return `rgba(${r}, ${g}, ${b}, ${getAlphafloat(a, alpha)})`;
};
