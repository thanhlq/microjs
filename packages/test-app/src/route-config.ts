import { HttpRoute, IHttpApplication, IHttpRequest, IHttpResponse } from '@microjs/common/src';
import { promises } from 'fs';
import { resolve } from 'path';

async function GetUser(req: IHttpRequest, res: IHttpResponse) {
  res.send({
    balance: '$3,277.32',
    picture: 'http://placehold.it/32x32',
    age: 30,
    query: req?.query,
    name: 'Leonor Cross',
    gender: 'female',
    company: 'GRONK',
    email: 'leonorcross@gronk.com',
  });
}

async function GetUserConfig(req: IHttpRequest, res: IHttpResponse) {
  res.send({
    role: 'admin'
  });
}

const { readFile } = promises;

async function ServeFile(req: IHttpRequest, res: IHttpResponse) {
  const indexHtmlPath = resolve(__dirname, '../../static/index.html');
  const indexHtmlContent = await readFile(indexHtmlPath);
  res
    .header('Content-Type', 'text/html; charset=utf-8')
    .send(indexHtmlContent);
}
// export default async function router(fastify: FastifyInstance) {
//   fastify.register(userController, { prefix: '/api/v1/user' });
//   fastify.register(indexController, { prefix: '/' });
// }

const userRoutes = [
  new HttpRoute('get', '/', GetUser),
  new HttpRoute('get', '/config', GetUserConfig)
]

const staticFile = [
  new HttpRoute('get', '/', ServeFile),
]

function RegisterRoute(app: IHttpApplication) {
  app.registerRoutes(userRoutes, { prefix: '/api/v1/users' });
  app.registerRoutes(staticFile, { prefix: '/' });
}

export default RegisterRoute