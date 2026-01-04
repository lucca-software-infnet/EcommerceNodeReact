// backend/src/routes/produto.routes.js (AJUSTADO)
import path from "path";
import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import authMiddleware from "../middlewares/auth.middleware.js";
import { saveImage } from "../utils/uploadImage.js";
import produtoController from "../controllers/produto.controller.js";

export default async function produtoRoutes(app) {
  // ======================
  // 📄 ROTAS PÚBLICAS
  // ======================
  
  app.get("/produtos", produtoController.listarProdutos);
  
  app.get("/produtos/:id", produtoController.buscarProduto);
  
  // ======================
  // 🔐 ROTAS AUTENTICADAS
  // ======================
  
  // POST /produtos - Criar produto
  app.post("/produtos", {
    preHandler: [authMiddleware]
  }, produtoController.criarProduto);
  
  // PUT /produtos/:id - Atualizar produto
  app.put("/produtos/:id", {
    preHandler: [authMiddleware]
  }, produtoController.atualizarProduto);
  
  // DELETE /produtos/:id - Remover produto
  app.delete("/produtos/:id", {
    preHandler: [authMiddleware]
  }, produtoController.removerProduto);
  
  // GET /produtos/vendedor/meus - Meus produtos
  app.get("/produtos/vendedor/meus", {
    preHandler: [authMiddleware]
  }, produtoController.meusProdutos);
  
  // ======================
  // 🖼️ UPLOAD DE IMAGENS
  // ======================
  
  app.post("/produtos/:id/imagens", {
    preHandler: [authMiddleware],
    config: {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 6
      }
    }
  }, async (req, reply) => {
    try {
      const produtoId = Number(req.params.id);
      const userId = req.user.id;
      const isAdmin = req.user.ehAdmin === true;
      
      // Verifica permissão
      const produto = await app.prisma.produto.findFirst({
        where: { 
          id: produtoId,
          ...(isAdmin ? {} : { vendedorId: userId })
        },
        select: { id: true, vendedorId: true }
      });
      
      if (!produto) {
        return reply.code(403).send({ 
          error: "Sem permissão para adicionar imagens a este produto" 
        });
      }
      
      // Verifica limite de imagens
      const totalImagens = await app.prisma.imagemProduto.count({
        where: { produtoId }
      });
      
      if (totalImagens >= 10) {
        return reply.code(400).send({
          error: "Limite máximo de 10 imagens por produto atingido"
        });
      }
      
      const files = await req.files();
      const uploadDir = path.join("uploads", "products", String(produtoId));
      
      // Cria diretório
      await fs.mkdir(uploadDir, { recursive: true });
      
      const imagensSalvas = [];
      
      for await (const file of files) {
        // Valida tipo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
          throw new Error(`Tipo de arquivo não permitido: ${file.mimetype}`);
        }
        
        // Gera nome único
        const buffer = await file.toBuffer();
        const hash = randomBytes(8).toString('hex');
        const ext = file.filename.includes('.') 
          ? path.extname(file.filename) 
          : '.jpg';
        const filename = `${hash}${ext}`;
        
        // Salva imagem
        await saveImage({
          buffer,
          filepath: path.join(uploadDir, filename),
          quality: 85
        });
        
        // Salva no banco
        const imagem = await app.prisma.imagemProduto.create({
          data: {
            nomeArquivo: filename,
            produtoId
          }
        });
        
        imagensSalvas.push({
          id: imagem.id,
          url: `/uploads/products/${produtoId}/${filename}`,
          nomeArquivo: filename
        });
      }
      
      return reply.send({
        success: true,
        message: `${imagensSalvas.length} imagem(ns) salva(s) com sucesso`,
        data: imagensSalvas
      });
      
    } catch (error) {
      return reply.code(400).send({
        error: error.message || "Erro ao fazer upload das imagens"
      });
    }
  });
}