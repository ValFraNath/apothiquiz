import React from "react";

const AnswerBtn = ({value, isRight, showResult, onClick}) => {
  let classBtn = "";
  if (showResult) {
    classBtn = isRight ? "good-answer" : "bad-answer";
  }
  return <button id="quiz-answer" className={classBtn} onClick={onClick}>{value}</button>;
};

export default AnswerBtn;