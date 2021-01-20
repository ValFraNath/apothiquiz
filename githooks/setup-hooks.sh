#!/bin/bash

function install_hook() {
    ln -s "$(pwd)/githooks/$1.sh" ".git/hooks/$1"
    chmod +x ".git/hooks/$1"
}

install_hook "pre-commit"
install_hook "post-merge"
