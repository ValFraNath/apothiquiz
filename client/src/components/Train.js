import React, { Component } from "react";

import Timer from "./Timer";

class Train extends Component {
  constructor(props) {
    super(props);
    this.state = {
      question: {},
      answers: [],
      questionNumber: 0,
      time: null
    };
  }

  getNewQuestion = () => {
    const newQuestion = {
      type: 1,
      subject: "heprès",
      goodAnswer: "valganciclovir",
      badAnswers: [
        "zidovudine",
        "efavirenz",
        "lamotrigine"
      ]
    };

    const newAnswers = [newQuestion.goodAnswer, ...newQuestion.badAnswers];

    this.setState({
      question: newQuestion,
      questionNumber: this.state.questionNumber + 1,
      answers: newAnswers,
      time: 5
    });
  }

  render() {
    const { question, answers, questionNumber, time } = this.state;
    const introductionView = (
      <>
        <h1>Mode entraînement</h1>
        <p id="about">Répondez à une série de questions aléatoire.</p>
        <button onClick={this.getNewQuestion}>Lancer l'entraînement</button>
      </>
    );

    return (
      <main id="quiz">
        { this.state.questionNumber === 0 ?
          introductionView :
          <>
            <h2>Question {questionNumber}</h2>
            <h1>{question.subject}</h1>

            <Timer duration={10} />

            <div id="question-answers">
              {
                answers.map((value, index) => (
                  <button key={index}>{value}</button>
                ))
              }
            </div>
          </>
        }
      </main>
    );
  }
}

export default Train;