import { ChevronRightIcon } from "@modulz/radix-icons";
import axios from "axios";
import React, { Component } from "react";
import { useQuery } from "react-query";

import { Link } from "react-router-dom";

import Avatar from "../components/Avatar";
import Plural from "../components/Plural";
import WaitPilette from "../images/attente.png";
import FightPilette from "../images/fight.png";
import AuthService from "../services/auth.service";

function UseQuery({ children, requestKey, callback, options }) {
  return children(useQuery(requestKey, callback, options));
}

class HomePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentUser: null,
      usersData: [],
      toPlayChallenges: [],
      pendingChallenges: [],
      finishedChallenges: [],
    };
  }

  getDuels() {
    return new Promise((resolve, reject) => {
      axios
        .get("/api/v1/duels/")
        .then(({ data: duelData }) => {
          const parsedData = {
            finishedChallenges: [],
            pendingChallenges: [],
            toPlayChallenges: [],
          };

          const currentUserPseudo = AuthService.getCurrentUser().pseudo;

          const listOfUsers = [currentUserPseudo];
          duelData.forEach((val) => {
            if (val.inProgress === 0) {
              parsedData.finishedChallenges.push(val);
            } else if (val.rounds[val.currentRound - 1][0].userAnswer !== undefined) {
              parsedData.pendingChallenges.push(val);
            } else {
              parsedData.toPlayChallenges.push(val);
            }

            if (!listOfUsers.includes(val.opponent)) {
              listOfUsers.push(val.opponent);
            }
          });

          axios
            .post("/api/v1/users/", listOfUsers)
            .then(({ data: usersData }) => {
              parsedData.currentUser = usersData[currentUserPseudo];
              parsedData.usersData = usersData;
              resolve(parsedData);
            })
            .catch((error) => {
              console.error(error); // TODO handle error
              reject();
            });
        })
        .catch((error) => {
          console.error(error); // TODO handle error
          reject();
        });
    });
  }

  displayResultDuel(user, opponent) {
    if (user === opponent) return "Égalité !";
    if (user > opponent) return "Vous avez gagné !";
    return "Vous avez perdu";
  }

  render() {
    return (
      <UseQuery requestKey="duels" callback={this.getDuels} options={{ staleTime: 10000 }}>
        {({ data, isLoading }) => {
          let toPlayChallenges = [],
            pendingChallenges = [],
            finishedChallenges = [],
            currentUser = undefined,
            usersData = [];

          if (!isLoading) {
            // eslint-disable-next-line prefer-destructuring
            toPlayChallenges = data.toPlayChallenges;
            // eslint-disable-next-line prefer-destructuring
            pendingChallenges = data.pendingChallenges;
            // eslint-disable-next-line prefer-destructuring
            finishedChallenges = data.finishedChallenges;
            // eslint-disable-next-line prefer-destructuring
            currentUser = data.currentUser;
            // eslint-disable-next-line prefer-destructuring
            usersData = data.usersData;
          }

          const cuVictories = currentUser?.victories ?? "-";
          const cuDefeats = currentUser?.defeats ?? "-";

          return (
            <main id="homepage">
              <header>
                <div id="header-background"></div>
                <Avatar size="125px" infos={currentUser?.avatar} />

                <div>
                  <h1>{currentUser?.pseudo ?? "Pilette"}</h1>
                  <p>
                    {cuVictories} <Plural word="victoire" count={cuVictories} />
                  </p>
                  <p>
                    {cuDefeats} <Plural word="défaite" count={cuDefeats} />
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
              {isLoading ? (
                <h2>Chargement...</h2>
              ) : (
                <>
                  <section>
                    <h2>
                      <img src={FightPilette} alt="Pilette est prête à affronter ses adversaires" />{" "}
                      Ton tour
                    </h2>
                    {toPlayChallenges.length === 0 ? (
                      <p>Aucun défi à relever pour le moment.</p>
                    ) : (
                      <>
                        {toPlayChallenges.map((value, index) => (
                          <article key={index}>
                            <Avatar size="75px" infos={usersData[value.opponent]?.avatar} />
                            <Link to={`/duel/${value.id}`} className="challenges-text">
                              <div>
                                <h3>{value.opponent}</h3>
                                <p>Vous pouvez jouer le round {value.currentRound}</p>
                              </div>
                              <ChevronRightIcon />
                            </Link>
                          </article>
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
                            <Avatar size="75px" infos={usersData[value.opponent]?.avatar} />
                          </article>
                        ))}
                      </>
                    )}
                  </section>
                  {finishedChallenges.length > 0 && (
                    <section>
                      <h2>Terminés</h2>
                      <>
                        {finishedChallenges.map((value, index) => (
                          <article key={index}>
                            <Avatar size="75px" infos={usersData[value.opponent]?.avatar} />
                            <Link to={`/duel/${value.id}`} className="challenges-text">
                              <h3>{value.opponent}</h3>
                              <p>{this.displayResultDuel(value.userScore, value.opponentScore)}</p>
                            </Link>
                          </article>
                        ))}
                      </>
                    </section>
                  )}
                </>
              )}
            </main>
          );
        }}
      </UseQuery>
    );
  }
}

export default HomePage;
