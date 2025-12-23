import fs from "fs";
import path from "path";

/**
 * Mantém `prisma/schema.prisma` intacto (source-of-truth),
 * mas gera `prisma/schema.generated.prisma` compatível com o Prisma,
 * adicionando relações "opostas" que não alteram o banco/migrations.
 */

const root = process.cwd();
const srcPath = path.join(root, "prisma", "schema.prisma");
const outPath = path.join(root, "prisma", "schema.generated.prisma");

const src = fs.readFileSync(srcPath, "utf8");
const lines = src.split(/\r?\n/);

let inProduto = false;
let alreadyHas = false;
const out = [];

for (const line of lines) {
  if (line.startsWith("model Produto {")) {
    inProduto = true;
    alreadyHas = false;
    out.push(line);
    continue;
  }

  if (inProduto) {
    if (line.includes("EstoqueMovimento[]")) alreadyHas = true;

    // fecha model Produto
    if (line.startsWith("}")) {
      if (!alreadyHas) {
        out.push("");
        out.push("  // relação inversa para `EstoqueMovimento.produto` (não altera o BD)");
        out.push("  estoqueMovimentos EstoqueMovimento[]");
      }
      inProduto = false;
      out.push(line);
      continue;
    }
  }

  out.push(line);
}

fs.writeFileSync(outPath, out.join("\n"));
console.log(`[prisma] schema gerado em ${outPath}`);

