default:
  @just --list

install:
    yarn install

dev:
    docker compose -f backend/docker-compose.yml up -d
    DATABASE_CONNECTION_STRING=postgresql://tracker:tracker@localhost:5432/tracker yarn workspace obr-initiative-tracker-4d-backend dev &
    yarn workspace obr-initiative-tracker-4d dev

dev-client:
    yarn workspace obr-initiative-tracker-4d dev

dev-backend:
    docker compose -f backend/docker-compose.yml up -d
    DATABASE_CONNECTION_STRING=postgresql://tracker:tracker@localhost:5432/tracker yarn workspace obr-initiative-tracker-4d-backend dev