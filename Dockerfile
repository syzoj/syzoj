FROM node:16-bullseye
ENV NODE_ENV=production \
    SYZOJ_WEB_LISTEN_HOSTNAME=0.0.0.0 \
    SYZOJ_WEB_LISTEN_PORT=80

# Install OS dependencies
RUN apt-get update && \
    apt-get install -y p7zip-full python3-pygments clang-format

WORKDIR /app

# Install NPM dependencies
COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile --ignore-scripts

# Copy code and run post-install scripts
COPY . .
RUN yarn --frozen-lockfile

VOLUME ["/app/config", "/app/uploads", "/app/sessions"]

CMD ["app.js", "-c", "config/web.json"]
