import React, { Component } from "react";

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
        <p>Une série de questions</p>
        <button onClick={this.getNewQuestion}>Lancer l'entraînement</button>
      </>
    );

    return (
      <div>
        { this.state.questionNumber === 0 ?
          introductionView :
          <>
            <h2>Question n°{questionNumber}</h2>
            <h1>{question.subject}</h1>

            <p id="question-timer">{time} s</p>

            <div id="question-answers">
              {
                answers.map((value, index) => (
                  <button key={index}>{value}</button>
                ))
              }
            </div>

          </>
        }
      </div>
    );
  }
}

export default Train;