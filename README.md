# glowing-octo-guacamole

Projet 2020-2021 tutoré de Nathanaël Houn, Valentin Perignon et François Poguet

## Deployment

### Requirements

- Node v14.xx.xx
- `pm2` for a production deployment
- `nodemon` for a dev environment

### Steps

Create a `.env` file in the `/server/` directory.

```env
PORT=the port to listen
```

- For a deployment production, you can use `pm2.`. In `/server/`, launch `pm2` for the first time

```bash
$ pm2 start index.js --name glowing-octo-guacamole
```

Then, on each code change, you can simply

```bash
$ pm2 restart glowing-octo-guacamole
```

- For a dev environment, you can start `nodemon` in the `server` directory

You can then access to the app with at `http://localhost:$PORT`
