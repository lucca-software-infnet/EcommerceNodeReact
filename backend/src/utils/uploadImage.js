import fs from "fs";
import path from "path";
import { fileTypeFromBuffer } from "file-type";

/**
 * Upload seguro de imagem
 * @param {Object} options
 * @param {Buffer} options.buffer - Buffer da imagem
 * @param {string} options.uploadDir - Diretório de destino
 * @param {string} options.filename - Nome do arquivo
 * @param {boolean} options.overwrite - Se deve sobrescrever arquivo existente (default: false)
 */
export async function saveImage({
  buffer,
  uploadDir,
  filename,
  overwrite = false
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

  // Remove arquivo existente se overwrite for true
  if (overwrite && fs.existsSync(finalPath)) {
    await fs.promises.unlink(finalPath);
  }

  await fs.promises.writeFile(finalPath, buffer, {
    flag: overwrite ? "w" : "wx"
  });

  return {
    filename,
    mime: type.mime
  };
}
