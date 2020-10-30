import React, { Component } from "react";
import axios from "axios";

import Timer from "./Timer";
import Answers from "./Answers";
import Message from "./Message";

class Train extends Component {
  constructor(props) {
    super(props);
    this.state = {
      questionNumber: 0,
      question: {},
      inProgress: false,
      timer: 0,
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
      .get("/api/v1/question/" + questionType)
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
  updateTimerValue = () => {
    let { inProgress, timer } = this.state;

    if (!inProgress) {
      return;
    }

    if (timer - 1 === 0) {
      inProgress = false;
    }
    this.setState({
      inProgress: inProgress,
      timer: timer - 1,
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
    const introductionView = (
      <>
        <h1>Mode entraînement</h1>
        <p id="about">Répondez à une série de questions aléatoire.</p>
        <button onClick={this.getNewQuestion}>Lancer l'entraînement</button>
      </>
    );

    return (
      <main id="quiz">
        {error !== null && <Message type="error" content={error} />}
        {questionNumber === 0 ? (
          introductionView
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

            <Timer
              inProgress={inProgress}
              duration={timer}
              updateParent={this.updateTimerValue}
            />

            <Answers
              inProgress={inProgress}
              goodAnswer={question.goodAnswer}
              badAnswers={question.badAnswers}
              onClick={this.handleAnswerClick}
            />

            {!inProgress && (
              <button onClick={this.getNewQuestion}>Question suivante</button>
            )}
          </>
        )}
      </main>
    );
  }
}

export default Train;
