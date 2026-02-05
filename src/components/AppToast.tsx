import { type CSSProperties } from 'react';
import {
  UNSTABLE_ToastRegion as ToastRegion,
  UNSTABLE_Toast as Toast,
  UNSTABLE_ToastQueue as ToastQueue,
  UNSTABLE_ToastContent as ToastContent,
  Button,
  Text,
  type ToastProps,
} from 'react-aria-components';
import { flushSync } from 'react-dom';
import IconClose from '../assets/icons/ic_close_white.svg?react';

export type AppToastContent = {
  title: string;
  description?: string;
};

export const toastQueue = new ToastQueue<AppToastContent>({
  wrapUpdate(fn) {
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as { startViewTransition: (callback: () => void) => void }).startViewTransition(
        () => {
          flushSync(fn);
        },
      );
    } else {
      fn();
    }
  },
});

export function AppToastRegion() {
  return (
    <ToastRegion
      queue={toastQueue}
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col-reverse gap-2 outline-none"
    >
      {({ toast }) => (
        <AppToast toast={toast}>
          <ToastContent className="flex flex-1 flex-col">
            <Text slot="title" className="whitespace-nowrap text-sm font-semibold text-white">
              {toast.content.title}
            </Text>
            {toast.content.description && (
              <Text slot="description" className="text-xs text-white">
                {toast.content.description}
              </Text>
            )}
          </ToastContent>
          <Button
            slot="close"
            aria-label="Close"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-sm bg-transparent p-0 text-white outline-none hover:bg-white/10 pressed:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >
            <IconClose className="h-4 w-4" />
          </Button>
        </AppToast>
      )}
    </ToastRegion>
  );
}

function AppToast(props: ToastProps<AppToastContent>) {
  return (
    <Toast
      {...props}
      style={{ viewTransitionName: props.toast.key } as CSSProperties}
      className="inline-flex w-fit max-w-[90vw] items-center gap-3 rounded-lg bg-[#222222] px-4 py-3 font-sans text-white shadow-lg outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
    />
  );
}
