import React, { Component } from "react";
import AuthService from "../../services/auth.service";

class Login extends Component {
  constructor() {
    super();
    this.state = {
      isLogged: true,
    };
  }

  handleFormSubmit(e) {
    e.preventDefault();
    const { pseudoInput, passwordInput } = e.target.elements;

    AuthService.login(pseudoInput.value.trim(), passwordInput.value)
      .then((user) => {
        console.info(`User ${user} is successfully logged in`);
        document.location.replace("/userhome");
      })
      .catch((error) => console.error(`An error has occurred : ${error}`));
  }

  componentDidMount() {
    if (AuthService.getCurrentUser() !== null) {
      document.location.replace("/");
    } else {
      this.setState({
        isLogged: false,
      });
    }
  }

  render() {
    return (
      this.state.isLogged || (
        <main id={"login"}>
          <h1>Connexion</h1>
          <form onSubmit={this.handleFormSubmit}>
            <input type={"text"} id={"pseudoInput"} />
            <input type={"password"} id={"passwordInput"} />
            <input type={"submit"} />
          </form>
        </main>
      )
    );
  }
}

export default Login;
