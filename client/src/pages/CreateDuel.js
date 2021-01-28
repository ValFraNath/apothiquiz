import axios from "axios";
import React, { Component } from "react";
import AuthService from "../services/auth.service";

import ButtonFullWidth from "../components/buttons/ButtonFullWidth";

class CreateDuel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      listOfUsers: {
        a: "hey",
      },
      opponent: null,
    };
  }

  componentDidMount() {
    axios
      .get("/api/v1/users")
      .then((res) => {
        this.setState({
          listOfUsers: res.data,
        });
      })
      .catch((err) => console.error(err));
  }

  render() {
    const { listOfUsers, opponent } = this.state;
    const currentUser = AuthService.getCurrentUser();

    return (
      <main id="create-duel">
        <section>
          <h1>Créer un nouveau duel</h1>
          <input type="text" placeholder="Rechercher un utilisateur"></input>
        </section>
        <section>
          <ul>
            {Object.keys(listOfUsers)
              .filter((value) => value !== currentUser.pseudo)
              .map((value, index) => (
                <li key={index}>{value}</li>
              ))}
          </ul>
        </section>
        <section>
          {opponent !== null ? (
            <ButtonFullWidth onclick="Hey">Lancer le défi</ButtonFullWidth>
          ) : (
            <p>Veuillez choisir un adversaire</p>
          )}
        </section>
      </main>
    );
  }
}

export default CreateDuel;
