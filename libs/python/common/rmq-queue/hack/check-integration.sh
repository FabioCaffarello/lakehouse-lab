#!/bin/sh

debugdir=/app/tests/debug

echo "User: $(whoami), uid: $1, gid: $2"

rm -rf $debugdir/*

change_file_owner() {
    chown -R $1:$2 $debugdir
}

if python -m unittest discover -s /app/tests/integration -p '*_test.py'; then
    echo "Integration tests passed"
    change_file_owner $1 $2
    exit 0
else
    echo "Integration tests failed"
    change_file_owner $1 $2
    exit 1
fi
