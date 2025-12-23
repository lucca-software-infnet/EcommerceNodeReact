import fs from "fs";
import path from "path";
import { fileTypeFromBuffer } from "file-type";

/**
 * Upload seguro de imagem
 */
export async function saveImage({
  buffer,
  uploadDir,
  filename
}) {
  const resolvedDir = path.resolve(uploadDir);

  // garante que é imagem REAL
  const type = await fileTypeFromBuffer(buffer);

  if (!type || !["image/jpeg", "image/png", "image/webp"].includes(type.mime)) {
    throw new Error("Formato de imagem inválido");
  }

  // garante que o diretório existe
  if (!fs.existsSync(resolvedDir)) {
    fs.mkdirSync(resolvedDir, { recursive: true });
  }

  const finalPath = path.join(resolvedDir, filename);

  // path traversal protection
  if (!finalPath.startsWith(resolvedDir)) {
    throw new Error("Path inválido");
  }

  await fs.promises.writeFile(finalPath, buffer, {
    flag: "wx" // não sobrescreve
  });

  return {
    filename,
    mime: type.mime
  };
}
