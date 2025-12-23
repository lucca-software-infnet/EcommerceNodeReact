import authMiddleware from "../middlewares/auth.middleware.js";
import { checkoutService } from "../services/checkout.service.js";

export default async function checkoutRoutes(app) {

  app.post(
    "/checkout",
    { preHandler: authMiddleware },
    async (request, reply) => {

      const usuarioId = request.user.id;
      const { enderecoId, metodoPagamento } = request.body;

      try {
        const compra = await checkoutService({
          usuarioId,
          enderecoId,
          metodoPagamento,
        });

        return reply.code(201).send({
          message: "Compra realizada com sucesso",
          compraId: compra.id,
        });

      } catch (error) {
        return reply.code(400).send({
          error: error.message,
        });
      }
    }
  );
}
