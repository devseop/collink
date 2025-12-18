declare module '*.svg' {
  import React = require('react');
  const src: string;
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement>
  >;
  export default src;
}

declare module '*.svg?react' {
  import React = require('react');
  const Component: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default Component;
}
