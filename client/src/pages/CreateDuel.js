import axios from "axios";
import React, { Component } from "react";
import AuthService from "../services/auth.service";

import Avatar from "../components/Avatar";
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

  chooseOpponent(name) {
    let newValue = name;
    if (this.state.opponent === name) {
      newValue = null;
    }
    this.setState({
      opponent: newValue,
    });
  }

  createDuel = () => {
    console.log("hey");
    axios
      .post("/api/v1/duels/new", {
        opponent: this.state.opponent,
      })
      .then(() => {
        // Todo: redirect to duel page
        alert("New challenge created");
      })
      .catch((err) => console.error(err));
  };

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
              .filter((user) => user !== currentUser.pseudo)
              .map((user, index) => (
                <li
                  key={index}
                  onClick={() => this.chooseOpponent(user)}
                  className={opponent === user ? "selected" : ""}
                >
                  <Avatar
                    size="50px"
                    eyes={listOfUsers[user]?.avatar?.eyes}
                    hands={listOfUsers[user]?.avatar?.hands}
                    hat={listOfUsers[user]?.avatar?.hat}
                    mouth={listOfUsers[user]?.avatar?.mouth}
                    colorBG={listOfUsers[user]?.avatar?.colorBG}
                    colorBody={listOfUsers[user]?.avatar?.colorBody}
                  />
                  {user}
                </li>
              ))}
          </ul>
        </section>
        <section>
          {opponent !== null ? (
            <ButtonFullWidth onClick={this.createDuel}>Lancer le défi</ButtonFullWidth>
          ) : (
            <p>Veuillez choisir un adversaire</p>
          )}
        </section>
      </main>
    );
  }
}

export default CreateDuel;
