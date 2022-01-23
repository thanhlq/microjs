import { CreateApplication } from '@microjs/common/interfaces/http';
import * as dotenv from 'dotenv';
import { FastifyInstance } from 'fastify';
// import FastifySwagger from './http/fastify/middlewares/fastify-swagger';
import RegisterRoute from './route-config';

dotenv.config();

console.log('App starting with env: ' + process.env.NODE_ENV)

const init = async () => {

  const app = await CreateApplication()
  RegisterRoute(app)
  //enable swagger docs
  if ('development' === process.env.NODE_ENV) {
    const server = app.server as FastifyInstance;
    // FastifySwagger(server)

    server.ready(err => {
      if (!err) {
        // https://github.com/fastify/fastify-swagger
        // fastify.swagger()
      }
    })
  }

  const FASTIFY_PORT = Number(process.env.FASTIFY_PORT) || 3006;

  app.listen(FASTIFY_PORT);

  console.log(`🚀  Fastify server running on port ${FASTIFY_PORT}`);
  console.log(`Route index: /`);
  console.log(`Route user: /api/v1/user`);
}

init().then()
