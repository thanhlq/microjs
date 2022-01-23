import { IHttpApplication, IHttpApplicationFactory } from "./http";

const httpCoreFramework = process.env.CORE_FRAMEWORK || 'fastify'

async function DoLookupServerImplementation(framework?: string, arg?: any) {
  const frameworkImpl = `./${httpCoreFramework}/index`
  return await import(frameworkImpl);
}

export async function CreateApplication(framework?: any, args?: any): Promise<IHttpApplication> {
  const f = await DoLookupServerImplementation(framework)
  const appFactory: IHttpApplicationFactory = f.factory;
  const app: IHttpApplication = appFactory.createApplication();
  return app;
}
