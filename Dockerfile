FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_BACKEND_URL=/
ARG VITE_ACL_ENABLE=true

ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_ACL_ENABLE=${VITE_ACL_ENABLE}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
