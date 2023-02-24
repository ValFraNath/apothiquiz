#!/bin/bash

docker compose up node --detach

if [ "$(git diff --name-only HEAD | grep "^server/")" != "" ]; then
    echo "Linting and formatting server files"
    docker compose exec --workdir "/app/server" --no-TTY node npm run format:write || exit 1
    docker compose exec --workdir "/app/server" --no-TTY node npm run lint:fix -- --max-warnings 0 || exit 1
fi

if [ "$(git diff --name-only HEAD | grep "^client/")" != "" ]; then
    echo "Linting and formatting client files"
    docker compose exec --workdir "/app/client" --no-TTY node npm run format:write || exit 1
    docker compose exec --workdir "/app/client" --no-TTY node npm run lint:fix -- --max-warnings 0 || exit 1
fi

exit 0
