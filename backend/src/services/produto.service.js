// backend/src/services/produto.service.js (AJUSTADO PARA SEU SCHEMA)
import { prisma } from "../config/prisma.js";


// ======================
// 🛠️ UTILITÁRIOS (mantém os mesmos)
// ======================

function asInt(value, field) {
  if (value === undefined || value === null) {
    throw new Error(`${field} é obrigatório`);
  }
  
  const num = Number(value);
  if (!Number.isInteger(num) || !Number.isFinite(num)) {
    throw new Error(`${field} deve ser um número inteiro válido`);
  }
  
  return num;
}

function asNonNegativeInt(value, field) {
  const num = asInt(value, field);
  if (num < 0) {
    throw new Error(`${field} não pode ser negativo`);
  }
  return num;
}

function asMoney(value, field) {
  if (value === undefined || value === null) {
    throw new Error(`${field} é obrigatório`);
  }
  
  const num = typeof value === 'string' 
    ? parseFloat(value.replace(',', '.'))
    : Number(value);
    
  if (!Number.isFinite(num)) {
    throw new Error(`${field} deve ser um valor numérico`);
  }
  
  if (num < 0) {
    throw new Error(`${field} não pode ser negativo`);
  }
  
  return num.toFixed(2);
}

function normalizeString(value, field, allowEmpty = false) {
  if (value === undefined || value === null) {
    if (!allowEmpty) throw new Error(`${field} é obrigatório`);
    return null;
  }
  
  const str = String(value).trim();
  if (!allowEmpty && str.length === 0) {
    throw new Error(`${field} não pode ser vazio`);
  }
  
  return str.length > 0 ? str : null;
}

function asOptionalDate(value) {
  if (value === undefined || value === null) return null;
  
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error('Data inválida');
  }
  
  return date;
}

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

// ======================
// 📊 SELECTS E DTOs (AJUSTADOS PARA SEU SCHEMA)
// ======================

const PRODUTO_SELECT = {
  id: true,
  codigoBarra: true,
  descricao: true,
  validade: true,
  volume: true,
  quantidade: true,
  precoCusto: true,
  precoVenda: true,
  marca: true,
  departamento: true,
  dataRegistro: true,
  vendedorId: true,
  vendedor: {
    select: {
      id: true,
      nome: true,
      sobrenome: true,
      imagem: true,
      email: true
    }
  },
  imagens: {
    select: {
      id: true,
      nomeArquivo: true
    }
  }
};

function toProdutoDTO(produto, baseUrl = '/uploads/products') {
  if (!produto) return null;
  
  return {
    id: produto.id,
    codigoBarra: produto.codigoBarra,
    descricao: produto.descricao,
    validade: produto.validade,
    volume: produto.volume,
    quantidade: produto.quantidade,
    precoCusto: produto.precoCusto,
    precoVenda: produto.precoVenda,
    marca: produto.marca,
    departamento: produto.departamento,
    dataRegistro: produto.dataRegistro,
    vendedor: produto.vendedor,
    imagens: produto.imagens.map(img => ({
      id: img.id,
      url: `${baseUrl}/${produto.id}/${img.nomeArquivo}`,
      nomeArquivo: img.nomeArquivo
    }))
  };
}

// ======================
// 🏪 SERVIÇO PRINCIPAL (AJUSTADO)
// ======================

class ProdutoService {
  
  /**
   * Registra movimento de estoque
   */
  async registrarMovimentoEstoque(tx, { produtoId, tipo, quantidade, observacao = null }) {
    const produto = await tx.produto.findUnique({
      where: { id: produtoId },
      select: { id: true, quantidade: true }
    });
    
    if (!produto) {
      throw new AppError('Produto não encontrado', 404);
    }
    
    const qtd = asNonNegativeInt(quantidade, 'Quantidade do movimento');
    
    if (!['ENTRADA', 'SAIDA'].includes(tipo)) {
      throw new AppError('Tipo de movimento inválido', 400);
    }
    
    if (tipo === 'SAIDA' && produto.quantidade < qtd) {
      throw new AppError('Estoque insuficiente', 400);
    }
    
    return tx.estoqueMovimento.create({
      data: {
        produtoId,
        tipo,
        quantidade: qtd,
        data: new Date()
      }
    });
  }
  
  /**
   * Cria novo produto
   */
  async createProduto(vendedorId, data) {
    try {
      // Validação do vendedor
      const vendedor = await prisma.usuario.findUnique({
        where: { id: vendedorId }
      });
      
      if (!vendedor) {
        throw new AppError('Vendedor não encontrado', 404);
      }
      
      // Validação dos dados
      const codigoBarra = normalizeString(data.codigoBarra, 'Código de barras');
      const descricao = normalizeString(data.descricao, 'Descrição');
      const departamento = normalizeString(data.departamento, 'Departamento');
      const marca = normalizeString(data.marca, 'Marca', true);
      
      const volume = asNonNegativeInt(data.volume, 'Volume');
      const quantidade = data.quantidade !== undefined 
        ? asNonNegativeInt(data.quantidade, 'Quantidade inicial')
        : 0;
      
      const precoCusto = asMoney(data.precoCusto, 'Preço de custo');
      const precoVenda = asMoney(data.precoVenda, 'Preço de venda');
      
      // Validação de negócio
      if (parseFloat(precoVenda) < parseFloat(precoCusto)) {
        throw new AppError('Preço de venda não pode ser menor que o custo', 400);
      }
      
      const validade = asOptionalDate(data.validade);
      
      // Criação com transação
      const produto = await prisma.$transaction(async (tx) => {
        // Verifica se código de barras já existe
        const existe = await tx.produto.findUnique({
          where: { codigoBarra },
          select: { id: true }
        });
        
        if (existe) {
          throw new AppError('Código de barras já cadastrado', 409);
        }
        
        // Cria produto
        const novoProduto = await tx.produto.create({
          data: {
            codigoBarra,
            descricao,
            validade,
            volume,
            quantidade,
            precoCusto,
            precoVenda,
            marca,
            departamento,
            vendedorId
          },
          select: PRODUTO_SELECT
        });
        
        // Registra movimento inicial de estoque
        if (quantidade > 0) {
          await this.registrarMovimentoEstoque(tx, {
            produtoId: novoProduto.id,
            tipo: 'ENTRADA',
            quantidade
          });
        }
        
        return novoProduto;
      });
      
      return toProdutoDTO(produto);
      
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      // Tratamento de erros do Prisma
      if (error.code === 'P2002') {
        throw new AppError('Código de barras já cadastrado', 409);
      }
      
      throw new AppError('Erro ao criar produto: ' + error.message, 500);
    }
  }
  
  /**
   * Lista produtos públicos
   */
  async listProdutosPublicos(filters = {}) {
    try {
      const page = Math.max(asNonNegativeInt(filters.page || 1, 'Página'), 1);
      const limit = Math.min(Math.max(asNonNegativeInt(filters.limit || 20, 'Limite'), 1), 100);
      const skip = (page - 1) * limit;
      
      // Constrói WHERE clause
      const where = {
        quantidade: { gt: 0 } // Apenas produtos com estoque
      };
      
      // Filtros
      if (filters.q) {
        const busca = normalizeString(filters.q, 'Termo de busca', true);
        where.OR = [
          { descricao: { contains: busca } },
          { codigoBarra: { contains: busca } },
          { departamento: { contains: busca } },
          { marca: { contains: busca } }
        ];
      }
      
      if (filters.departamento) {
        where.departamento = normalizeString(filters.departamento, 'Departamento', true);
      }
      
      if (filters.marca) {
        where.marca = normalizeString(filters.marca, 'Marca', true);
      }
      
      if (filters.vendedorId) {
        where.vendedorId = asInt(filters.vendedorId, 'ID do vendedor');
      }
      
      // Executa queries
      const [total, produtos] = await Promise.all([
        prisma.produto.count({ where }),
        prisma.produto.findMany({
          where,
          orderBy: { dataRegistro: 'desc' },
          skip,
          take: limit,
          select: PRODUTO_SELECT
        })
      ]);
      
      return {
        metadata: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        data: produtos.map(p => toProdutoDTO(p))
      };
      
    } catch (error) {
      throw new AppError('Erro ao listar produtos: ' + error.message, 500);
    }
  }
  
  /**
   * Busca produto por ID
   */
  async getProdutoById(id) {
    try {
      const produtoId = asInt(id, 'ID do produto');
      
      const produto = await prisma.produto.findUnique({
        where: { id: produtoId },
        select: PRODUTO_SELECT
      });
      
      if (!produto) {
        throw new AppError('Produto não encontrado', 404);
      }
      
      return toProdutoDTO(produto);
      
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Erro ao buscar produto', 500);
    }
  }
  
  /**
   * Atualiza produto
   */
  async updateProduto(id, vendedorId, data) {
    try {
      const produtoId = asInt(id, 'ID do produto');
      const usuarioId = asInt(vendedorId, 'ID do vendedor');
      
      // Verifica se produto existe
      const produto = await prisma.produto.findUnique({
        where: { id: produtoId },
        select: { 
          id: true, 
          vendedorId: true, 
          quantidade: true,
          precoCusto: true,
          precoVenda: true
        }
      });
      
      if (!produto) {
        throw new AppError('Produto não encontrado', 404);
      }
      
      // Verifica permissão
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId }
      });
      
      if (!usuario) {
        throw new AppError('Usuário não encontrado', 404);
      }
      
      const isAdmin = usuario.ehAdmin === true;
      const isOwner = produto.vendedorId === usuarioId;
      
      if (!isAdmin && !isOwner) {
        throw new AppError('Sem permissão para editar este produto', 403);
      }
      
      // Prepara dados para atualização
      const updateData = {};
      
      if (data.codigoBarra !== undefined) {
        const codigoBarra = normalizeString(data.codigoBarra, 'Código de barras');
        
        // Verifica unicidade
        if (codigoBarra !== produto.codigoBarra) {
          const existe = await prisma.produto.findUnique({
            where: { codigoBarra },
            select: { id: true }
          });
          
          if (existe) {
            throw new AppError('Código de barras já está em uso', 409);
          }
        }
        
        updateData.codigoBarra = codigoBarra;
      }
      
      if (data.descricao !== undefined) {
        updateData.descricao = normalizeString(data.descricao, 'Descrição');
      }
      
      if (data.departamento !== undefined) {
        updateData.departamento = normalizeString(data.departamento, 'Departamento');
      }
      
      if (data.marca !== undefined) {
        updateData.marca = normalizeString(data.marca, 'Marca', true);
      }
      
      if (data.validade !== undefined) {
        updateData.validade = asOptionalDate(data.validade);
      }
      
      if (data.volume !== undefined) {
        updateData.volume = asNonNegativeInt(data.volume, 'Volume');
      }
      
      // Validações de preço
      if (data.precoCusto !== undefined || data.precoVenda !== undefined) {
        const novoPrecoCusto = data.precoCusto !== undefined 
          ? asMoney(data.precoCusto, 'Preço de custo') 
          : produto.precoCusto;
        
        const novoPrecoVenda = data.precoVenda !== undefined 
          ? asMoney(data.precoVenda, 'Preço de venda') 
          : produto.precoVenda;
        
        if (parseFloat(novoPrecoVenda) < parseFloat(novoPrecoCusto)) {
          throw new AppError('Preço de venda não pode ser menor que o custo', 400);
        }
        
        if (data.precoCusto !== undefined) updateData.precoCusto = novoPrecoCusto;
        if (data.precoVenda !== undefined) updateData.precoVenda = novoPrecoVenda;
      }
      
      // Atualização de estoque
      const novaQuantidade = data.quantidade !== undefined
        ? asNonNegativeInt(data.quantidade, 'Quantidade')
        : undefined;
      
      // Executa atualização com transação
      const produtoAtualizado = await prisma.$transaction(async (tx) => {
        // Atualiza produto
        const updated = await tx.produto.update({
          where: { id: produtoId },
          data: updateData,
          select: PRODUTO_SELECT
        });
        
        // Atualiza estoque se quantidade mudou
        if (novaQuantidade !== undefined && novaQuantidade !== produto.quantidade) {
          const diferenca = novaQuantidade - produto.quantidade;
          
          if (diferenca !== 0) {
            await this.registrarMovimentoEstoque(tx, {
              produtoId,
              tipo: diferenca > 0 ? 'ENTRADA' : 'SAIDA',
              quantidade: Math.abs(diferenca)
            });
            
            // Atualiza quantidade
            await tx.produto.update({
              where: { id: produtoId },
              data: { quantidade: novaQuantidade }
            });
            
            updated.quantidade = novaQuantidade;
          }
        }
        
        return updated;
      });
      
      return toProdutoDTO(produtoAtualizado);
      
    } catch (error) {
      if (error instanceof AppError) throw error;
      
      if (error.code === 'P2002') {
        throw new AppError('Código de barras já cadastrado', 409);
      }
      
      throw new AppError('Erro ao atualizar produto: ' + error.message, 500);
    }
  }
  
  /**
   * Remove produto
   */
  async deleteProduto(id, vendedorId) {
    try {
      const produtoId = asInt(id, 'ID do produto');
      const usuarioId = asInt(vendedorId, 'ID do vendedor');
      
      // Verifica se produto existe
      const produto = await prisma.produto.findUnique({
        where: { id: produtoId },
        select: { 
          id: true, 
          vendedorId: true
        }
      });
      
      if (!produto) {
        throw new AppError('Produto não encontrado', 404);
      }
      
      // Verifica permissão
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId }
      });
      
      if (!usuario) {
        throw new AppError('Usuário não encontrado', 404);
      }
      
      const isAdmin = usuario.ehAdmin === true;
      const isOwner = produto.vendedorId === usuarioId;
      
      if (!isAdmin && !isOwner) {
        throw new AppError('Sem permissão para remover este produto', 403);
      }
      
      // Verifica se produto tem compras associadas
      const temCompras = await prisma.compraItem.count({
        where: { produtoId }
      }) > 0;
      
      if (temCompras) {
        throw new AppError(
          'Não é possível remover produto com histórico de compras',
          409
        );
      }
      
      // Remove (hard delete) porque seu schema não tem campo ativo
      await prisma.$transaction(async (tx) => {
        // Remove imagens
        await tx.imagemProduto.deleteMany({
          where: { produtoId }
        });
        
        // Remove movimentos de estoque
        await tx.estoqueMovimento.deleteMany({
          where: { produtoId }
        });
        
        // Remove itens do carrinho
        await tx.itemCarrinho.deleteMany({
          where: { produtoId }
        });
        
        // Remove produto
        await tx.produto.delete({
          where: { id: produtoId }
        });
      });
      
      return { 
        success: true, 
        message: 'Produto removido com sucesso',
        produtoId
      };
      
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Erro ao remover produto: ' + error.message, 500);
    }
  }
  
  /**
   * Busca produtos por vendedor
   */
  async getProdutosByVendedor(vendedorId, filters = {}) {
    try {
      const id = asInt(vendedorId, 'ID do vendedor');
      
      const where = {
        vendedorId: id
      };
      
      const produtos = await prisma.produto.findMany({
        where,
        orderBy: { dataRegistro: 'desc' },
        select: PRODUTO_SELECT
      });
      
      return produtos.map(p => toProdutoDTO(p));
      
    } catch (error) {
      throw new AppError('Erro ao buscar produtos do vendedor', 500);
    }
  }
}

export default new ProdutoService();