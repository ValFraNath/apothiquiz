import React, { Component } from "react";
import axios from "axios";
import PropTypes from "proptypes";
import { ArrowRightIcon } from "@modulz/radix-icons";

import Timer from "../quizz/Timer";
import Answers from "../quizz/Answers";
import Message from "../quizz/Message";

const IntroductionView = ({ onClick }) => {
  return (
    <>
      <h1>Mode entraînement</h1>
      <p id="about">Répondez à une série de questions aléatoire.</p>
      <button onClick={onClick}>Lancer l'entraînement</button>
    </>
  );
};

IntroductionView.propTypes = {
  onClick: PropTypes.func.isRequired,
};

class Train extends Component {
  constructor(props) {
    super(props);
    this.state = {
      questionNumber: 0,
      question: {},
      inProgress: false,
      timer: 10,
      result: {
        good: 0,
        bad: 0,
      },
      error: null,
    };
  }

  /**
   * Get a new question (random type) from the server
   */
  getNewQuestion = () => {
    const minQuestionType = 1,
      maxQuestionType = 1;
    const questionType =
      Math.floor(Math.random() * (maxQuestionType - minQuestionType)) +
      minQuestionType;

    axios
      .get(`/api/v1/question/${questionType}`)
      .then((res) => {
        this.setState({
          question: res.data.question,
          questionNumber: this.state.questionNumber + 1,
          inProgress: true,
          timer: 10,
          error: null,
        });
      })
      .catch(() =>
        this.setState({
          error: "Impossible de récupérer les données depuis le serveur.",
        })
      );
  };

  /**
   * Generate the text of the question according to its type
   * @returns {string} Text of the question
   */
  generateQuestionText() {
    const { type, subject } = this.state.question;
    let text;
    switch (type) {
      case 1:
        text = 'Quelle molécule fait partie de la classe "' + subject + '" ?';
        break;
      default:
        text = "Erreur : type de question invalide.";
    }

    return text;
  }

  /**
   * Update the timer
   */
  updateTimer = (value) => {
    let { inProgress, result } = this.state;

    if (!inProgress) return false;
    if (value === 0) {
      result.bad += 1;
      inProgress = false;
    }

    this.setState({
      inProgress: inProgress,
      timer: value,
      result: result,
    });
  };

  /**
   * Handle a click on an answer button
   * @param isRightAnswer True if the click is performed on the right answer
   */
  handleAnswerClick = (isRightAnswer) => {
    if (!this.state.inProgress) {
      return;
    }

    const result = this.state.result;
    const { goodPoint, badPoint } = isRightAnswer
      ? { goodPoint: 1, badPoint: 0 }
      : { goodPoint: 0, badPoint: 1 };
    this.setState({
      inProgress: false,
      result: {
        good: result.good + goodPoint,
        bad: result.bad + badPoint,
      },
    });
  };

  render() {
    const {
      question,
      questionNumber,
      inProgress,
      timer,
      result,
      error,
    } = this.state;

    return (
      <main id="quiz">
        {error !== null && <Message type="error" content={error} />}
        {questionNumber === 0 ? (
          <IntroductionView onClick={this.getNewQuestion} />
        ) : (
          <>
            <div id="quiz-score">
              <p id="good-score">{result.good} bonnes réponses</p>
              <p id="bad-score">{result.bad} mauvaises réponses</p>
            </div>

            <div id="quiz-question">
              <h2>Question {questionNumber}</h2>
              <h1>{this.generateQuestionText()}</h1>
            </div>

            {inProgress ? (
              <Timer
                inProgress={inProgress}
                duration={timer}
                updateParent={this.updateTimer}
              />
            ) : (
              <div id="next-btn">
                <button onClick={this.getNewQuestion}>
                  Question suivante
                  <ArrowRightIcon />
                </button>
              </div>
            )}

            <Answers
              inProgress={inProgress}
              goodAnswer={question.goodAnswer}
              badAnswers={question.badAnswers}
              onClick={this.handleAnswerClick}
            />
          </>
        )}
      </main>
    );
  }
}

export default Train;
