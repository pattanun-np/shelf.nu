# base node image
FROM node:20-bookworm-slim as base

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl && apt-get install -y python3 && apt-get install -y build-essential    

WORKDIR /myapp

ADD package.json ./

ADD . .

RUN npm install 

RUN npm install dotenv

RUN npm install --os=linux --cpu=x64 sharp

RUN npm prune 

RUN npx prisma generate

ENV NODE_ENV="production"

ENV PORT="3000"

USER root 

EXPOSE 3000

CMD ["npm", "run", "dev"]