import type { ReactNode } from 'react';
import {
  Tooltip as AriaTooltip,
  type TooltipProps as AriaTooltipProps,
  OverlayArrow,
  composeRenderProps,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';

type LinkTooltipProps = Omit<AriaTooltipProps, 'children'> & {
  icon?: ReactNode;
  label: ReactNode;
};

const styles = tv({
  base: 'group bg-neutral-700 dark:bg-neutral-600 border border-neutral-800 dark:border-white/10 font-sans text-xs text-white rounded-lg drop-shadow-lg will-change-transform px-3 py-2 box-border',
  variants: {
    isEntering: {
      true: 'animate-in fade-in placement-bottom:slide-in-from-top-0.5 placement-top:slide-in-from-bottom-0.5 placement-left:slide-in-from-right-0.5 placement-right:slide-in-from-left-0.5 ease-out duration-200',
    },
    isExiting: {
      true: 'animate-out fade-out placement-bottom:slide-out-to-top-0.5 placement-top:slide-out-to-bottom-0.5 placement-left:slide-out-to-right-0.5 placement-right:slide-out-to-left-0.5 ease-in duration-150',
    },
  },
});

export function LinkTooltip({ icon, label, ...props }: LinkTooltipProps) {
  return (
    <AriaTooltip
      {...props}
      offset={props.offset ?? 4}
      className={composeRenderProps(props.className, (className, renderProps) =>
        styles({ ...renderProps, className })
      )}
    >
      <OverlayArrow className="-mb-[3px]">
        <svg
          width={8}
          height={8}
          viewBox="0 0 8 8"
          className="block fill-neutral-700 dark:fill-neutral-600 forced-colors:fill-[Canvas] stroke-neutral-800 dark:stroke-white/10 forced-colors:stroke-[ButtonBorder] group-placement-top:rotate-180 group-placement-left:-rotate-90 group-placement-right:rotate-90"
        >
          <path d="M0 4 L4 0 L8 4" />
        </svg>
      </OverlayArrow>
      <div className="flex items-center gap-[6px] max-w-[220px]">
        {icon}
        <span className="truncate font-medium">{label}</span>
      </div>
    </AriaTooltip>
  );
}
