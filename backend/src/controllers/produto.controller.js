import produtoService from "../services/produto.service.js";

class ProdutoController {
  async criarProduto(req, reply) {
    try {
      const userId = req.user?.id;
      if (!userId) return reply.code(401).send({ erro: "Não autenticado" });

      const produto = await produtoService.createProduto(userId, req.body || {});
      return reply.code(201).send(produto);
    } catch (err) {
      return reply.code(400).send({ erro: err.message });
    }
  }

  async listarProdutos(req, reply) {
    try {
      const produtos = await produtoService.listProdutosPublicos(req.query || {});
      return reply.send(produtos);
    } catch (err) {
      return reply.code(400).send({ erro: err.message });
    }
  }

  async buscarProduto(req, reply) {
    try {
      const produtoId = Number(req.params.id);
      if (!Number.isFinite(produtoId)) {
        return reply.code(400).send({ erro: "ID inválido" });
      }

      const produto = await produtoService.getProdutoById(produtoId);
      return reply.send(produto);
    } catch (err) {
      const code = err.message === "Produto não encontrado" ? 404 : 400;
      return reply.code(code).send({ erro: err.message });
    }
  }

  async atualizarProduto(req, reply) {
    try {
      const userId = req.user?.id;
      if (!userId) return reply.code(401).send({ erro: "Não autenticado" });

      const produtoId = Number(req.params.id);
      if (!Number.isFinite(produtoId)) {
        return reply.code(400).send({ erro: "ID inválido" });
      }

      const produto = await produtoService.updateProduto(userId, produtoId, req.body || {});
      return reply.send(produto);
    } catch (err) {
      const msg = err.message || "Erro ao atualizar produto";
      const code =
        msg === "Produto não encontrado" ? 404 : msg === "Sem permissão" ? 403 : 400;
      return reply.code(code).send({ erro: msg });
    }
  }

  async removerProduto(req, reply) {
    try {
      const userId = req.user?.id;
      if (!userId) return reply.code(401).send({ erro: "Não autenticado" });

      const produtoId = Number(req.params.id);
      if (!Number.isFinite(produtoId)) {
        return reply.code(400).send({ erro: "ID inválido" });
      }

      await produtoService.deleteProduto(userId, produtoId);
      return reply.send({ msg: "Produto removido" });
    } catch (err) {
      const msg = err.message || "Erro ao remover produto";
      const code =
        msg === "Produto não encontrado"
          ? 404
          : msg === "Sem permissão"
            ? 403
            : 400;
      return reply.code(code).send({ erro: msg });
    }
  }

  // mantém endpoint existente /produtos/:id/imagens
  async uploadImagens(req, reply) {
    try {
      const userId = req.user?.id;
      if (!userId) return reply.code(401).send({ erro: "Não autenticado" });

      const produtoId = Number(req.params.id);
      if (!Number.isFinite(produtoId)) {
        return reply.code(400).send({ erro: "ID inválido" });
      }

      const files = await req.files();
      const result = await produtoService.uploadImagensProduto(userId, produtoId, files);
      return reply.send(result);
    } catch (err) {
      const msg = err.message || "Erro no upload";
      const code = msg === "Sem permissão" ? 403 : 400;
      return reply.code(code).send({ erro: msg });
    }
  }
}

export default new ProdutoController();

