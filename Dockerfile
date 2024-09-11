# Install deps
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn 

# Build from source
FROM deps AS builder

WORKDIR /app

COPY . .

RUN yarn build

# Copy app dist and config to NginX folder 
FROM nginx:1.20

COPY --from=builder /app/dist /usr/share/nginx/html

RUN cd /etc/nginx/conf.d && rm -rf *

COPY ./nginx.conf /etc/nginx/conf.d
COPY ./start_with_env.sh /

EXPOSE 80

CMD ["sh", "start_with_env.sh"]
