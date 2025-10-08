FROM node:20-bullseye

WORKDIR /app
ENV NODE_ENV=development
ENV NODE_OPTIONS=--dns-result-order=ipv4first
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm","run","dev"]
