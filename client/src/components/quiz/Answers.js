import PropTypes from "prop-types";
import React from "react";

/* ---------- Buttons ---------- */

const AnswerBtn = ({ value, isRight, showResult, onClick }) => {
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
      {value}
    </button>
  );
};

AnswerBtn.propTypes = {
  value: PropTypes.string.isRequired,
  isRight: PropTypes.bool.isRequired,
  showResult: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

/* ---------- List of buttons ---------- */

const Answers = ({ inProgress, answers, goodAnswerIndex, lastClicked, onClick }) => {
  return (
    <div id="quiz-answers">
      {answers.map((value, index) => (
        <AnswerBtn
          key={index}
          value={value}
          isRight={index === goodAnswerIndex}
          showResult={!inProgress && (index === goodAnswerIndex || lastClicked === value)}
          onClick={onClick}
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
};

export default Answers;
