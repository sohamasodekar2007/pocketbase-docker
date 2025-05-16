FROM alpine:3.18

WORKDIR /pb

RUN apk add --no-cache curl unzip ca-certificates

RUN curl -L https://github.com/pocketbase/pocketbase/releases/latest/download/pocketbase_0.20.1_linux_amd64.zip -o pb.zip && \
    unzip pb.zip && rm pb.zip && \
    chmod +x pocketbase

EXPOSE 8090

CMD ["./pocketbase", "serve", "--http=0.0.0.0:8090"]
