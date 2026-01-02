import produtoService from "../services/produto.service.js";

function statusFromError(err) {
  const s = Number(err?.statusCode);
  if (Number.isFinite(s) && s >= 400 && s <= 599) return s;
  return null;
}

class ProdutoController {
  async criarProduto(req, reply) {
    try {
      const vendedorId = req.user?.id;
      const produto = await produtoService.createProduto(vendedorId, req.body || {});
      return reply.code(201).send(produto);
    } catch (err) {
      return reply.code(statusFromError(err) || 400).send({ erro: err.message });
    }
  }

  async listarProdutos(req, reply) {
    try {
      const result = await produtoService.listProdutosPublicos(req.query || {});
      return reply.send(result);
    } catch (err) {
      return reply.code(statusFromError(err) || 400).send({ erro: err.message });
    }
  }

  async buscarProduto(req, reply) {
    try {
      const id = req.params?.id;
      const produto = await produtoService.getProdutoById(id);
      return reply.send(produto);
    } catch (err) {
      return reply.code(statusFromError(err) || 400).send({ erro: err.message });
    }
  }

  async atualizarProduto(req, reply) {
    try {
      const vendedorId = req.user?.id;
      const id = req.params?.id;
      const produto = await produtoService.updateProduto(id, vendedorId, req.body || {});
      return reply.send(produto);
    } catch (err) {
      return reply.code(statusFromError(err) || 400).send({ erro: err.message });
    }
  }

  async removerProduto(req, reply) {
    try {
      const vendedorId = req.user?.id;
      const id = req.params?.id;
      const result = await produtoService.deleteProduto(id, vendedorId);
      return reply.send(result);
    } catch (err) {
      return reply.code(statusFromError(err) || 400).send({ erro: err.message });
    }
  }
}

export default new ProdutoController();

