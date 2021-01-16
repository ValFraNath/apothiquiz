import React, { Component } from "react";
import axios from "axios";
import PropTypes from "proptypes";
import { ArrowRightIcon, CheckCircledIcon, CrossCircledIcon, ExitIcon } from "@modulz/radix-icons";

import Timer from "../quizz/Timer";
import Answers from "../quizz/Answers";
import Message from "../quizz/Message";
import InformationPilette from "../../images/information_crop.png";
import ButtonDefault from "../Buttons/ButtonDefault";
import ButtonCircle from "../Buttons/ButtonCircle";

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
      currentQuestion: this.generateQuestionText(),
      questionNum: 1,
      inProgress: true,
      lastClicked: "",
      timer: this.props.timerDuration,
    };
  }

  /**
   * Generate the text of the question according to its type
   * @returns {string} Text of the question
   */
  generateQuestionText() {
    const { type, subject } = this.props.question;
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
    let { inProgress } = this.state;

    if (!inProgress) return false;
    if (value === 0) {
      this.props.updateResult(false);
      inProgress = false;
    }

    this.setState({
      inProgress: inProgress,
      timer: value,
    });
  };

  /**
   * Handle a click on an answer button
   * @param isRightAnswer True if the click is performed on the right answer
   */
  handleAnswerClick = (isRightAnswer, value) => {
    if (!this.state.inProgress) return;

    this.props.updateResult(isRightAnswer);
    if (!isRightAnswer) this.props.addWrongAnswer(this.state.currentQuestion, value);
    this.setState({
      inProgress: false,
      lastClicked: value,
    });
  };

  /**
   * Get the next question and update the state
   */
  nextQuestion = () => {
    this.props.getNewQuestion();
    this.setState({
      currentQuestion: this.generateQuestionText(),
      questionNum: this.state.questionNum + 1,
      inProgress: true,
      lastClicked: "",
      timer: this.props.timerDuration,
    });
  };

  render() {
    const { currentQuestion, questionNum, inProgress, timer, lastClicked } = this.state;
    const { result, question, displaySummury } = this.props;

    return (
      <>
        <div id="quiz-topbar">
          <div>
            <span id="score-good">
              <CheckCircledIcon /> {result.good}
            </span>
            <span id="score-bad">
              <CrossCircledIcon /> {result.bad}
            </span>
          </div>
          <div>
            <button onClick={displaySummury}>
              <ExitIcon /> Terminer
            </button>
          </div>
        </div>

        <div id="quiz-question">
          <h2>Question {questionNum}</h2>
          <h1>{currentQuestion}</h1>
        </div>

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
          goodAnswer={question.goodAnswer}
          badAnswers={question.badAnswers}
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
  timerDuration: PropTypes.number.isRequired,
  getNewQuestion: PropTypes.func.isRequired,
  displaySummury: PropTypes.func.isRequired,
};

/* ---------- Summury view ---------- */

const SummuryView = ({ result, answers }) => {
  return (
    <>
      <h1>Résultat</h1>
      <p>
        Votre score : {result.good}/{result.good + result.bad}
      </p>

      <ul>
        {answers.map((value) => (
          <li>
            <p>{value.question}</p>
            <p>
              <span className="wrong">{value.userChoice}</span>
              <span>
                <ArrowRightIcon />
              </span>
              <span className="right">{value.goodChoice}</span>
            </p>
          </li>
        ))}
      </ul>
    </>
  );
};

SummuryView.propTypes = {
  result: PropTypes.shape({
    good: PropTypes.number.isRequired,
    bad: PropTypes.number.isRequired,
  }).isRequired,
};

/* ---------- Switch view component ---------- */

const SwitchView = ({ toDisplay, props }) => {
  switch (toDisplay) {
    case Train.STATE_INTRO:
      return <IntroductionView onClick={props.getNewQuestion} />;
    case Train.STATE_PLAY:
      return (
        <PlayView
          result={props.result}
          question={props.question}
          timerDuration={props.timerDuration}
          getNewQuestion={props.getNewQuestion}
          updateResult={props.updateResult}
          addWrongAnswer={props.addWrongAnswer}
          displaySummury={props.displaySummury}
        />
      );
    case Train.STATE_SUMMURY:
      return <SummuryView result={props.result} answers={props.wrongAnswers} />;
    default:
      return "Error";
  }
};

SwitchView.propTypes = {
  toDisplay: PropTypes.number.isRequired,
  props: PropTypes.object.isRequired,
};

/* ---------- Train ---------- */

class Train extends Component {
  constructor(props) {
    super(props);
    this.state = {
      gameState: Train.STATE_INTRO,
      question: { badAnswers: [], goodAnswer: "", subject: "", type: 0 },
      result: { good: 0, bad: 0 },
      wrongAnswers: [],
      error: null,
    };
  }

  /**
   * Get a new question (random type) from the server
   */
  getNewQuestion = () => {
    const minQuestionType = 1,
      maxQuestionType = 1;
    const questionType = Math.floor(Math.random() * (maxQuestionType - minQuestionType)) + minQuestionType;
    axios
      .get(`/api/v1/question/${questionType}`)
      .then((res) => {
        this.setState({
          gameState: Train.STATE_PLAY,
          question: res.data.question,
          inProgress: true,
          lastClicked: "",
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
   * Update result with the new score
   */
  updateResult = (increase) => {
    const { good, bad } = this.state.result;
    const { goodPoint, badPoint } = increase ? { goodPoint: 1, badPoint: 0 } : { goodPoint: 0, badPoint: 1 };
    this.setState({
      result: {
        good: good + goodPoint,
        bad: bad + badPoint,
      },
    });
  };

  /**
   * And the current questionn the user's answer and the right answer
   * to the list of errors
   * @param {string} question The question
   * @param {string} userChoice The user's choice
   */
  addWrongAnswer = (question, userChoice) => {
    const { wrongAnswers } = this.state;
    wrongAnswers.push({ question: question, userChoice: userChoice, goodChoice: this.state.question.goodAnswer });
    this.setState({
      wrongAnswers: wrongAnswers,
    });
  };

  /**
   * Change the state of the game to display the summury
   */
  displaySummury = () => {
    this.setState({
      gameState: Train.STATE_SUMMURY,
    });
  };

  render() {
    const { gameState, error } = this.state;
    const switchProps = {
      ...this.state,
      timerDuration: Train.TIMER_DURATION,
      getNewQuestion: this.getNewQuestion,
      updateResult: this.updateResult,
      addWrongAnswer: this.addWrongAnswer,
      displaySummury: this.displaySummury,
    };
    let additionalClass = "";
    if (gameState === Train.STATE_INTRO) {
      additionalClass = "quiz-intro";
    } else if (gameState === Train.STATE_SUMMURY) {
      additionalClass = "quiz-summury";
    }

    return (
      <main id="quiz" className={additionalClass}>
        {error !== null && <Message type="error" content={error} />}
        <SwitchView toDisplay={gameState} props={switchProps} />
      </main>
    );
  }
}

Train.STATE_INTRO = 0;
Train.STATE_PLAY = 1;
Train.STATE_SUMMURY = 2;

Train.TIMER_DURATION = 10;

export default Train;
