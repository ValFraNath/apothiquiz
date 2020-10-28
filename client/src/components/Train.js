import React, { Component } from "react";

import Timer from "./Timer";

class Train extends Component {
  constructor(props) {
    super(props);
    this.state = {
      question: {},
      questionNumber: 0,
      inProgress: false
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

    this.setState({
      question: newQuestion,
      questionNumber: this.state.questionNumber + 1,
      inProgress: true
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

  updateInProgress = () => {
    this.setState({ inProgress: false });
  };

  render() {
    const { question, questionNumber, inProgress } = this.state;
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
            <h2>Question {questionNumber}</h2>
            <h1>{this.generateQuestionText()}</h1>

            <Timer duration={10} stopTimer={this.updateInProgress} />

            <div id="question-answers">
              {
                [question.goodAnswer, ...question.badAnswers].map((value, index) => (
                  <button key={index}>{value}</button>
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