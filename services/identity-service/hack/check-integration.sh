#!/bin/bash

set -o errexit
set -o nounset

set -x

source_dir="/app/services/identity-service"

run_cmd="go test -vet=off -timeout 60s -covermode=atomic -tags=integration -v"

if [ $# -eq 0 ]; then
  $run_cmd -p 1 ./...
  exit
fi

if [ $# -eq 1 ]; then
  path=$source_dir'/'$1
  echo "Running integration tests on path: $path"
  $run_cmd $path
  exit
fi

if [ $# -eq 2 ]; then
  path=$source_dir'/'$1
  testname=$2
  echo "Running integration tests on path: $path with test name: $testname"
  $run_cmd $path -testify.m ^$testname$
  exit
fi

echo "Invalid number of arguments. Usage: $0 [path] [testname]"
exit
