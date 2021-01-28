import axios from "axios";
import React, { Component } from "react";

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
    const { listOfUsers } = this.state;
    return (
      <main id="create-duel">
        <h1>Créer un nouveau duel</h1>
        <section>
          <input type="text" placeholder="Rechercher un utilisateur"></input>
          <ul>
            {Object.keys(listOfUsers).map((value) => (
              <li>{value}</li>
            ))}
          </ul>
          <ButtonFullWidth onclick="Hey">Lancer le défi</ButtonFullWidth>
        </section>
      </main>
    );
  }
}

export default CreateDuel;
