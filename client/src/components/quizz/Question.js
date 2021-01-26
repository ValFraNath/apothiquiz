import React from "react";
import PropTypes from "proptypes";

const Question = ({ numero, text }) => {
  return (
    <div id="quiz-question">
      <h2>Question {numero}</h2>
      <h1>{text}</h1>
    </div>
  );
};

Question.propTypes = {
  numero: PropTypes.number.isRequired,
  text: PropTypes.string.isRequired,
};

export default Question;
