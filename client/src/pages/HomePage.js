import { ChevronRightIcon } from "@modulz/radix-icons";
import axios from "axios";
import { PropTypes } from "prop-types";
import React from "react";
import { useQuery } from "react-query";

import { Link } from "react-router-dom";

import Avatar from "../components/Avatar";
import Loading from "../components/Loading";
import PageError from "../components/PageError";
import Plural from "../components/Plural";
import WaitPilette from "../images/attente.png";
import FightPilette from "../images/fight.png";
import AuthService from "../services/auth.service";

const HomePageHeader = ({ user }) => (
  <header>
    <div id="header-background"></div>
    <Avatar size="125px" infos={user.avatar} />

    <div>
      <h1>{user.pseudo}</h1>
      <p>
        {user.victories} <Plural word="victoire" count={user.victories} />
      </p>
      <p>
        {user.defeats} <Plural word="défaite" count={user.defeats} />
      </p>
    </div>
  </header>
);

HomePageHeader.propTypes = {
  user: PropTypes.shape({
    pseudo: PropTypes.string.isRequired,
    victories: PropTypes.number.isRequired,
    defeats: PropTypes.number.isRequired,
    avatar: PropTypes.shape({
      eyes: PropTypes.number,
      hands: PropTypes.number,
      hat: PropTypes.number,
      mouth: PropTypes.number,
      colorBody: PropTypes.string,
      colorBG: PropTypes.string,
    }).isRequired,
  }).isRequired,
};

const HomePage = () => {
  function getDuels() {
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

          const listOfUsers = new Set([currentUserPseudo]);

          duelData.forEach((val) => {
            if (val.inProgress === 0) {
              parsedData.finishedChallenges.push(val);
            } else if (val.rounds[val.currentRound - 1][0].userAnswer !== undefined) {
              // Current user has played the current round
              parsedData.pendingChallenges.push(val);
            } else {
              parsedData.toPlayChallenges.push(val);
            }

            listOfUsers.add(val.opponent);
          });

          axios
            .post("/api/v1/users/", [...listOfUsers])
            .then(({ data: usersData }) => {
              parsedData.currentUser = usersData[currentUserPseudo];
              parsedData.usersData = usersData;
              resolve(parsedData);
            })
            .catch((error) => {
              console.error("Oh non !", error);
              reject(error);
            });
        })
        .catch((error) => {
          console.error("Oh non !", error);
          reject(error);
        });
    });
  }

  function displayResultDuel(user, opponent) {
    if (user === opponent) return "Égalité !";
    if (user > opponent) return "Vous avez gagné !";
    return "Vous avez perdu";
  }

  const { isLoading, data, isError } = useQuery("duels", getDuels, {
    staleTime: 60 * 1000,
    retry: 1,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <PageError message="Erreur lors du chargement de la page" />;
  }

  const { toPlayChallenges, pendingChallenges, finishedChallenges, currentUser, usersData } = data;

  return (
    <main id="homepage">
      <HomePageHeader user={currentUser} />

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
          <img src={WaitPilette} alt="Pilette attend patiemment" /> En attente
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
                  <p>{displayResultDuel(value.userScore, value.opponentScore)}</p>
                </Link>
              </article>
            ))}
          </>
        </section>
      )}
    </main>
  );
};

export default HomePage;
