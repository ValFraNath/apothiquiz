import PropTypes from "prop-types";
import React from "react";

import Grammar1 from "../../images/grammar-1.png";
import Grammar2 from "../../images/grammar-2.png";
import Grammar3 from "../../images/grammar-3.png";

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
      <button>
        <img src={Grammar1} alt="Grammar1" />
      </button>
      <button>
        <img src={Grammar2} alt="Grammar2" />
      </button>
      <button>
        <img src={Grammar3} alt="Grammar3" />
      </button>
      {/* {answers.map((value, index) => (
        <AnswerBtn
          key={index}
          value={value}
          isRight={index === goodAnswerIndex}
          showResult={!inProgress && (index === goodAnswerIndex || lastClicked === value)}
          onClick={onClick}
        />
      ))} */}
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
