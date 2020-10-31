import React, { Component } from "react";
import AuthService from "../services/auth.service";

class Login extends Component {
  handleFormSubmit(e) {
    e.preventDefault();
    const { pseudoInput, passwordInput } = e.target.elements;

    AuthService.login(pseudoInput.value, passwordInput.value)
      .then((token) => console.log(token))
      .catch((error) => console.log(error.response.data.error));
  }

  render() {
    return (
      <main id={"login"}>
        <h1>Connexion</h1>
        <form onSubmit={this.handleFormSubmit}>
          <input type={"text"} id={"pseudoInput"} />
          <input type={"password"} id={"passwordInput"} />
          <input type={"submit"} />
        </form>
      </main>
    );
  }
}

export default Login;
