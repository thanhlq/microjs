// @author: Thanh LE thanhlq@gmail.com
// Last update: 2022/01/17

import fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { IncomingHttpHeaders } from 'http';
import pino from 'pino';
import * as qs from 'qs'
import { PRODUCTION_ENV } from '@microjs/common';
import { HttpHandlerFn, HttpHandlerFnNull, HttpPluginOptions, HttpRoute, IHttpApplication, IHttpApplicationFactory, IHttpRequest, IHttpResponse } from '@microjs/common/interfaces/http';

const env = process.env;
export const environment = env.NODE_ENV;
export const isProduction = environment == PRODUCTION_ENV;

export const InitLogger = () => {
  let logger;

  if (!isProduction) {
    const transport = pino.transport({
      target: 'pino-pretty',
      options: { colorize: true }
    })
    logger = pino({
      level: env.LOG_LEVEL || 'debug',
      translateTime: 'HH:MM:ss Z',
      // ignore: 'pid,hostname'
    },
      transport)
  } else {
    logger = pino({
      level: env.LOG_LEVEL || 'info',
    });
  }

  return logger;
}

const logger = InitLogger();
export { logger };
export { factory };

const CreateServerInstance = () => {
  const serverInstance = fastify({
    // Logger only for production
    logger: logger,
    querystringParser: str => qs.parse(str)
  });

  if (!isProduction) {
    serverInstance.addHook('preHandler', function (req, reply, done) {
      if (req.body) {
        req.log.info({ body: req.body }, 'parsed req body')
      }
      done()
    })
  }

  return serverInstance;
}

export class FastifyHttpRequest implements IHttpRequest {
  req: FastifyRequest
  id?: string | undefined;
  url?: string | undefined;
  origin?: string | undefined;
  href?: string | undefined;
  method: string;
  path?: string;
  params?: any;
  query?: any;
  body?: any;
  headers?: IncomingHttpHeaders | undefined;
  querystring?: string | undefined;
  search?: string | undefined;
  host?: string | undefined;
  hostname?: string | undefined;
  protocol?: string;
  ip?: string;
  charset?: string | undefined;
  type?: string | undefined;
  isProduction: boolean;

  constructor(_req: FastifyRequest) {
    this.req = _req
    this.id = this.req.id;
    this.method = this.req.method;
    this.params = this.req.params || {};
    this.query = this.req.query || {};
    this.body = this.req.body;
    this.headers = this.req.headers;

    this.url = this.req.url;
    this.protocol = this.req.protocol;
    this.ip = this.req.ip;
    // this.log = this.req.log;

    this.isProduction = environment == 'production';
  }

  /**
   * Get header.
   *
   * @param field
   * @returns
   */
  get(field: string): string | undefined {
    const h = this.req.raw.headers[field]
    if (h === undefined) {
      return undefined
    }
    if (Array.isArray(h)) {
      return h.toString()
    }

    return h;
  }

}

export class FastifyHttpResponse implements IHttpResponse {
  status?: number | undefined;
  message?: string | undefined;
  body?: unknown;
  length?: number | undefined;
  headerSent?: boolean | undefined;
  type?: string | undefined;
  etag?: string;
  res: FastifyReply;

  constructor(_res: FastifyReply) {
    this.status = 200;
    this.type = 'application/json';
    this.res = _res;
  }

  send(payload?: any) {
    this.res.send(payload);
  }

  set(field: { [key: string]: string | string[]; }): IHttpResponse;
  set(field: string, val: string | string[]): IHttpResponse;
  set(field: any, val?: any): IHttpResponse {
    this.res.header(field, val)
    return this;
  }
  header(field: { [key: string]: string | string[]; }): IHttpResponse;
  header(field: string, val: string | string[]): IHttpResponse;
  header(field: any, val?: any): IHttpResponse {
    this.res.header(field, val)
    return this;
  }

  debugRequest(request: FastifyRequest) {
    const debug = logger.debug
    debug(JSON.stringify(request.body));
    debug(JSON.stringify(request.query));
    debug(JSON.stringify(request.params));
    debug(JSON.stringify(request.headers));
    debug(request.raw)
    debug(request.server)
    debug(request.id)
    debug(request.ip)
    debug(request.ips)
    debug(request.hostname)
    debug(request.protocol)
    debug(request.url)
    debug(request.routerMethod)
    debug(request.routerPath)
  }
}

function FastifyHandlerWrapper(handler: HttpHandlerFn) {
  return async function FastifyHandler(req: FastifyRequest, res: FastifyReply) {
    return await handler(new FastifyHttpRequest(req), new FastifyHttpResponse(res))
  }
}

export class FrameworkImpl implements IHttpApplication {
  server: FastifyInstance;
  routes: HttpRoute[] = [];

  constructor(serverInstance?: any) {
    this.server = serverInstance || CreateServerInstance()
  }

  listen(port: any): void {
    this.server.listen(port)
  }

  get(path: string, handler: HttpHandlerFn): IHttpApplication {
    this.server.get(path,
      FastifyHandlerWrapper(handler)
    )
    return this;
  }
  post(path: string, handler: HttpHandlerFn): IHttpApplication {
    throw new Error('Method not implemented.');
  }
  put(path: string, handler: HttpHandlerFn): IHttpApplication {
    throw new Error('Method not implemented.');
  }
  delete(path: string, handler: HttpHandlerFn): IHttpApplication {
    throw new Error('Method not implemented.');
  }
  head(path: string, handler: HttpHandlerFn): IHttpApplication {
    throw new Error('Method not implemented.');
  }
  option(path: string, handler: HttpHandlerFn): IHttpApplication {
    throw new Error('Method not implemented.');
  }

  registerRoute(routes: HttpRoute, opts: HttpPluginOptions): void {
    // serverInstance.register(route , opts: HttpPluginOptions)
  }

  registerRoutes(routes: HttpRoute[], opts: HttpPluginOptions): void {
    // this.server.register(DoRegisterRoutes(this.server, routes, opts))
    this.server.register(RegisterApiController(routes), opts)
  }

  getServerInstance(): any {
    return this.server;
  }

  setServerInstance(server: any) {
    this.server = server;
  }

}

function RegisterApiController(routes: HttpRoute[]) {
  return async function ApiController(router: FastifyInstance) {
    for (const r of routes) {
      if (r.method && r.handler) {
        switch (r.method) {
          case 'get':
            logger.debug(`Registered GET:${r.path}`)
            router.get(
              r.path,
              async function (req: FastifyRequest, res: FastifyReply) {
                const handler: HttpHandlerFn = r.handler || HttpHandlerFnNull
                const hResult = await handler(new FastifyHttpRequest(req), new FastifyHttpResponse(res))
                if (!res.sent) {
                  return hResult;
                }
              }
            );
            break;
          case 'post':
            logger.debug(`Registered  POST:${r.path}`)
            router.post(
              r.path,
              async function (req: FastifyRequest, res: FastifyReply) {
                const handler: HttpHandlerFn = r.handler || HttpHandlerFnNull
                const hResult = await handler(new FastifyHttpRequest(req), new FastifyHttpResponse(res))
                if (!res.sent) {
                  return hResult;
                }
              }
            );
            break;
          case 'put':
            break;
          case 'delete':
            break;
          case 'options':
            break;
          case 'head':
            break;
        }

      }
    }
  }
}

function DoRegisterRoutes(router: FastifyInstance, routes: HttpRoute[], opts: HttpPluginOptions) {
  // fastify.register(userController, { prefix: '/api/v1/user' });

  // async function userController(router: FastifyInstance) {
  //   // GET /api/v1/user
  //   router.get(
  //     '/',
  //     async function (req: FastifyRequest, res: FastifyReply) {
  //       res.send({
  //         balance: '$3,277.32',
  //         picture: 'http://placehold.it/32x32',
  //         age: 30,
  //         query: req.query,
  //         name: 'Leonor Cross',
  //         gender: 'female',
  //         company: 'GRONK',
  //         email: 'leonorcross@gronk.com',
  //       });
  //     }
  //   );
  // }

  return async function RouterMiddleware(router: FastifyInstance) {
    /**
     * opts: { prefix: '/api/v1/user' }
     */
    router.register(RegisterApiController(routes), opts)

  }
}

export class ApplicationFactory implements IHttpApplicationFactory {
  createApplication(framework?: string, args?: any): IHttpApplication {
    const app = new FrameworkImpl(args)
    return app;
  }
}

const factory = new ApplicationFactory();

