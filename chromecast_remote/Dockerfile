FROM node:22-alpine
WORKDIR /app
COPY app/ /app/
ENV PORT=8099
ENV HA_APP_MODE=true
EXPOSE 8099
CMD ["node", "server.mjs"]
