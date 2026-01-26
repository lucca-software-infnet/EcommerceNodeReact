// backend/src/controllers/produto.controller.js (SIMPLIFICADO)
import produtoService from "../services/produto.service.js";


class ProdutoController {
  async criarProduto(req, reply) {
    try {
      const vendedorId = req.user?.id;
      
      if (!vendedorId) {
        return reply.code(401).send({ 
          error: 'Não autenticado' 
        });
      }
      
      const produto = await produtoService.createProduto(vendedorId, req.body);
      
      return reply.code(201).send({
        success: true,
        message: 'Produto criado com sucesso',
        data: produto
      });
      
    } catch (error) {
      const status = error.statusCode || 400;
      return reply.code(status).send({
        error: error.message
      });
    }
  }
  
  async listarProdutos(req, reply) {
    try {
      const result = await produtoService.listProdutosPublicos(req.query);
      
      return reply.send({
        success: true,
        ...result
      });
      
    } catch (error) {
      const status = error.statusCode || 500;
      return reply.code(status).send({
        error: error.message
      });
    }
  }

  async sugestoes(req, reply) {
    try {
      const data = await produtoService.sugerirProdutos(req.query);
      return reply.send({
        success: true,
        data,
        count: data.length,
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return reply.code(status).send({
        error: error.message,
      });
    }
  }

  async listarAleatorios(req, reply) {
    try {
      const data = await produtoService.listarProdutosAleatorios(req.query);
      return reply.send({
        success: true,
        data,
        count: data.length,
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return reply.code(status).send({
        error: error.message,
      });
    }
  }

  async listarAleatorioPorDepartamento(req, reply) {
    try {
      const data = await produtoService.listarUmProdutoAleatorioPorDepartamento();
      return reply.send({
        success: true,
        data,
        count: data.length,
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return reply.code(status).send({
        error: error.message,
      });
    }
  }

  async buscarProdutos(req, reply) {
    try {
      const result = await produtoService.buscarProdutosPublicos(req.query);
      return reply.send({
        success: true,
        ...result,
      });
    } catch (error) {
      const status = error.statusCode || 500;
      return reply.code(status).send({
        error: error.message,
      });
    }
  }
  
  async buscarProduto(req, reply) {
    try {
      const { id } = req.params;
      const produto = await produtoService.getProdutoById(id);
      
      return reply.send({
        success: true,
        data: produto
      });
      
    } catch (error) {
      const status = error.statusCode || 404;
      return reply.code(status).send({
        error: error.message
      });
    }
  }
  
  async atualizarProduto(req, reply) {
    try {
      const { id } = req.params;
      const vendedorId = req.user?.id;
      
      if (!vendedorId) {
        return reply.code(401).send({ 
          error: 'Não autenticado' 
        });
      }
      
      const produto = await produtoService.updateProduto(id, vendedorId, req.body);
      
      return reply.send({
        success: true,
        message: 'Produto atualizado com sucesso',
        data: produto
      });
      
    } catch (error) {
      const status = error.statusCode || 400;
      return reply.code(status).send({
        error: error.message
      });
    }
  }
  
  async removerProduto(req, reply) {
    try {
      const { id } = req.params;
      const vendedorId = req.user?.id;
      
      if (!vendedorId) {
        return reply.code(401).send({ 
          error: 'Não autenticado' 
        });
      }
      
      const result = await produtoService.deleteProduto(id, vendedorId);
      
      return reply.send({
        success: true,
        ...result
      });
      
    } catch (error) {
      const status = error.statusCode || 400;
      return reply.code(status).send({
        error: error.message
      });
    }
  }
  
  async meusProdutos(req, reply) {
    try {
      const vendedorId = req.user?.id;
      
      if (!vendedorId) {
        return reply.code(401).send({ 
          error: 'Não autenticado' 
        });
      }
      
      const produtos = await produtoService.getProdutosByVendedor(vendedorId, req.query);
      
      return reply.send({
        success: true,
        data: produtos,
        count: produtos.length
      });
      
    } catch (error) {
      const status = error.statusCode || 500;
      return reply.code(status).send({
        error: error.message
      });
    }
  }
}

export default new ProdutoController();