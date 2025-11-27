FROM node:20-alpine
WORKDIR /app
COPY .next ./.next
COPY package*.json ./
COPY public ./public
EXPOSE 3000
CMD ["npm", "start"]