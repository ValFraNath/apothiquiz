#!/bin/bash

HELP="Setup script for Apothiquiz dev environment
Available commands:
	- start: Start docker containers and run server and client in watch mode
	- stop-docker: Stop docker containers
	- nuke: Remove all developement data
"
DC="docker compose --file docker-compose.dev.yml"

# -----------------------------------------------------------------------------
#                                  FUNCTIONS
# -----------------------------------------------------------------------------
fail() {
	echo "Error. Exiting."
	exit 1
}

check_system_dependencies() {
	HELP_MESSAGE="Please refer to the developer documentation to find how to install the required dependencies: https://github.com/ValFraNath/apothiquiz/wiki/Developer-setup."

	echo "Checking system dependencies..."
	DEPS=("node" "npm" "docker")

	for DEP in "${DEPS[@]}"; do
		if ! command -v "$DEP" >/dev/null 2>&1; then
			echo "$DEP dependency is missing."
			echo "$HELP_MESSAGE"
			exit 1
		fi
	done

	# TODO check docker compose
	# if ! command -v "docker-compose" >/dev/null 2>&1 && ! command -v "docker compose" >/dev/null 2>&1; then
	# 	printf "docker dependency is missing.\n%s" "$HELP_MESSAGE";
	# 	exit 1;
	# fi

	if ! [ -f "dev.env" ]; then
		echo "Missing dev.env file, creating with default values from .env.example"
		echo "Feel free to edit these to match your dev environment"
		cp ".env.example" "dev.env" || fail
		echo
	fi
}

check_npm_dependencies() {
	echo "Checking npm dependencies..."
	for DIR in "client" "server"; do
		cd "$DIR" || fail
		if ! [ -d "node_modules" ]; then
			echo "Installing npm dependencies in $DIR"
			npm install
		fi

		cd - || fail
	done
}

start_docker() {
	$DC up --detach

	until [ "$(docker inspect -f '{{.State.Health.Status}}' "$($DC ps -q mariadb)")" == "healthy" ]; do
		echo "Waiting for mariadb to be ready..."
		sleep 2
	done
}

stop_docker() {
	$DC down
}

run_server() {
	cd "./server/" || fail
	npm run start:watch
}

run_client() {
	cd "./client/" || fail
	npm run start | tee
}

# -----------------------------------------------------------------------------
#                               ACTUAL SCRIPT
# -----------------------------------------------------------------------------

if [ -z "$1" ]; then
	echo "$HELP"
	exit 0
fi

case "$1" in
"start")
	check_system_dependencies
	check_npm_dependencies
	start_docker
	run_server &
	run_client &

	# Stop when using ctrl+c
	wait
	wait
	exit 0
	;;

"stop-docker")
	stop_docker
	exit 0
	;;

"nuke")
	read -p "Do you want to remove all your development data (including database)? [yN] " -n 1 -r
	echo # newline
	if [[ "$REPLY" =~ ^[YyOo]$ ]]; then
		$DC down --volumes
		echo "Removing client/node_modules" && rm -rf client/node_modules
		echo "Removing server/node_modules" && rm -rf server/node_modules
		echo "Removing dev.env" && rm -r dev.env
	fi
	exit 0
	;;

"help|*")
	echo "$HELP"
	exit 0
	;;

esac
