import React, { Component } from "react";
import { Redirect } from "react-router-dom";

import FloatingError from "../components/status/FloatingError";
import connectionImg from "../images/logo192.png";
import Auth from "../utils/authentication";

class Login extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isLogged: true,
      error: null,
    };

    this.handleFormSubmit = this.handleFormSubmit.bind(this);
  }

  handleFormSubmit(e) {
    e.preventDefault();
    const { pseudoInput, passwordInput } = e.target.elements;
    Auth.login(pseudoInput.value.trim(), passwordInput.value)
      .then((user) => {
        console.info(`User ${user} successfully logged in`);
        document.location.replace("/menu");
      })
      .catch((error) => {
        console.error(error);
        const messages = {
          404: "Utilisateur inconnu",
          401: "Mot de passe incorrect",
          500: "Impossible de joindre le serveur",
        };
        this.setState({ error: messages[error.response.status] || "Erreur" });
      });
  }

  componentDidMount() {
    this.setState({
      isLogged: false,
    });
  }

  render() {
    if (Auth.getCurrentUser() !== null) {
      return <Redirect to="/menu" />;
    }
    return (
      this.state.isLogged || (
        <>
        <img src={connectionImg} alt ="connection"/>
        <div id="container">
          <form onSubmit={this.handleFormSubmit}>
            <h1>Connexion</h1>
            <h2>
              Veuillez renseigner votre pseudo <span>et mot de passe ENT</span>
            </h2>
            <label>Pseudo</label>
            <input type="text" id="pseudoInput" placeholder="Nom d'utilisateur" required />
            <label>Mot de passe</label>
            <input type="password" id="passwordInput" placeholder="Mot de passe" required />
            <input type="submit" value="Se connecter" />
            {this.state.error && <FloatingError message={this.state.error} />}
          </form>
        </div>
        </>
      )
    );
  }
}

export default Login;
