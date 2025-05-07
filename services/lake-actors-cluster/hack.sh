#!/bin/bash
set -e

actor=$1
tag=$2

cd ${actor}-actor
npx nx run lake-actors-cluster:build --actor="$actor"
cd ..
docker build -t fabiocaffarello/${actor}-actor:${tag} -f ./Dockerfile . --build-arg SERVICE_NAME=${actor}-actor
