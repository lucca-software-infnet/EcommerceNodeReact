import { createCheckoutProPreference } from "../services/mercadopagoCheckout.service.js";

export async function paymentsRoutes(app) {
  app.post("/payments/checkout", async (request, reply) => {
    const body = request.body || {};
    const items = body?.items;
    const total = body?.total;

    try {
      const data = await createCheckoutProPreference({
        cartItems: items,
        frontendTotal: total,
      });

      if (!data?.preferenceId || !data?.init_point) {
        return reply.code(502).send({
          error: "Não foi possível iniciar o checkout no Mercado Pago",
        });
      }

      return reply.code(201).send(data);
    } catch (err) {
      const statusCode = Number(err?.statusCode) || 500;
      const message =
        statusCode >= 500
          ? "Erro ao iniciar pagamento"
          : err?.message || "Payload inválido";

      // Evita logar dados sensíveis (ex.: headers/token) caso o SDK inclua detalhes da requisição no erro.
      request.log.warn(
        {
          err: {
            name: err?.name,
            message: err?.message,
            statusCode,
          },
        },
        "payments/checkout failed"
      );
      return reply.code(statusCode).send({ error: message });
    }
  });
}

