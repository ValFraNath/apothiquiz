import { PropTypes } from "prop-types";
import React, { useEffect, useMemo } from "react";
import { useQuery } from "react-query";
import { Link, useHistory } from "react-router-dom";

import Avatar from "../components/Avatar";
import DuelResults from "../components/quiz/DuelResults";
import RemainingTime from "../components/RemainingTime";
import Loading from "../components/status/Loading";
import PageError from "../components/status/PageError";
import AntiCheat from "../utils/antiCheat";
import { incrementDate, setDateToNextHour } from "../utils/handleDates";
import { makeGetDuelDetails } from "../utils/queryDuels";

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

ResultBricks.propTypes = {
  user: PropTypes.object,
  answers: PropTypes.arrayOf(PropTypes.bool),
};

/**
 * Transform an array of rounds into an array of answers
 * For each rounds, answers are given for each user with true, false or undefined
 *
 * @param {Array<Array<Object>>}   rounds
 *
 * @return {Array<Array<Boolean>>}
 */
function roundsToAnswers(rounds) {
  if (rounds === undefined) {
    return {
      answers: [],
      userCanPlay: false,
    };
  }

  const parseAnswer = (question, answer) => {
    if (answer === undefined) return undefined;
    return answer === question.goodAnswer;
  };

  const playedRounds = rounds.filter((round) => round[0].subject !== undefined);

  const answers = playedRounds.map((round) => {
    const user = round.map((question) => parseAnswer(question, question?.userAnswer));
    const opponent = round.map((questions) => parseAnswer(questions, questions?.opponentAnswer));

    return { title: round[0].title, user, opponent };
  });

  return answers;
}

const DuelOverview = ({
  match: {
    params: { id: duelId },
  },
}) => {
  const history = useHistory();
  useEffect(() => {
    if (AntiCheat.isDuelBroken(duelId)) {
      history.push("/homepage");
    }
  });

  const { isLoading, data, isError } = useQuery(["duel", duelId], makeGetDuelDetails(duelId));
  const { data: currentUser } = useQuery(["user", "me"]);

  const answers = useMemo(() => roundsToAnswers(data?.rounds), [data?.rounds]);

  if (isLoading) {
    return <Loading />;
  }

  if (isError) {
    return <PageError message="Échec du chargement du duel" />;
  }

  const { currentUserScore, opponentScore, opponent, inProgress, finishedDate, TTL } = data;

  const removingTime = (function () {
    const date = incrementDate({ days: Number(TTL) }, new Date(finishedDate));
    return setDateToNextHour(date, 0, 1);
  })();

  // Can the current user play the current round?
  const answersToLastRound = answers[answers.length - 1].user;
  const userCanPlay = answersToLastRound[answersToLastRound.length - 1] === undefined;

  return (
    <main id="duel-overview">
      <header>
        <UserBadge user={currentUser} reversed={true} />
        <span>
          {currentUserScore} — {opponentScore}
        </span>
        <UserBadge user={opponent} reversed={false} />
      </header>

      {inProgress ? (
        <Link to={`/duel/${duelId}/play`} className="btn" disabled={!userCanPlay}>
          {userCanPlay ? `Jouer le tour ${answers.length}` : "En attente de l'adversaire"}
        </Link>
      ) : (
        <>
          <DuelResults
            user={currentUser}
            opponent={opponent}
            score={currentUserScore}
            opponentScore={opponentScore}
          />
          <p id="TTL">
            Temps avant suppression du duel : <RemainingTime finalDate={removingTime} />
          </p>
        </>
      )}

      {answers.map((answer, index) => (
        <section key={index}>
          <h3>
            Tour {index + 1} : <span>{answer.title}</span>
          </h3>
          <ResultBricks user={currentUser} answers={answer.user} />
          <ResultBricks user={opponent} answers={answer.opponent} />
        </section>
      ))}
    </main>
  );
};

DuelOverview.propTypes = {
  match: PropTypes.object.isRequired,
};

export default DuelOverview;
