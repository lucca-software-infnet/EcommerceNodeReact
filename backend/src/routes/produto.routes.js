import path from "path";
import authMiddleware from "../middlewares/auth.middleware.js";
import { saveImage } from "../utils/uploadImage.js";
import produtoController from "../controllers/produto.controller.js";

export default async function produtoRoutes(app) {
  // ======================
  // 🌐 PÚBLICAS
  // ======================
  app.get("/produtos", produtoController.listarProdutos);
  app.get("/produtos/:id", produtoController.buscarProduto);

  // ======================
  // 🔒 PROTEGIDAS
  // ======================
  app.post("/produtos", { preHandler: authMiddleware }, produtoController.criarProduto);
  app.put(
    "/produtos/:id",
    { preHandler: authMiddleware },
    produtoController.atualizarProduto
  );
  app.delete(
    "/produtos/:id",
    { preHandler: authMiddleware },
    produtoController.removerProduto
  );

  app.post(
    "/produtos/:id/imagens",
    {
      preHandler: authMiddleware,
      config: {
        limits: {
          files: 6
        }
      }
    },
    async (req, reply) => {

      const produtoId = Number(req.params.id);
      const userId = req.user.id;

      const produto = await app.prisma.produto.findFirst({
        where: { id: produtoId, vendedorId: userId }
      });

      if (!produto) {
        return reply.code(403).send({ error: "Sem permissão" });
      }

      const files = await req.files();
      const uploadDir = path.join("uploads", "products", String(produtoId));

      let index = 1;
      const imagens = [];

      for await (const file of files) {

        const buffer = await file.toBuffer();
        const filename = `${index}.jpg`;

        await saveImage({
          buffer,
          uploadDir,
          filename
        });

        await app.prisma.imagemProduto.create({
          data: {
            nomeArquivo: filename,
            produtoId
          }
        });

        imagens.push(`/uploads/products/${produtoId}/${filename}`);
        index++;
      }

      return { imagens };
    }
  );
}
