# glowing-octo-guacamole

[![Deployed to preview](https://img.shields.io/badge/Preview-deployed-brightgreen)](https://beta.glowing-octo-guacamole.nathanaelhoun.fr)
![Build and test the app](https://github.com/nathanaelhoun/glowing-octo-guacamole/workflows/Build%20and%20test%20the%20app/badge.svg)

A third year undergraduate project by Nathanaël Houn, Valentin Perignon and François Poguet, three students at the Université de _Franche-Comté_ (FR).

## Deployment, coding convention and more

You can learn more about this project in our [wiki](https://github.com/nathanaelhoun/glowing-octo-guacamole/wiki).

## Server API Documentation

Please follow the instructions [here](https://github.com/ValFraNath/guacamole-api-docs)

## Developer setup

### Requirements

- [NodeJS](https://nodejs.org/en/) (at least > v14)
- [MariaDB](https://mariadb.org/) > v10.4

### Create the database

```mariadb
[mariadb]: CREATE USER 'glowing-octo-guacamole'@'localhost' IDENTIFIED BY 'p@ssword';
[mariadb]: CREATE DATABASE glowingOctoGuacamoleDev;
[mariadb]: GRANT ALL PRIVILEGES ON glowingOctoGuacamoleDev.* TO 'glowing-octo-guacamole'@'localhost';
```

### Scripts needed

- Install the githook with `./githooks/setup-hooks.sh`
- Insert test data in the database with the scripts in `./server/test/required_data/*.sql`. Note that the database is emptyied after each test.

### Run development server

You can use [`nodemon`](https://nodemon.io/) to auto-reload the servers on changes. You can launch two instances, one for `client/` and the other for `server/`
