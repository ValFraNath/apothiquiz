import React, { Component } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { ArrowRightIcon, CheckCircledIcon, CrossCircledIcon, ExitIcon } from "@modulz/radix-icons";

import Question from "../components/quiz/Question";
import Timer from "../components/quiz/Timer";
import Answers from "../components/quiz/Answers";
import Message from "../components/quiz/Message";
import InformationPilette from "../images/information_crop.png";
import ButtonDefault from "../components/buttons/ButtonDefault";
import ButtonCircle from "../components/buttons/ButtonCircle";

/* ---------- Introduction view ---------- */

const IntroductionView = ({ onClick }) => {
  return (
    <>
      <img src={InformationPilette} alt="Pilette is thinking deeply" id="" />
      <div>
        <h1>Mode entraînement</h1>
        <p id="about">Répondez à une série de questions aléatoire.</p>
      </div>
      <ButtonDefault onClick={onClick}>Lancer l'entraînement</ButtonDefault>
    </>
  );
};

IntroductionView.propTypes = {
  onClick: PropTypes.func.isRequired,
};

/* ---------- Play view ---------- */

class PlayView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      questionNum: 1,
      inProgress: true,
      lastClicked: "",
      timer: Train.TIMER_DURATION,
    };
  }

  /**
   * Update the timer
   * @param {number} value New timer value
   */
  updateTimer = (value) => {
    let { inProgress } = this.state;

    if (!inProgress) return false;
    if (value === 0) {
      this.props.addUserAnswer(this.state.currentQuestion, null);
      inProgress = false;
    }

    this.setState({
      inProgress: inProgress,
      timer: value,
    });
  };

  /**
   * Handle a click on an answer button
   * @param {string} value The clicked answer
   */
  handleAnswerClick = (value) => {
    if (!this.state.inProgress) return;
    this.props.addUserAnswer(this.props.question.wording, value);
    this.setState({
      inProgress: false,
      lastClicked: value,
    });
  };

  /**
   * Get the next question
   */
  nextQuestion = () => {
    this.props.getNewQuestion();
    this.setState({
      questionNum: this.state.questionNum + 1,
      inProgress: true,
      lastClicked: "",
      timer: Train.TIMER_DURATION,
    });
  };

  render() {
    const { questionNum, inProgress, timer, lastClicked } = this.state;
    const { result, question, displaySummury } = this.props;

    return (
      <>
        <div id="quiz-topbar">
          <div>
            <span id="score-good">
              <CheckCircledIcon /> {result.good.length}
            </span>
            <span id="score-bad">
              <CrossCircledIcon /> {result.bad.length}
            </span>
          </div>
          <div>
            <button onClick={displaySummury}>
              <ExitIcon /> Terminer
            </button>
          </div>
        </div>

        <Question numero={questionNum} text={question.wording} />

        {inProgress ? (
          <Timer inProgress={inProgress} duration={timer} updateParent={this.updateTimer} />
        ) : (
          <div id="next-btn">
            <ButtonCircle onClick={this.nextQuestion}>
              <ArrowRightIcon />
            </ButtonCircle>
          </div>
        )}

        <Answers
          inProgress={inProgress}
          goodAnswerIndex={question.goodAnswer}
          answers={question.answers}
          lastClicked={lastClicked}
          onClick={this.handleAnswerClick}
        />
      </>
    );
  }
}

PlayView.propTypes = {
  result: PropTypes.object.isRequired,
  question: PropTypes.object.isRequired,
  getNewQuestion: PropTypes.func.isRequired,
  addUserAnswer: PropTypes.func.isRequired,
  displaySummury: PropTypes.func.isRequired,
};

/* ---------- Summury view ---------- */

const SummaryView = ({ result }) => {
  return (
    <>
      <h1>Résultat</h1>
      <p>
        Votre score : {result.good.length}/{result.good.length + result.bad.length}
      </p>

      <details>
        <summary>Les bonnes réponses</summary>
        <ul>
          {result.good.length === 0 ? (
            <li key={0}>Aucune bonne réponse.</li>
          ) : (
            <>
              {result.good.map((value, index) => (
                <li key={index}>
                  <p>{value.question}</p>
                  <p>{value.userChoice}</p>
                </li>
              ))}
            </>
          )}
        </ul>
      </details>

      <h2>Les erreurs</h2>
      <ul>
        {result.bad.length === 0 ? (
          <li key={0}>Aucune mauvaise réponse.</li>
        ) : (
          <>
            {result.bad.map((value, index) => (
              <li key={index}>
                <p>{value.question}</p>
                <p>
                  <span>{value.userChoice}</span>
                  <span>
                    <ArrowRightIcon />
                  </span>
                  <span>{value.goodChoice}</span>
                </p>
              </li>
            ))}
          </>
        )}
      </ul>
    </>
  );
};

SummaryView.propTypes = {
  result: PropTypes.shape({
    good: PropTypes.array.isRequired,
    bad: PropTypes.array.isRequired,
  }).isRequired,
};

/* ---------- Train ---------- */

class Train extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gameState: Train.STATE_INTRO,
      question: { answers: [], goodAnswerIndex: -1, subject: "", type: 0 },
      result: { good: [], bad: [] },
      error: null,
    };
  }

  /**
   * Get a new question (random type) from the server
   * @param {number} nthRetry The number of attempts
   */
  getNewQuestion = (nthRetry = 0) => {
    const minQuestionType = 1,
      maxQuestionType = 10;
    const questionType =
      Math.floor(Math.random() * (maxQuestionType - minQuestionType)) + minQuestionType;
    axios
      .get(`/api/v1/question/${questionType}`)
      .then((res) => {
        this.setState({
          gameState: Train.STATE_PLAY,
          question: res.data,
          inProgress: true,
          lastClicked: "",
          timer: 10,
          error: null,
        });
      })
      .catch((error) => {
        if (error.response?.status === 422 && nthRetry < 10) {
          this.getNewQuestion(nthRetry + 1);
          return;
        }
        this.setState({
          error: "Impossible de récupérer les données depuis le serveur.",
        });
      });
  };

  /**
   * Add the question and the answer to the list of results
   * @param {string} question The question text
   * @param {string} userChoice The user's answer
   */
  addUserAnswer = (question, userChoice) => {
    const { good, bad } = this.state.result;
    const { answers, goodAnswer } = this.state.question;
    const rightAnswer = answers[goodAnswer];

    if (userChoice === rightAnswer) {
      good.push({ question: question, userChoice: userChoice });
    } else {
      bad.push({ question: question, userChoice: userChoice, goodChoice: rightAnswer });
    }
    this.setState({
      result: { good: good, bad: bad },
    });
  };

  /**
   * Change the state of the game to display the summury
   */
  displaySummury = () => {
    this.setState({
      gameState: Train.STATE_SUMMARY,
    });
  };

  /**
   * Change the main component according to the state of the game
   */
  switchComponent() {
    switch (this.state.gameState) {
      case Train.STATE_INTRO:
        return <IntroductionView onClick={() => this.getNewQuestion()} />;
      case Train.STATE_PLAY:
        return (
          <PlayView
            result={this.state.result}
            question={this.state.question}
            getNewQuestion={this.getNewQuestion}
            addUserAnswer={this.addUserAnswer}
            displaySummury={this.displaySummury}
          />
        );
      case Train.STATE_SUMMARY:
        return <SummaryView result={this.state.result} />;
      default:
        return <pre>Error</pre>;
    }
  }

  render() {
    const { gameState, error } = this.state;
    let additionalClass = "";
    if (gameState === Train.STATE_INTRO) {
      additionalClass = "quiz-intro";
    } else if (gameState === Train.STATE_SUMMARY) {
      additionalClass = "quiz-summury";
    }

    return (
      <main id="quiz" className={additionalClass}>
        {error !== null && <Message type="error" content={error} />}
        {this.switchComponent()}
      </main>
    );
  }
}

Train.STATE_INTRO = 0;
Train.STATE_PLAY = 1;
Train.STATE_SUMMARY = 2;

Train.TIMER_DURATION = 10;

export default Train;
