import axios from "axios";
import React, { Component } from "react";

import Avatar from "../components/Avatar";
import ButtonFullWidth from "../components/buttons/ButtonFullWidth";
import AuthService from "../services/auth.service";

class CreateDuel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      listOfUsers: {},
      opponent: null,
      search: "",
    };
  }

  componentDidMount() {
    axios
      .get("/api/v1/users")
      .then((resUsers) => {
        axios
          .get("/api/v1/duels")
          .then((resDuels) => {
            const usersToDisplay = resUsers.data;
            for (let duel of resDuels.data) {
              if (duel.opponent in usersToDisplay && duel.inProgress === 1) {
                delete usersToDisplay[duel.opponent];
              }
            }
            this.setState({
              listOfUsers: usersToDisplay,
            });
          })
          .catch((err) => console.error(err));
      })
      .catch((err) => console.error(err));
  }

  /**
   * Select an opponent
   * @param {string} name Username of the opponent
   */
  chooseOpponent(name) {
    let newValue = name;
    if (this.state.opponent === name) {
      newValue = null;
    }
    this.setState({
      opponent: newValue,
    });
  }

  /**
   * Create a duel with the chosen opponent
   */
  createDuel = () => {
    axios
      .post("/api/v1/duels/new", {
        opponent: this.state.opponent,
      })
      .then((res) => {
        document.location.replace(`/duel/${res.data.id}`);
      })
      .catch((err) => console.error(err));
  };

  /**
   * Search for a user
   * @param {*} event
   */
  handleSearch = (event) => {
    this.setState({
      search: event.target.value,
    });
  };

  render() {
    const { listOfUsers, opponent, search } = this.state;
    const currentUser = AuthService.getCurrentUser();

    return (
      <main id="create-duel">
        <section>
          <h1>Créer un nouveau duel</h1>
          <input
            type="text"
            placeholder="Rechercher un utilisateur"
            onChange={this.handleSearch}
          ></input>
        </section>
        <section>
          <ul>
            {Object.keys(listOfUsers)
              .filter((user) => {
                let searchBoolean = search !== "" ? new RegExp(search, "i").test(user) : true;
                return user !== currentUser.pseudo && searchBoolean;
              })
              .map((user, index) => (
                <li
                  key={index}
                  onClick={() => this.chooseOpponent(user)}
                  className={opponent === user ? "selected" : ""}
                >
                  <Avatar size="50px" infos={listOfUsers[user]?.avatar} />
                  <p>{user}</p>
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
