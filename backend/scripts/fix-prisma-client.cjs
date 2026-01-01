/* eslint-disable no-console */
/**
 * Prisma Client (npm) expects a symlink:
 *   node_modules/@prisma/client/.prisma -> ../.prisma
 *
 * Em alguns ambientes esse symlink não é criado automaticamente,
 * causando erro: "Cannot find module '.prisma/client/default'".
 *
 * Esse script cria o symlink de forma idempotente.
 */

const fs = require("fs");
const path = require("path");

function exists(p) {
  try {
    fs.lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

const projectRoot = path.resolve(__dirname, "..");
const prismaClientPkgDir = path.join(projectRoot, "node_modules", "@prisma", "client");
const linkPath = path.join(prismaClientPkgDir, ".prisma");
const targetPath = path.join(projectRoot, "node_modules", ".prisma");

if (!exists(prismaClientPkgDir)) {
  process.exit(0);
}

if (exists(linkPath)) {
  process.exit(0);
}

if (!exists(targetPath)) {
  // Ainda não houve "prisma generate"; nada a fazer.
  process.exit(0);
}

const relativeTarget = path.relative(prismaClientPkgDir, targetPath);

try {
  fs.symlinkSync(relativeTarget, linkPath, "dir");
  console.log("[prisma] fixed symlink @prisma/client/.prisma ->", relativeTarget);
} catch (err) {
  console.warn("[prisma] could not create symlink:", err?.message || err);
  process.exit(0);
}

