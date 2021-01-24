import React, { Component } from "react";
import axios from "axios";

import AuthService from "../../services/auth.service";
import Avatar from "../Avatar";
import { Link } from "react-router-dom";
import Plural from "../Plural";
import FightPilette from "../../images/fight.png";
import WaitPilette from "../../images/attente.png";

class HomePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentUser: null,
      usersData: null,
      toPlayChallenges: [],
      pendingChallenges: [],
    };
  }

  componentDidMount() {
    const currentUser = AuthService.getCurrentUser();
    const listOfUsers = [currentUser.pseudo];
    axios
      .post("/api/v1/users/about", listOfUsers)
      .then((res) => {
        this.setState({
          currentUser: res.data[currentUser.pseudo],
          usersData: res.data,
        });
      })
      .catch((err) => console.error(err));
  }

  render() {
    const { currentUser, toPlayChallenges, pendingChallenges } = this.state;

    const cuWins = currentUser?.wins ?? 0;
    const cuLosses = currentUser?.losses ?? 0;

    return (
      <main id="homepage">
        <header>
          <div id="header-background"></div>
          <Avatar
            size="150px"
            eyes={currentUser?.avatar.eyes ?? 0}
            hands={currentUser?.avatar.hands ?? 0}
            hat={currentUser?.avatar.hat ?? 0}
            mouth={currentUser?.avatar.mouth ?? 0}
            colorBG={currentUser?.avatar.colorBG ?? "#d3d3d3"}
            colorBody={currentUser?.avatar.colorBody ?? "#0c04fc"}
          />

          <div>
            <h1>{currentUser?.pseudo ?? "Pilette"}</h1>
            <p>
              {cuWins} <Plural word="victoire" count={cuWins} />
            </p>
            <p>
              {cuLosses} <Plural word="défaite" count={cuLosses} />
            </p>
          </div>
        </header>

        <div id="links">
          <Link to="/train" className="btn">
            Entraînement
          </Link>
          <Link to="/homepage" className="btn">
            Nouveau duel
          </Link>
        </div>

        <section>
          <h2>
            <img src={FightPilette} alt="Pilette is fighting" /> Ton tour
          </h2>
          {toPlayChallenges.length === 0 ? (
            <p>Aucun défi à relever pour le moment.</p>
          ) : (
            <p>Liste des défis à jouer.</p>
          )}
        </section>

        <section>
          <h2>
            <img src={WaitPilette} alt="Pilette is waiting" /> En attente
          </h2>
          {pendingChallenges.length === 0 ? (
            <p>Aucun défi à en attente pour le moment.</p>
          ) : (
            <p>Liste des défis en attente.</p>
          )}
        </section>
      </main>
    );
  }
}

export default HomePage;
