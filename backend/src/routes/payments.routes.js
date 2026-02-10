import { createCheckoutProPreference } from "../services/mercadopagoCheckout.service.js";

export async function paymentsRoutes(app) {
  app.post(
    "/payments/checkout",
    {
      preHandler: [app.authenticate],
    },
    async (request, reply) => {
      // Blindagem extra: nunca deixar autenticação causar 500.
      if (!request.user?.id) {
        return reply.code(401).send({ error: "Usuário não autenticado" });
      }

      try {
        const { items, total } = request.body ?? {};

        const data = await createCheckoutProPreference({
          cartItems: items,
          frontendTotal: total,
        });

        if (!data?.init_point) {
          return reply.code(502).send({ error: "Falha ao criar checkout" });
        }

        return reply.code(201).send(data);
      } catch (err) {
        // Não loga headers/tokens. Só o essencial para debugging.
        request.log.error(
          {
            err: {
              name: err?.name,
              message: err?.message,
              statusCode: err?.statusCode,
            },
          },
          "payments/checkout failed"
        );

        const statusCode = Number(err?.statusCode) || 500;
        const message = err?.message || "Erro ao iniciar pagamento";

        return reply.code(statusCode).send({ error: message });
      }
    }
  );
}
