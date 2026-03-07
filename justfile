set shell := ["cmd.exe", "/c"]

default:
  @just --list

install:
    yarn install

dev:
    start "backend" cmd /c "cd backend && yarn dev"
    cd client && yarn dev

dev-backend:
    cd backend && yarn dev