import React from "react";

const AnswerBtn = ({ value, isRight, showResult, onClick }) => {
  let classBtn = "";
  if (showResult) {
    classBtn = isRight ? "good-answer" : "bad-answer";
  }
  return (
    <button
      id="quiz-answer"
      className={classBtn}
      onClick={() => onClick(isRight)}
    >
      {value}
    </button>
  );
};

const Answers = ({ inProgress, goodAnswer, badAnswers, onClick }) => {
  const arrayOfAnswers = [...badAnswers];

  const goodAnswerIndex = Math.floor(Math.random() * 3);
  arrayOfAnswers.splice(goodAnswerIndex, 0, goodAnswer);

  console.log(arrayOfAnswers);

  return (
    <div id="quiz-answers">
      { arrayOfAnswers.map(
        (value, index) => (
          <AnswerBtn key={index} value={value} isRight={value === goodAnswer} showResult={!inProgress} onClick={onClick} />
        )
      )}
    </div>
  );
}

export default Answers;