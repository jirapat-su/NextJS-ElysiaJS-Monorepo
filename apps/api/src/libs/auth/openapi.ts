import { auth } from './index';

type OpenAPISchema = Awaited<ReturnType<typeof auth.api.generateOpenAPISchema>>;

let _schema: OpenAPISchema | null = null;

const getSchema = async (): Promise<OpenAPISchema> => {
  if (!_schema) {
    _schema = await auth.api.generateOpenAPISchema();
  }
  return _schema;
};

export const authOpenAPI = {
  getPaths: (prefix = '/auth') =>
    getSchema().then(({ paths }) => {
      const reference: Record<string, unknown> = Object.create(null);

      for (const path of Object.keys(paths)) {
        const key = prefix + path;
        const pathItem = paths[path as keyof typeof paths];
        if (!pathItem) {
          continue;
        }

        reference[key] = pathItem;

        for (const method of Object.keys(pathItem)) {
          const operation = (reference[key] as Record<string, unknown>)[method];
          if (operation && typeof operation === 'object') {
            (operation as Record<string, unknown>).tags = ['Authentication'];
          }
        }
      }

      // biome-ignore lint/suspicious/noExplicitAny: better-auth OpenAPI paths must be cast to satisfy Elysia openapi plugin's expected type
      return reference as any;
    }),
  components: getSchema().then(({ components }) => {
    // biome-ignore lint/suspicious/noExplicitAny: better-auth OpenAPI components must be cast to satisfy Elysia openapi plugin's expected type
    return components as any;
  }),
} as const;
