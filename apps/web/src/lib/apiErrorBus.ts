type Listener = (message: string) => void;

let listener: Listener | null = null;

export const apiErrorBus = {
  emit(message: string) {
    listener?.(message);
  },
  subscribe(fn: Listener) {
    listener = fn;
    return () => { listener = null; };
  },
};
