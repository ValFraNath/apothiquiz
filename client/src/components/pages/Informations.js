import React, { Component } from "react";
import axios from "axios";

import Message from "../quizz/Message";

export default class Informations extends Component {
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
          currentServerVersion: res.data.db_version,
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
    return (
      <div id="informations">
        <p>
          Guacamole est une application d'apprentissage réflexe à destination des
          étudiants en pharmacie de l'Université de Franche-Comté.
        </p>
        <p>
          Elle est réalisée dans le cadre d'un projet tutoré de Licence 3
          Informatique.
        </p>
        <p>
          <b>Application en développement actif</b>
          <br />
          En cas de remarque sur cette application, vous pouvez nous écrire à{" "}
          <a href="mailto:nathanael.houn@edu.univ-fcomte.fr">
            nathanael.houn@edu.univ-fcomte.fr
          </a>
          ,{" "}
          <a href="mailto:francois.poguet@edu.univ-fcomte.fr">
            francois.poguet@edu.univ-fcomte.fr
          </a>{" "}
          ou{" "}
          <a href="mailto:valentin.perignon@edu.univ-fcomte.fr">
            valentin.perignon@edu.univ-fcomte.fr
          </a>
        </p>

        <button onClick={this.handleButtonClick}>
          Récupérer les informations
        </button>

        {this.state.serverStatus && (
          <p>
            Connection to the server: {this.state.serverStatus}
            <br />
            Current server version: {this.state.currentServerVersion}
          </p>
        )}

        {this.state.error && (
          <Message
            type="error"
            content="Pas de connexion. Veuillez vérifier votre connexion et que le serveur fonctionne"
          />
        )}
      </div>
    );
  }
}
