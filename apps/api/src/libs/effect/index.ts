import { Layer, ManagedRuntime } from 'effect';

export type ErrorMsg = {
  error?: unknown;
  msg?: string;
};

export function createErrorFactory<T>(Self: new (payload: ErrorMsg) => T) {
  return (msg?: string) => (error?: unknown) => new Self({ error, msg });
}

const APP_RUNTIME_INSTANCE = new Map<string, unknown>();

export function RUNTIME(feature: string) {
  return <R, E>(
    ...layers: Layer.Layer<R, E, never>[]
  ): ManagedRuntime.ManagedRuntime<R, E> => {
    if (!APP_RUNTIME_INSTANCE.has(feature)) {
      const layerList: Layer.Layer<R, E, never> =
        layers.length > 0
          ? (layers.reduce(
              (acc, layer) => Layer.merge(acc, layer) as Layer.Layer<R, E>
            ) as Layer.Layer<R, E, never>)
          : (Layer.empty as unknown as Layer.Layer<R, E, never>);

      APP_RUNTIME_INSTANCE.set(feature, ManagedRuntime.make(layerList));
    }

    return APP_RUNTIME_INSTANCE.get(feature) as ManagedRuntime.ManagedRuntime<
      R,
      E
    >;
  };
}
