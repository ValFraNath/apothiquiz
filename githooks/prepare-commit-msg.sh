#!/bin/bash
#
# This script update the API documentation if needed,
# or warn if the developer has to do it

COMMIT_MSG_FILE=$1
API_DOC_TEXT=""

function updateAPIDocs() {
    if [ ! -d "../apothiquiz-api-docs" ]; then

        API_DOC_TEXT="Unable to auto-update API documentation, think to do it yourself!!"
        return
    fi

    ORIGINAL_FOLDER="$(pwd)"

    echo "Entering API repository"
    cd "../apothiquiz-api-docs" || exit 1
    npm run build || exit 1
    API_DOC_TEXT="API Documentation updated regenerated, think to commit and push it!"

    cd "$ORIGINAL_FOLDER" || exit 1
}

cd "$(git rev-parse --show-toplevel)" || exit 1
if [ "$(git diff --name-only HEAD | grep "^server/controllers/")" != "" ]; then
    updateAPIDocs

    sed -i "1s/^/\n# $API_DOC_TEXT\n/" "$COMMIT_MSG_FILE"
fi
