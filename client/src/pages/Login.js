import { PropTypes } from "prop-types";
import React, { Component } from "react";
import { Redirect } from "react-router-dom";

import AuthService from "../services/auth.service";

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLogged: true,
    };

    this.handleFormSubmit = this.handleFormSubmit.bind(this);
  }

  handleFormSubmit(e) {
    e.preventDefault();
    const { pseudoInput, passwordInput } = e.target.elements;

    AuthService.login(pseudoInput.value.trim(), passwordInput.value)
      .then((user) => {
        console.info(`User ${user} successfully logged in`);
        this.props.history.push("/homepage");
      })
      .catch((error) => {
        console.error(`An error has occurred : ${error}`);
        this.setState({ error: String(error) });
      });
  }

  componentDidMount() {
    this.setState({
      isLogged: false,
    });
  }

  render() {
    if (AuthService.getCurrentUser() !== null) {
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
              <li>Nom d'utilisateur : « test »</li>
              <li>Mot de passe : « 1234 »</li>
            </ul>
          </details>
          <form onSubmit={this.handleFormSubmit}>
            <input type="text" id="pseudoInput" placeholder="Nom d'utilisateur" required />
            <input type="password" id="passwordInput" placeholder="Mot de passe" required />
            <input type="submit" value="Se connecter" />
          </form>

          {this.state.error && <p className="error">{this.state.error}</p>}
        </main>
      )
    );
  }
}

Login.propTypes = {
  history: PropTypes.object.isRequired,
};

export default Login;
