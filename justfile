default:
  @just --list

install:
    yarn install

dev:
    docker compose -f backend/docker-compose.yml up db-init --wait
    DATABASE_CONNECTION_STRING="Server=localhost,1433;Database=obr-initiative-tracker-4d;User Id=sa;Password=Tracker@123;TrustServerCertificate=true;Encrypt=false" yarn workspace obr-initiative-tracker-4d-backend dev &
    yarn workspace obr-initiative-tracker-4d dev

dev-compose:
    docker compose -f backend/docker-compose.yml build --no-cache backend
    docker compose -f backend/docker-compose.yml up -d
    yarn workspace obr-initiative-tracker-4d dev

dev-client:
    yarn workspace obr-initiative-tracker-4d dev

dev-backend:
    docker compose -f backend/docker-compose.yml up db-init --wait
    DATABASE_CONNECTION_STRING="Server=localhost,1433;Database=obr-initiative-tracker-4d;User Id=sa;Password=Tracker@123;TrustServerCertificate=true;Encrypt=false" yarn workspace obr-initiative-tracker-4d-backend dev

dev-no-db:
    BACKEND_NO_DB=1 yarn workspace obr-initiative-tracker-4d-backend dev &
    yarn workspace obr-initiative-tracker-4d dev

dev-backend-no-db:
    BACKEND_NO_DB=1 yarn workspace obr-initiative-tracker-4d-backend dev