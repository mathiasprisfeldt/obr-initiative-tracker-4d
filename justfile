set shell := ["cmd.exe", "/c"]

default:
  @just --list

install:
    cd client && yarn

dev:
    cd client && yarn dev