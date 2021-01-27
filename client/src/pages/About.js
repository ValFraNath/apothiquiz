import React, { Component } from "react";
import axios from "axios";
import GitInfo from "react-git-info/macro";

import Message from "../components/quiz/Message";
import Button from "../components/Buttons/ButtonDefault";

export default class About extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  handleButtonClick = () => {
    axios
      .get(`/api/v1/status`)
      .then((res) => {
        this.setState({
          serverStatus: res.data.status,
          currentServerAPIVersion: res.data.api_version,
        });
      })
      .catch((err) => {
        console.error(err);
        this.setState({
          error: err,
        });
      });
  };

  render() {
    const gitInfo = GitInfo();
    const date = new Date();
    date.setTime(Date.parse(gitInfo.commit.date));

    return (
      <main id="informations">
        <p>
          Guacamole est une application d'apprentissage réflexe à destination des étudiants en
          pharmacie de l'Université de Franche-Comté.
        </p>
        <p>
          Elle est réalisée dans le cadre d'un projet tutoré de Licence 3 Informatique 2020-2021.
        </p>
        <p>
          <b>Application en développement actif</b>
        </p>
        <p>
          En cas de remarque ou de conseil sur cette application, vous pouvez{" "}
          <a href="mailto:nathanael.houn@edu.univ-fcomte.fr,francois.poguet@edu.univ-fcomte.fr,valentin.perignon@edu.univ-fcomte.fr">
            nous écrire par mail
          </a>
        </p>

        <Button onClick={this.handleButtonClick}>Tester la connexion au serveur</Button>

        {this.state.serverStatus && (
          <p>
            Status du serveur : {this.state.serverStatus}
            <br />
            Version de l'API serveur: {this.state.currentServerAPIVersion}
          </p>
        )}

        {this.state.error && (
          <Message
            type="error"
            content="Pas de connexion. Veuillez vérifier votre connexion et que le serveur fonctionne"
          />
        )}

        <ol id="credits">
          <li>Réalisé par Nathanaël Houn, François Poguet et Valentin Perignon.</li>
          <li>Supervisé par Anne-Laure Clairet, Frédéric Dadeau, et Marc Pudlo.</li>
          <li>Graphismes par Roxane Herbstmeyer.</li>
          <li>
            Icônes par{" "}
            <a href="https://icons.modulz.app/" target="_blank" rel="noreferrer">
              Modulz
            </a>
            .
          </li>
        </ol>

        <table id="app-version">
          <tbody>
            <tr>
              <td>Date de version : </td>
              <td>
                {process.env.NODE_ENV === "production"
                  ? date.toLocaleString().split("GMT")[0]
                  : process.env.NODE_ENV}
              </td>
            </tr>
            <tr>
              <td>Hash de version : </td>
              <td>{gitInfo.commit.shortHash}</td>
            </tr>
          </tbody>
        </table>
      </main>
    );
  }
}
