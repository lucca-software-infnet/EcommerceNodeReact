import { createCheckoutProPreference } from "../services/mercadopagoCheckout.service.js";

export async function paymentsRoutes(app) {
  app.post("/payments/checkout", async (request, reply) => {
    try {
      const { items, total } = request.body ?? {};

      const data = await createCheckoutProPreference({
        cartItems: items,       // 🔴 nome correto
        frontendTotal: total,
      });

      if (!data?.init_point) {
        return reply.code(502).send({ error: "Falha ao criar checkout" });
      }

      return reply.code(201).send(data);
    } catch (err) {
      request.log.error(err, "payments/checkout failed");

      return reply.code(err?.statusCode || 500).send({
        error: err?.message || "Erro ao iniciar pagamento",
      });
    }
  });
}
