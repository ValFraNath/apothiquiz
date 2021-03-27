import PropTypes from "prop-types";
import React from "react";

const Question = ({ numero, maxQuestion = -1, text, image }) => {
  return (
    <div id="quiz-question">
      <h2>
        Question {numero}
        {maxQuestion > 0 && <span>/{maxQuestion}</span>}
      </h2>
      <h1>
        {text}
        {image && <img src={image} alt="Molécule du sujet de la question" />}
      </h1>
    </div>
  );
};

Question.propTypes = {
  numero: PropTypes.number.isRequired,
  maxQuestion: PropTypes.number,
  text: PropTypes.string.isRequired,
  image: PropTypes.string,
};

export default Question;
