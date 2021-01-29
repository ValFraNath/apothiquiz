import React, { Component } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { PropTypes } from "prop-types";

import AuthService from "../services/auth.service";
import Avatar from "../components/Avatar";

const UserBadge = ({ user, reversed }) => {
  return (
    <div className="badge">
      <Avatar
        size="90px"
        eyes={user?.avatar?.eyes}
        hands={user?.avatar?.hands}
        hat={user?.avatar?.hat}
        mouth={user?.avatar?.mouth}
        colorBG={user?.avatar?.colorBG}
        colorBody={user?.avatar?.colorBody}
        reversed={reversed}
      />
      <span>{user?.pseudo ?? "Pseudonyme"}</span>
    </div>
  );
};

UserBadge.propTypes = {
  user: PropTypes.object,
  reversed: PropTypes.bool,
};

const ResultBricks = ({ user, answers }) => (
  <div className="result">
    <span>{user?.pseudo ?? "Pseudo"}</span>
    <div className="bricks">
      {answers.map((answerType, index) => (
        <span key={index} className={"brick " + answerType}></span>
      ))}
    </div>
  </div>
);

ResultBricks.propTypes = {
  user: PropTypes.object,
  answer: PropTypes.array,
};

class DuelOverview extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userScore: "-",
      opponentScore: "-",
      currentUser: null,
      opponent: null,
      rounds: [],
    };
  }

  componentDidMount() {
    const duelID = this.props.match.params.id;

    axios
      .get(`/api/v1/duels/${duelID}`)
      .then((res) => {
        this.setState({
          rounds: res.data.rounds,
          userScore: res.data.userScore,
          opponentScore: res.data.opponentScore,
        });

        // Will be replaced by cache later
        const opponent = res.data.opponent;
        const currentUser = AuthService.getCurrentUser();
        axios
          .post("/api/v1/users/", [currentUser.pseudo, opponent])
          .then((res) => {
            this.setState({
              currentUser: res.data[currentUser.pseudo],
              opponent: res.data[opponent],
            });
          })
          .catch((err) => console.error(err));
      })
      .catch((err) => {
        console.error("Error retrieving the duel", err);
        document.location.replace("/homepage");
      });
  }

  render() {
    const { currentUser, opponent, rounds: originalRounds } = this.state;
    const rounds = originalRounds.filter((round) => round[0].subject !== undefined);

    let currentUserCanPlay = false;
    if (rounds.length >= 1) {
      const lastRound = rounds[rounds.length - 1];
      const lastQuestion = lastRound[lastRound.length - 1];
      currentUserCanPlay = lastQuestion.userAnswer === undefined;
    }

    return (
      <main id="duel-overview">
        <header>
          <UserBadge user={currentUser} reversed={true} />
          <span>
            {this.state.userScore} — {this.state.opponentScore}
          </span>
          <UserBadge user={opponent} />
        </header>

        {currentUserCanPlay &&
          <Link
            to={`/duel/${this.props.match.params.id}/play`}
            className="btn"
            disabled={!currentUserCanPlay}
          >
            Jouer le tour {rounds.length}
          </Link>
        }
        

        {rounds.map((round, index) => {
          const userAnswers = [];
          const opponentAnswers = [];

          round.forEach((question) => {
            const good = question.goodAnswer;

            userAnswers.push(
              question?.userAnswer === undefined ? undefined : good === question.userAnswer
            );
            opponentAnswers.push(
              question?.opponentAnswer === undefined ? undefined : good === question.opponentAnswer
            );
          });

          return (
            <section key={index}>
              <h3>
                Tour {index + 1} : <span>{round[0].title}</span>
              </h3>

              <ResultBricks user={currentUser} answers={userAnswers} />

              <ResultBricks user={opponent} answers={opponentAnswers} />
            </section>
          );
        })}
      </main>
    );
  }
}

export default DuelOverview;
