# glowing-octo-guacamole

[![Deployed to preview](https://img.shields.io/badge/Preview-deployed-brightgreen)](https://beta.glowing-octo-guacamole.nathanaelhoun.fr)
![Build and test](https://github.com/nathanaelhoun/glowing-octo-guacamole/workflows/Build%20and%20test/badge.svg)

A third year undergraduate project by Nathanaël Houn, Valentin Perignon and François Poguet, three students at the Université de _Franche-Comté_ (FR).

![A random image](./docs/random-image.png)

## How does this repository work?

This repository contains two major branches:

- `main`, the _main_ branch, with the latest code. It is continuously deployed to [beta.glowing-octo-guacamole.nathanaelhoun.fr](https://beta.glowing-octo-guacamole.nathanaelhoun.fr).
- `production`, the _production_ branch, with code which must be stable and working correctly at any time. It is continuously deployed to [glowing-octo-guacamole.nathanaelhoun.fr](https://glowing-octo-guacamole.nathanaelhoun.fr).

Developement (both bug fixes and new features) Pull Request are made against `main`, and when features have been implemented and validated, we can do a release and merge it into the `production` branch. Only very important and urgent fixes can be directly merged to the `production` branch.

PRs made against `main` must match several criteria:

- Pass the `Build and test` CI job, for node v14
- Check that images are compressed with the [`CalibreApp Image Action`](https://github.com/marketplace/actions/image-actions)
- Do not contain "WIP" in the title, check by the [WIP App](https://github.com/apps/wip)
- Be reviewed by at least one person

[API documentation can be found here](https://web.postman.co/collections/12964640-edb9f396-5c5b-4122-b35c-b7c9a0e37df9?version=latest&workspace=dc3ec45b-bac4-4c20-8563-b0c2a0a8d465).

## Deployment, developer seutup and more

You can learn more about this project in our [wiki](https://github.com/nathanaelhoun/glowing-octo-guacamole/wiki).
