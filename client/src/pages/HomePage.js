import React, { Component } from "react";
import axios from "axios";
import { ChevronRightIcon } from "@modulz/radix-icons";
import AuthService from "../services/auth.service";

import Avatar from "../components/Avatar";
import { Link } from "react-router-dom";
import Plural from "../components/Plural";
import FightPilette from "../images/fight.png";
import WaitPilette from "../images/attente.png";

class HomePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentUser: null,
      usersData: [],
      toPlayChallenges: [],
      pendingChallenges: [],
    };
  }

  componentDidMount() {
    axios
      .get("/api/v1/duels/")
      .then((res) => {
        const toPlay = [],
          pending = [];
        res.data.forEach((val) => {
          if (!val.inProgress) return;
          if (val.rounds[val.currentRound - 1][0].userAnswer !== undefined) {
            pending.push(val);
          } else {
            toPlay.push(val);
          }
        });
        this.setState({
          toPlayChallenges: toPlay,
          pendingChallenges: pending,
        });

        const listOfUsers = [
          ...toPlay.map((value) => value.opponent),
          ...pending.map((value) => value.opponent),
        ];
        this.getUsersData(listOfUsers);
      })
      .catch((err) => console.error(err));
  }

  getUsersData(otherUsers) {
    const currentUser = AuthService.getCurrentUser();
    const listOfUsers = [currentUser.pseudo, ...otherUsers];
    axios
      .post("/api/v1/users/", listOfUsers)
      .then((res) => {
        this.setState({
          currentUser: res.data[currentUser.pseudo],
          usersData: res.data,
        });
      })
      .catch((err) => console.error(err));
  }

  render() {
    const { currentUser, usersData, toPlayChallenges, pendingChallenges } = this.state;
    const cuWins = currentUser?.wins ?? 0;
    const cuLosses = currentUser?.losses ?? 0;

    return (
      <main id="homepage">
        <header>
          <div id="header-background"></div>
          <Avatar
            size="125px"
            eyes={currentUser?.avatar.eyes}
            hands={currentUser?.avatar.hands}
            hat={currentUser?.avatar.hat}
            mouth={currentUser?.avatar.mouth}
            colorBG={currentUser?.avatar.colorBG}
            colorBody={currentUser?.avatar.colorBody}
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
          <Link to="/createduel" className="btn">
            Nouveau duel
          </Link>
        </div>

        <section>
          <h2>
            <img src={FightPilette} alt="Pilette est prête à affronter ses adversaires" /> Ton tour
          </h2>
          {toPlayChallenges.length === 0 ? (
            <p>Aucun défi à relever pour le moment.</p>
          ) : (
            <>
              {toPlayChallenges.map((value, index) => (
                <Link to={`/duel/about/${value.id}`} key={index}>
                  <article>
                    <Avatar
                      size="75px"
                      eyes={usersData[value.opponent]?.avatar.eyes}
                      hands={usersData[value.opponent]?.avatar.hands}
                      hat={usersData[value.opponent]?.avatar.hat}
                      mouth={usersData[value.opponent]?.avatar.mouth}
                      colorBG={usersData[value.opponent]?.avatar.colorBG}
                      colorBody={usersData[value.opponent]?.avatar.colorBody}
                    />
                    <div className="challenges-text">
                      <div>
                        <h3>{value.opponent}</h3>
                        <p>Vous pouvez jouer le round {value.currentRound}</p>
                      </div>
                      <ChevronRightIcon />
                    </div>
                  </article>
                </Link>
              ))}
            </>
          )}
        </section>

        <section>
          <h2>
            <img src={WaitPilette} alt="Pilette is waiting" /> En attente
          </h2>
          {pendingChallenges.length === 0 ? (
            <p>Aucun défi à en attente pour le moment.</p>
          ) : (
            <>
              {pendingChallenges.map((value, index) => (
                <article key={index}>
                  <Link to={`/duel/${value.id}`} className="challenges-text">
                    <h3>{value.opponent}</h3>
                    <p>En train de jouer le round {value.currentRound}</p>
                  </Link>
                  <Avatar
                    size="75px"
                    eyes={usersData[value.opponent]?.avatar.eyes ?? 0}
                    hands={usersData[value.opponent]?.avatar.hands ?? 0}
                    hat={usersData[value.opponent]?.avatar.hat ?? 0}
                    mouth={usersData[value.opponent]?.avatar.mouth ?? 0}
                    colorBG={usersData[value.opponent]?.avatar.colorBG ?? "#d3d3d3"}
                    colorBody={usersData[value.opponent]?.avatar.colorBody ?? "#0c04fc"}
                  />
                </article>
              ))}
            </>
          )}
        </section>
      </main>
    );
  }
}

export default HomePage;
