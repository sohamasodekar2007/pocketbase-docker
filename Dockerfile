FROM alpine:3.18

WORKDIR /pb

# Create pb_data directory and set correct permissions
RUN mkdir -p /pb/pb_data && \
    chown -R 1000:1000 /pb/pb_data

# Install dependencies (added bash for better signal handling)
RUN apk add --no-cache curl unzip ca-certificates bash

# Download specific version (replace with latest as needed)
ENV PB_VERSION=0.22.4
RUN curl -fLsS https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip -o pb.zip && \
    unzip pb.zip && \
    rm pb.zip && \
    chmod +x /pb/pocketbase && \
    # Create a non-root user for security
    adduser -D -u 1000 pocketbase

# Explicit volume declaration (better practice)
VOLUME ["/pb/pb_data"]

# Run as non-root user
USER pocketbase

# Health check endpoint (optional but recommended)
HEALTHCHECK --interval=30s --timeout=5s \
    CMD curl -f http://localhost:8090/api/health || exit 1

EXPOSE 8090

# Use exec form with bash for better signal handling
CMD ["/bin/bash", "-c", "./pocketbase serve --http=0.0.0.0:8090"]
