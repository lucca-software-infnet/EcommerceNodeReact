import { checkoutRoutes } from "./checkout.routes.js"
import { pedidosRoutes } from "./pedidos.routes.js"
import { vendasRoutes } from "./vendas.routes.js"
import { pagamentoRoutes } from "./pagamento.routes.js"

export async function registerRoutes(app) {
  checkoutRoutes(app)
  pedidosRoutes(app)
  vendasRoutes(app)
  pagamentoRoutes(app)
}
