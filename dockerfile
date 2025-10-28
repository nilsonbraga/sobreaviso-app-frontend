# build stage
FROM node:22 as build-stage
WORKDIR /app
COPY package*.json ./
RUN yarn install -D
ENV NODE_ENV=production
COPY . .
RUN yarn build

# production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html/faaep
COPY ./docker/default.conf /etc/nginx/conf.d/
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
