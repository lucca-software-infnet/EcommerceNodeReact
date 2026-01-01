FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# garante Prisma Client compatível com o schema atual
RUN npx prisma generate
RUN node scripts/fix-prisma-client.cjs

EXPOSE 3333

CMD ["npm", "run", "dev"]
