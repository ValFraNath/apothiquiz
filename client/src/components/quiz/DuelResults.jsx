import PropTypes from "prop-types";
import React from "react";

const DuelResults = ({ user, opponent, score, opponentScore }) => {
  let winStatus = "draw";
  if (score !== opponentScore) {
    winStatus = score > opponentScore ? "victory" : "defeat";
  }

  let title;
  switch (winStatus) {
    case "victory":
      title = "Duel remporté !";
      break;

    case "defeat":
      title = "Duel perdu";
      break;

    default:
      title = "Égalité";
  }

  return (
    <div className={"duel-results " + winStatus}>
      <h3>{title}</h3>
    </div>
  );
};

DuelResults.propTypes = {
  user: PropTypes.shape({ pseudo: PropTypes.string.isRequired }).isRequired,
  opponent: PropTypes.shape({ pseudo: PropTypes.string.isRequired }).isRequired,
  score: PropTypes.number.isRequired,
  opponentScore: PropTypes.number.isRequired,
};

export default DuelResults;
