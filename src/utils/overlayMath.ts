export const DEFAULT_IMAGE_SIZE = 80;
export const IMAGE_SCALE_PERCENT_MIN = 50;

const DEFAULT_VIEWPORT_WIDTH = 390;
const DEFAULT_VIEWPORT_HEIGHT = 844;

export const clampScalePercent = (value: number, maxPercent: number) =>
  Math.max(IMAGE_SCALE_PERCENT_MIN, Math.min(value, Math.max(maxPercent, IMAGE_SCALE_PERCENT_MIN)));

const getViewportSize = (viewportWidth?: number, viewportHeight?: number) => {
  if (typeof viewportWidth === 'number' && typeof viewportHeight === 'number') {
    return { width: viewportWidth, height: viewportHeight };
  }
  if (typeof window !== 'undefined') {
    return { width: window.innerWidth, height: window.innerHeight };
  }
  return { width: DEFAULT_VIEWPORT_WIDTH, height: DEFAULT_VIEWPORT_HEIGHT };
};

export const getImageScalePercentMax = (
  baseWidth: number,
  baseHeight: number,
  viewportWidth?: number,
  viewportHeight?: number
) => {
  const { width, height } = getViewportSize(viewportWidth, viewportHeight);
  const safeBaseWidth = baseWidth || DEFAULT_IMAGE_SIZE;
  const safeBaseHeight = baseHeight || DEFAULT_IMAGE_SIZE;
  const maxPercent = Math.max(
    (width / safeBaseWidth) * 100,
    (height / safeBaseHeight) * 100,
    IMAGE_SCALE_PERCENT_MIN
  );
  return Math.round(maxPercent);
};

export const computeBaseDimensions = (width: number, height: number) => {
  const safeWidth = width || DEFAULT_IMAGE_SIZE;
  const safeHeight = height || DEFAULT_IMAGE_SIZE;
  const maxDimension = Math.max(safeWidth, safeHeight);
  if (maxDimension === 0) {
    return {
      baseWidth: DEFAULT_IMAGE_SIZE,
      baseHeight: DEFAULT_IMAGE_SIZE,
    };
  }
  const normalizationScale = DEFAULT_IMAGE_SIZE / maxDimension;
  return {
    baseWidth: safeWidth * normalizationScale,
    baseHeight: safeHeight * normalizationScale,
  };
};
