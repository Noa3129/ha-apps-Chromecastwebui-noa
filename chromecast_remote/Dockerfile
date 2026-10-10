FROM node:22-alpine
WORKDIR /app
COPY app/ /app/
ENV PORT=9090
ENV HA_APP_MODE=true
EXPOSE 9090
CMD ["node", "server.mjs"]
