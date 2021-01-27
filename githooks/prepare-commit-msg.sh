#!/bin/sh
#
# This script update the API documentation if needed,
# or warn if the developer has to do it

COMMIT_MSG_FILE=$1
API_DOC_TEXT=""

function updateAPIDocs() {
    cd "$(git rev-parse --show-toplevel)/../guacamole-api-docs" 2>/dev/null
    if [ "$?" -ne 0 ]; then
        API_DOC_TEXT="Unable to auto-update API documentation, think to do it yourself!!"
    else
        npm run build || exit 1
        API_DOC_TEXT="API Documentation updated regenerated, think to commit and push it!"
    fi
    cd -
}

if [ "$(git diff --name-only HEAD | grep "^server/controllers/")" != "" ]; then
    updateAPIDocs

    sed -i "1s/^/\n# $API_DOC_TEXT\n/" $COMMIT_MSG_FILE
fi
