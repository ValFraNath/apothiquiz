import axios from "axios";
import { PropTypes } from "prop-types";
import React, { Component } from "react";
import { Link } from "react-router-dom";

import Avatar from "../components/Avatar";
import AuthService from "../services/auth.service";

const UserBadge = ({ user, reversed }) => (
  <div className="badge">
    <Avatar size="90px" infos={user?.avatar} reversed={reversed} />
    <span>{user?.pseudo ?? "Pseudonyme"}</span>
  </div>
);

UserBadge.propTypes = {
  user: PropTypes.object,
  reversed: PropTypes.bool,
};

const ResultBricks = ({ user, answers }) => (
  <div className="result">
    <span>{user.pseudo}</span>
    <div className="bricks">
      {answers.map((answerType, index) => (
        <span key={index} className={"brick " + answerType}></span>
      ))}
    </div>
  </div>
);

ResultBricks.defaultProps = {
  user: { pseudo: "Pseudo" },
  answers: Array(5).fill("undefined"),
};

ResultBricks.propTypes = {
  user: PropTypes.object,
  answers: PropTypes.array,
};

class DuelOverview extends Component {
  constructor(props) {
    super(props);

    this.state = {
      currentUserScore: "-",
      opponentScore: "-",
      currentUser: undefined,
      opponent: undefined,
      inProgress: false,
      currentUserCanPlay: false,
      answers: [],
    };
  }

  componentDidMount() {
    const duelID = this.props.match.params.id;

    axios
      .get(`/api/v1/duels/${duelID}`)
      .then((res) => {
        this.parseDuelInfo(res.data);

        // Will be replaced by cache later
        const { opponent } = res.data;
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

  parseDuelInfo(data) {
    function isAnswerCorrect(question, answer) {
      if (answer === undefined) return undefined;
      return answer === question.goodAnswer;
    }

    // Transform the rounds into an array of answers
    const playedRounds = data.rounds.filter((round) => round[0].subject !== undefined);

    const answers = playedRounds.map((round) => {
      const userAnswers = round.map((question) => isAnswerCorrect(question, question?.userAnswer));

      const opponentAnswers = round.map((question) =>
        isAnswerCorrect(question, question?.opponentAnswer)
      );

      return { title: round[0].title, userAnswers, opponentAnswers };
    });

    // Can the current user play the next round?
    const answersToLastRound = answers[answers.length - 1].userAnswers;
    const currentUserCanPlay = answersToLastRound[answersToLastRound.length - 1] === undefined;

    // Saving informations in the state
    this.setState({
      answers,
      currentUserScore: data.userScore,
      opponentScore: data.opponentScore,
      inProgress: data.inProgress,
      currentUserCanPlay,
    });
  }

  render() {
    const {
      currentUserScore,
      opponentScore,
      currentUser,
      opponent,
      answers,
      inProgress,
      currentUserCanPlay,
    } = this.state;

    return (
      <main id="duel-overview">
        <header>
          <UserBadge user={currentUser} reversed={true} />
          <span>
            {currentUserScore} — {opponentScore}
          </span>
          <UserBadge user={opponent} />
        </header>

        {inProgress && (
          <Link
            to={`/duel/${this.props.match.params.id}/play`}
            className="btn"
            disabled={!currentUserCanPlay}
          >
            {currentUserCanPlay ? `Jouer le tour ${answers.length}` : "En attente de l'adversaire"}
          </Link>
        )}

        {answers.map((answer, index) => (
          <section key={index}>
            <h3>
              Tour {index + 1} : <span>{answer.title}</span>
            </h3>
            <ResultBricks user={currentUser} answers={answer.userAnswers} />
            <ResultBricks user={opponent} answers={answer.opponentAnswers} />
          </section>
        ))}
      </main>
    );
  }
}

DuelOverview.propTypes = {
  match: PropTypes.object.isRequired,
};

export default DuelOverview;
