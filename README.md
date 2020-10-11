# glowing-octo-guacamole
[![Deployed to preview](https://github.com/nathanaelhoun/glowing-octo-guacamole/workflows/Deploy%20to%20preview/badge.svg)](https://beta.glowing-octo-guacamole.nathanaelhoun.fr) 
[![Deployed to production](https://github.com/nathanaelhoun/glowing-octo-guacamole/workflows/Deploy%20to%20production/badge.svg?branch=production)](https://glowing-octo-guacamole.nathanaelhoun.fr) 

A third year undergraduate project by Nathanaël Houn, Valentin Perignon and François Poguet, three students at the Université de _Franche-Comté_ (FR). 

## Deployment

### Requirements

- Node > v14
- `pm2` for a production deployment
- `nodemon` for a dev environment

### Steps

Create a `.env` file in the `/server/` directory.

```env
PORT=the port to listen
```

- For a **deployment production**, you can use `pm2`. In `/server/`, launch `pm2` for the first time

```bash
$ pm2 start index.js --name glowing-octo-guacamole
```

Then, on each code change, you can simply run

```bash
$ pm2 restart glowing-octo-guacamole
```

- For a **dev environment**, you can start `nodemon` in the `server` directory

Afterwards, you will be able to access the app through `http://localhost:$PORT`.
