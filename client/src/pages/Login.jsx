import React, { Component } from "react";
import { Redirect } from "react-router-dom";

import FloatingError from "../components/status/FloatingError";
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
        document.location.replace("/homepage");
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
      return <Redirect to="/homepage" />;
    }

    return (
      this.state.isLogged || (
        <main id="login">
          <h1>Connexion</h1>
          <h2>(Page temporaire en attendant le CAS)</h2>
          <details>
            <summary>Vous n'avez pas de compte ?</summary>
            Prenez donc celui-ci :
            <ul>
              <li>Nom d'utilisateur : « test »</li>
              <li>Mot de passe : « 1234 »</li>
            </ul>
          </details>
          <form onSubmit={this.handleFormSubmit}>
            <input type="text" id="pseudoInput" placeholder="Nom d'utilisateur" required />
            <input type="password" id="passwordInput" placeholder="Mot de passe" required />
            <input type="submit" value="Se connecter" />
          </form>

          {this.state.error && <FloatingError message={this.state.error} />}
        </main>
      )
    );
  }
}

export default Login;
