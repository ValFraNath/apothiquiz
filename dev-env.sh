#!/bin/bash

HELP="Setup script for Apothiquiz dev environment
Available commands:
	- start: Start docker containers and run server and client in watch mode
	- test: Launch unit tests
	- create-user <login> [password]: Create a new user in the database and LDAP

	- start-docker: Start docker containers
	- stop-docker: Stop docker containers
	- nuke: Remove all developement data
"
DC="docker compose"

set -e
set -o pipefail

# -----------------------------------------------------------------------------
#                                  FUNCTIONS
# -----------------------------------------------------------------------------
fail() {
	echo "Error. Exiting."
	# stop_docker_services
	echo "Exited because of an error."
	exit 1
}

colored_echo() {
	GREEN="\e[42m"
	DEFAULT="\e[0m"
	echo -e "${GREEN}[dev-env.sh] ${1}${DEFAULT}"
}

check_system_dependencies() {
	HELP_MESSAGE="Please refer to the developer documentation to find how to install the required dependencies: https://github.com/ValFraNath/apothiquiz/wiki/Developer-setup."

	colored_echo "Checking system dependencies..."
	DEPS=("docker")

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
		colored_echo "    Missing dev.env file, creating with default values from .env.example"
		colored_echo "    Feel free to edit your local .env to match your dev environment"
		cp ".env.example" "dev.env" || fail
	fi

	colored_echo "    Pulling missing docker containers."
	$DC pull || fail

	colored_echo "...OK!"
}

check_npm_dependencies() {
	colored_echo "Checking npm dependencies..."
	for DIR in "client" "server"; do
		if ! [ -d "node_modules" ] || ! $DC exec --workdir "/app/$DIR" node npm list --all >/dev/null 2>&1; then
			colored_echo "    Installing npm dependencies in $DIR"
			$DC exec --workdir "/app/$DIR" node npm install || fail
		fi
	done
	colored_echo "...OK!"
}

SERVICES=("mariadb" "openldap" "phpldapadmin" "node")
start_docker_services() {
	$DC up "${SERVICES[@]}" --detach || fail

	until [ "$(docker inspect -f '{{.State.Health.Status}}' "$($DC ps -q mariadb)")" == "healthy" ]; do
		colored_echo "Waiting for mariadb to be ready..."
		sleep 2
	done
}

stop_docker_services() {
	$DC stop "${SERVICES[@]}"
}

run_server() {
	colored_echo "Starting server in watch mode"
	$DC exec --workdir "/app/server" --no-TTY node npm run start:watch -- --config="../dev.env" || fail
}

run_client() {
	colored_echo "Starting client in watch mode"
	$DC exec --workdir "/app/client" --no-TTY node npm run start | tee || fail
}

test_server() {
	colored_echo "Running tests with a temporary database"
	$DC up mariadb-test --detach

	until [ "$(docker inspect -f '{{.State.Health.Status}}' "$($DC ps -q mariadb-test)")" == "healthy" ]; do
		colored_echo "Waiting for mariadb-test to be ready..."
		sleep 2
	done

	$DC exec --workdir "/app/server" --env APOTHIQUIZ_DB_PORT=3307 node npm run test
	$DC stop mariadb-test
	$DC rm mariadb-test
}

create_user() {
	# default password is "password"
	USERID="$1"
	PASSWORD="${2:-"password"}"

	# Create users group if it doesn't exist
	cat <<-EOF | $DC exec --no-TTY openldap ldapadd -x -D "cn=admin,dc=apothiquiz,dc=io" -w password -H ldap://localhost -ZZ >/dev/null 2>/dev/null || true
		dn: ou=users,dc=apothiquiz,dc=io
		objectclass: organizationalUnit
		objectclass: top
		ou: users
	EOF

	colored_echo "Create new user: '$USERID'"

	colored_echo "    [1/2] Adding to LDAP database"
	cat <<-EOF | $DC exec --no-TTY openldap ldapadd -x -D "cn=admin,dc=apothiquiz,dc=io" -w password -H ldap://localhost -ZZ || true
		dn: uid=$USERID,ou=users,dc=apothiquiz,dc=io
		uid: $USERID
		cn: $USERID
		sn: 3
		objectClass: top
		objectClass: posixAccount
		objectClass: inetOrgPerson
		loginShell: /bin/bash
		homeDirectory: /home/$USERID
		uidNumber: 14583102
		gidNumber: 14564100
		userPassword: $PASSWORD
		mail: $USERID@example.org
		gecos: $USERID UserEOF
	EOF

	colored_echo "    [2/2] Adding to mariadb database"
	echo "INSERT IGNORE INTO \`user\` (\`us_login\`,\`us_admin\`) VALUES ('$USERID',0)" |
		$DC exec --no-TTY mariadb mariadb --user=root --password=root apothiquizDb

	colored_echo "User $USERID created successfully, the default password is '$PASSWORD'"
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
	trap stop_docker_services SIGINT # Stop docker on ctrl+c
	start_docker_services

	# check_npm_dependencies

	echo ""
	colored_echo "----------------------------------------------------"
	colored_echo "      Press ctrc+c to stop everything"
	colored_echo "----------------------------------------------------"
	echo ""

	run_server &
	run_client &

	wait # Do not stop the script until the commands are finished
	exit 0
	;;

"start-docker")
	start_docker_services
	exit 0
	;;

"stop-docker")
	stop_docker_services
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
	echo # newline
	if [[ "$REPLY" =~ ^[YyOo]$ ]]; then
		$DC down --volumes
		colored_echo "Removing client/node_modules" && rm -rf client/node_modules
		colored_echo "Removing server/node_modules" && rm -rf server/node_modules
		colored_echo "Removing dev.env" && rm -r dev.env
	fi
	exit 0
	;;

"create-user")
	if [ -z "$2" ]; then
		colored_echo "Il manque le nom d'utilisateur"
		exit 1
	fi
	create_user "$2" "$3"
	exit 0
	;;

"help" | *)
	echo "$HELP"
	exit 0
	;;

esac
