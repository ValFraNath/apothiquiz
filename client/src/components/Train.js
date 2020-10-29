import React, { Component } from "react";
import axios from "axios";

import Timer from "./Timer";
import AnswerBtn from "./AnswerBtn";

class Train extends Component {
  constructor(props) {
    super(props);
    this.state = {
      question: {},
      questionNumber: 0,
      inProgress: false,
      timer: 0,
      result: {
        good: 0,
        bad: 0
      }
    };
  }

  getNewQuestion = () => {
    const minId = 1, maxId = 1;
    const questionType = Math.floor(Math.random() * (maxId - minId) ) + minId;

    axios
      .get("/api/v1/question/" + questionType)
      .then(res => {
        this.setState({
          question: res.data.question,
          questionNumber: this.state.questionNumber + 1,
          inProgress: true,
          timer: 10
        });
      });
  };

  generateQuestionText() {
    const { type, subject } = this.state.question;
    let text;
    switch (type) {
      case 1:
        text = "Quelle molécule fait partie de la classe \"" + subject + "\" ?";
        break;
      default:
        text = "Erreur : type de question invalide.";
    }

    return text;
  }

  updateTimerValue = () => {
    let { inProgress, timer } = this.state;

    if (timer - 1 === 0) {
      inProgress = false;
    }
    this.setState({
      inProgress: inProgress,
      timer: timer - 1
    });
  };

  handleAnswerClick = (isRightAnswer) => {
    if (!this.state.inProgress) {
      return;
    }

    const result = this.state.result;

    const goodPoint = isRightAnswer ? 1 : 0;
    const badPoint = 1 - goodPoint;

    this.setState({
      inProgress: false,
      result: {
        good: result.good + goodPoint,
        bad: result.bad + badPoint
      }
    });
  };

  render() {
    const { question, questionNumber, inProgress, timer, result } = this.state;
    const introductionView = (
      <>
        <h1>Mode entraînement</h1>
        <p id="about">Répondez à une série de questions aléatoire.</p>
        <button onClick={this.getNewQuestion}>Lancer l'entraînement</button>
      </>
    );

    return (
      <main id="quiz">
        { questionNumber === 0 ?
          introductionView :
          <>
            <section id="score">
              <p id="good-score">{result.good} bonnes réponses</p>
              <p id="bad-score">{result.bad} mauvaises réponses</p>
            </section>
            <h2>Question {questionNumber}</h2>
            <h1>{this.generateQuestionText()}</h1>

            <Timer inProgress={inProgress} duration={timer} updateParent={this.updateTimerValue} />

            <div id="quiz-answers">
              { [question.goodAnswer, ...question.badAnswers].map((value, index) => (
                  <AnswerBtn
                    key={index}
                    value={value}
                    isRight={value === question.goodAnswer}
                    showResult={!inProgress}
                    onClick={this.handleAnswerClick}
                  />
                ))
              }
            </div>

            { !inProgress &&
              <button onClick={this.getNewQuestion}>Question suivante</button>
            }
          </>
        }
      </main>
    );
  }
}

export default Train;