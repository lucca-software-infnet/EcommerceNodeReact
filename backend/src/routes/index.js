import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import produtoRoutes from "./produto.routes.js";

import { checkoutRoutes } from "./checkout.routes.js";
import { pedidosRoutes, pedidoDetalheRoutes } from "./pedidos.routes.js";
import { vendasRoutes } from "./vendas.routes.js";
import { pagamentoRoutes } from "./pagamento.routes.js";
import { paymentsRoutes } from "./payments.routes.js";

export default async function routes(app) {
  // auth / users / produtos (plugins Fastify)
  await app.register(authRoutes);
  await app.register(userRoutes);
  await app.register(produtoRoutes);

  // ecommerce (rotas diretas)
  await checkoutRoutes(app);
  await pedidosRoutes(app);
  await pedidoDetalheRoutes(app);
  await vendasRoutes(app);
  await pagamentoRoutes(app);
  await paymentsRoutes(app);
}
