import React, { useState, useEffect } from "react";
import PropTypes from "proptypes";

const AnswerBtn = ({ value, isRight, showResult, onClick }) => {
  let classBtn = "";
  if (showResult) {
    classBtn = isRight ? "good-answer" : "bad-answer";
  }

  return (
    <button
      id="quiz-answer"
      className={classBtn}
      onClick={() => {
        if (showResult) return;
        onClick(isRight, value);
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

const Answers = ({ inProgress, goodAnswer, badAnswers, lastClicked, onClick }) => {
  const [goodIndex, setGoodIndex] = useState(0);
  const arrayOfAnswers = [...badAnswers];

  const numberOfQuestion = 4;
  useEffect(() => {
    const index = Math.floor(Math.random() * numberOfQuestion);
    setGoodIndex(index);
  }, [goodAnswer]);

  arrayOfAnswers.splice(goodIndex, 0, goodAnswer);

  return (
    <div id="quiz-answers">
      {arrayOfAnswers.map((value, index) => (
        <AnswerBtn
          key={index}
          value={value}
          isRight={value === goodAnswer}
          showResult={!inProgress && (value === goodAnswer || lastClicked === value)}
          onClick={onClick}
        />
      ))}
    </div>
  );
};

Answers.propTypes = {
  inProgress: PropTypes.bool.isRequired,
  goodAnswer: PropTypes.string.isRequired,
  badAnswers: PropTypes.arrayOf(PropTypes.string).isRequired,
  lastClicked: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default Answers;
