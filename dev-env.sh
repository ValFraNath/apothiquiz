#!/bin/bash

HELP="Setup script for Apothiquiz dev environment
Available commands:
	- start: Start docker containers and run server and client in watch mode
	- stop-docker: Stop docker containers
	- test: Launch unit tests
	- nuke: Remove all developement data
"
DC="docker compose --file docker-compose.dev.yml"

set -e
set -o pipefail

# -----------------------------------------------------------------------------
#                                  FUNCTIONS
# -----------------------------------------------------------------------------
fail() {
	echo "Error. Exiting."
	stop_docker
	echo "Exited because of an error."
	exit 1
}

colored_echo() {
	GREEN="\e[42m"
	DEFAULT="\e[0m"
	echo -e "${GREEN}${1}${DEFAULT}"
}

check_system_dependencies() {
	HELP_MESSAGE="Please refer to the developer documentation to find how to install the required dependencies: https://github.com/ValFraNath/apothiquiz/wiki/Developer-setup."

	colored_echo "Checking system dependencies..."
	DEPS=("node" "npm" "docker")

	for DEP in "${DEPS[@]}"; do
		if ! command -v "$DEP" >/dev/null 2>&1; then
			colored_echo "$DEP dependency is missing."
			colored_echo "$HELP_MESSAGE"
			exit 1
		fi
	done

	# TODO check docker compose
	# if ! command -v "docker-compose" >/dev/null 2>&1 && ! command -v "docker compose" >/dev/null 2>&1; then
	# 	printf "docker dependency is missing.\n%s" "$HELP_MESSAGE";
	# 	exit 1;
	# fi

	if ! [ -f "dev.env" ]; then
		colored_echo "Missing dev.env file, creating with default values from .env.example"
		colored_echo "Feel free to edit your local .env to match your dev environment"
		cp ".env.example" "dev.env" || fail
		colored_echo
	fi

	colored_echo "...OK!"
}

check_npm_dependencies() {
	colored_echo "Checking npm dependencies..."
	for DIR in "client" "server"; do
		cd "$DIR" || fail
		if ! [ -d "node_modules" ] || ! npm list --all >/dev/null 2>&1; then
			colored_echo "Installing npm dependencies in $DIR"
			npm install
		fi

		cd - >/dev/null || fail
	done
	colored_echo "...OK!"
}

SERVICES=("mariadb" "openldap" "phpldapadmin")
start_docker() {
	$DC up "${SERVICES[@]}" --detach || fail

	until [ "$(docker inspect -f '{{.State.Health.Status}}' "$($DC ps -q mariadb)")" == "healthy" ]; do
		colored_echo "Waiting for mariadb to be ready..."
		sleep 2
	done
}

stop_docker() {
	$DC stop "${SERVICES[@]}"
}

run_server() {
	cd "./server/" || fail
	npm run start:watch -- --config="../dev.env" || fail
}

test_server() {
	colored_echo "Running tests with a temporary database"
	$DC up mariadb-test --detach

	until [ "$(docker inspect -f '{{.State.Health.Status}}' "$($DC ps -q mariadb-test)")" == "healthy" ]; do
		colored_echo "Waiting for mariadb-test to be ready..."
		sleep 2
	done

  # shellcheck disable=SC2046 # We want the attributes to be treated separately
	export $(grep --only-matching "APOTHIQUIZ_.*=[^ ]*" dev.env | xargs)
	export APOTHIQUIZ_DB_PORT=3307 # 3307 is the port for the test database
	cd "./server/" || fail
	npm run test

	cd "../" || fail
	$DC down mariadb-test
}

run_client() {
	cd "./client/" || fail
	# Use tee to make react-scripts thinks it's not an interactive console
	npm run start | tee || fail
}

# -----------------------------------------------------------------------------
#                               ACTUAL SCRIPT
# -----------------------------------------------------------------------------

if [ -z "$1" ]; then
	colored_echo "$HELP"
	exit 0
fi

case "$1" in
"start")
	check_system_dependencies
	check_npm_dependencies
	start_docker
	run_server &
	run_client &

	colored_echo ""
	colored_echo "----------------------------------------------------"
	colored_echo "      Press ctrc+c to stop everything"
	colored_echo "----------------------------------------------------"

	trap stop_docker SIGINT # Stop docker on ctrl+c

	wait # Do not stop the script until the commands are finished
	exit 0
	;;

"stop-docker")
	stop_docker
	exit 0
	;;

"test")
	check_system_dependencies
	check_npm_dependencies
	test_server &

	wait
	exit 0
	;;

"nuke")
	read -p "Do you want to remove all your development data (including databases)? [yN] " -n 1 -r
	colored_echo # newline
	if [[ "$REPLY" =~ ^[YyOo]$ ]]; then
		$DC down --volumes
		colored_echo "Removing client/node_modules" && rm -rf client/node_modules
		colored_echo "Removing server/node_modules" && rm -rf server/node_modules
		colored_echo "Removing dev.env" && rm -r dev.env
	fi
	exit 0
	;;

"help"|*)
	echo "$HELP"
	exit 0
	;;

esac
