#!/bin/bash

docker compose up node --detach

function changed() {
    git diff --name-only 'HEAD@{1}' HEAD | grep "^$1" >/dev/null 2>&1
}

if changed 'server/package-lock.json'; then
    echo "📦 server/package-lock.json changed. Running npm install"
    docker compose exec --workdir "/app/server" --no-TTY node npm install  || exit 1
fi

if changed 'client/package-lock.json'; then
    echo "📦 client/package-lock.json changed. Running npm install"
    docker compose exec --workdir "/app/client" --no-TTY node npm install  || exit 1
fi

exit 0
