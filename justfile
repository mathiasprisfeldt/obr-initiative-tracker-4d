default:
  @just --list

install:
    yarn install

dev:
    yarn workspace obr-initiative-tracker-4d-backend dev &
    yarn workspace obr-initiative-tracker-4d dev

dev-client:
    yarn workspace obr-initiative-tracker-4d dev

dev-backend:
    yarn workspace obr-initiative-tracker-4d-backend dev