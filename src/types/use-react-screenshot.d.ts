declare module 'use-react-screenshot' {
  export type UseScreenshotOptions = {
    type?: string;
    quality?: number;
  };

  export type TakeScreenshot = (node: HTMLElement) => Promise<string>;

  export function useScreenshot(
    options?: UseScreenshotOptions
  ): [string | null, TakeScreenshot];
}
