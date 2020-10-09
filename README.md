# glowing-octo-guacamole

Projet 2020-2021 tutoré de Nathanaël Houn, Valentin Perignon et François Poguet

## Production deployment

### Requirements

- Node v14.xx.xx
- `pm2`

### Steps

In `/server/`, launch `pm2` for the first time

```bash
$ pm2 start index.js --name glowing-octo-guacamole
```

Then, on each code change, you can simply

```bash
$ pm2 restart glowing-octo-guacamole
```