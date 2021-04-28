#!/bin/bash

function install_hook() {
    ln -s "../../githooks/$1.sh" ".git/hooks/$1"
    chmod +x ".git/hooks/$1"
}

install_hook "pre-commit"
install_hook "post-merge"
install_hook "prepare-commit-msg"

echo
echo 'All hooks linked to .git/hooks/_hook_name_'
echo 'To update them, modify files in ./githooks/'
echo 'To disable them in your local repository, remove the symbolic links in .git/hooks/'
