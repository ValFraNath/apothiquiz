import PropTypes from "prop-types";
import React from "react";

/* ---------- Buttons ---------- */

const AnswerBtn = ({ value, isRight, showResult, onClick, isImage }) => {
  let classBtn = "";
  if (showResult) classBtn = isRight ? "good-answer" : "bad-answer";

  return (
    <button
      className={classBtn}
      onClick={() => {
        if (showResult) return;
        onClick(value);
      }}
    >
      {isImage ? <img src={value} alt="Réponse" /> : value}
    </button>
  );
};

AnswerBtn.propTypes = {
  value: PropTypes.string.isRequired,
  isRight: PropTypes.bool.isRequired,
  showResult: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  isImage: PropTypes.bool,
};

/* ---------- List of buttons ---------- */

const Answers = ({ inProgress, answers, goodAnswerIndex, lastClicked, onClick, areImage }) => {
  return (
    <div id="quiz-answers" className={areImage ? "answers-images" : ""}>
      {answers.map((value, index) => (
        <AnswerBtn
          key={index}
          value={value}
          isRight={index === goodAnswerIndex}
          showResult={!inProgress && (index === goodAnswerIndex || lastClicked === value)}
          onClick={onClick}
          isImage={areImage}
        />
      ))}
    </div>
  );
};

Answers.propTypes = {
  inProgress: PropTypes.bool.isRequired,
  goodAnswerIndex: PropTypes.number.isRequired,
  answers: PropTypes.arrayOf(PropTypes.string).isRequired,
  lastClicked: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  areImage: PropTypes.bool,
};

export default Answers;
