# Frontend Dockerfile
FROM node:20-alpine
WORKDIR /app

# Copia pacotes e build pronto do frontend
COPY frontend/package*.json ./
COPY frontend/node_modules ./node_modules
COPY frontend/.next ./.next
COPY frontend/public ./public

EXPOSE 3000

# Inicializa a aplicação
CMD ["npm", "start"]
