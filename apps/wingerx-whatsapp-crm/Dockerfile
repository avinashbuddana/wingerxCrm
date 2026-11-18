# WingerX WhatsApp CRM: pinned upstream Whatomate source + WingerX UI patch.
# This is a source-based derivative; upstream AGPL-3.0 obligations apply.
FROM node:22-alpine AS frontend
RUN apk add --no-cache git python3 ca-certificates
ARG WHATOMATE_REF=88b0e856e8d2e111833a76bdaf4c3e0351768211
RUN mkdir -p /src && cd /src && git init -q && git remote add origin https://github.com/shridarpatil/whatomate.git \
    && git fetch --depth 1 origin "$WHATOMATE_REF" && git checkout -q --detach FETCH_HEAD
COPY wingerx.css wingerx-mark.svg /tmp/wingerx-assets/
COPY apply_branding.py /tmp/apply_branding.py
RUN python3 /tmp/apply_branding.py /src
RUN cd /src/frontend && npm ci --no-audit --no-fund && npm run build

FROM golang:1.26.0-alpine AS backend
RUN apk add --no-cache git ca-certificates
ARG WHATOMATE_REF=88b0e856e8d2e111833a76bdaf4c3e0351768211
RUN mkdir -p /src && cd /src && git init -q && git remote add origin https://github.com/shridarpatil/whatomate.git \
    && git fetch --depth 1 origin "$WHATOMATE_REF" && git checkout -q --detach FETCH_HEAD
RUN rm -rf /src/internal/frontend/dist && mkdir -p /src/internal/frontend/dist
COPY --from=frontend /src/frontend/dist/ /src/internal/frontend/dist/
RUN cd /src && CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/whatomate ./cmd/whatomate

FROM alpine:3.21
RUN apk add --no-cache ca-certificates tzdata ffmpeg
WORKDIR /app
RUN mkdir -p /app/uploads /app/audio
COPY --from=backend /out/whatomate /app/whatomate
COPY config.toml /app/config.toml
COPY render-start.sh /app/render-start.sh
RUN chmod 0755 /app/render-start.sh
EXPOSE 8080
ENTRYPOINT ["/app/render-start.sh"]
