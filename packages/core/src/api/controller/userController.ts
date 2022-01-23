import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function userController(router: FastifyInstance) {
  // GET /api/v1/user
  router.get(
    '/',
    async function (req: FastifyRequest, res: FastifyReply) {
      res.send({
        balance: '$3,277.32',
        picture: 'http://placehold.it/32x32',
        age: 30,
        query: req.query,
        name: 'Leonor Cross',
        gender: 'female',
        company: 'GRONK',
        email: 'leonorcross@gronk.com',
      });
    }
  );
}
