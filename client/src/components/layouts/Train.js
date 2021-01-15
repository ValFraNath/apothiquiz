import React, { Component } from "react";
import axios from "axios";
import PropTypes from "proptypes";
import { ArrowRightIcon } from "@modulz/radix-icons";

import Plural from "../Plural";
import Timer from "../quizz/Timer";
import Answers from "../quizz/Answers";
import Message from "../quizz/Message";

/* ---------- Introduction view ---------- */

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

/* ---------- Play view ---------- */

class PlayView extends Component {
  constructor(props) {
    super(props);
    this.state = {
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
    this.setState({
      inProgress: false,
      lastClicked: value,
    });
  };

  nextQuestion = () => {
    this.props.getNewQuestion();
    this.setState({
      inProgress: true,
      lastClicked: "",
      timer: this.props.timerDuration,
    });
  };

  render() {
    const { inProgress, timer, lastClicked } = this.state;
    const { result, question, displaySummury } = this.props;

    return (
      <>
        <div id="quiz-score">
          <p id="good-score">
            {result.good} <Plural word="bonne" count={result.good} /> <Plural word="réponse" count={result.good} />
          </p>
          <p id="bad-score">
            {result.bad} <Plural word="mauvaise" count={result.bad} /> <Plural word="réponse" count={result.bad} />
          </p>
        </div>

        <div id="quiz-question">
          <h2>Question {result.good + result.bad + 1}</h2>
          <h1>{this.generateQuestionText()}</h1>
        </div>

        {inProgress ? (
          <Timer inProgress={inProgress} duration={timer} updateParent={this.updateTimer} />
        ) : (
          <div id="next-btn">
            <button onClick={this.nextQuestion}>
              Question suivante
              <ArrowRightIcon />
            </button>
          </div>
        )}

        <Answers
          inProgress={inProgress}
          goodAnswer={question.goodAnswer}
          badAnswers={question.badAnswers}
          lastClicked={lastClicked}
          onClick={this.handleAnswerClick}
        />

        <button onClick={displaySummury}>Arrêter l'entraînement</button>
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

const SummuryView = ({ result }) => {
  return (
    <>
      <h1>Fin de l'entraînement</h1>
      <p>
        Vous avez obtenu un score de {result.good}/{result.good + result.bad}
      </p>
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
          displaySummury={props.displaySummury}
        />
      );
    case Train.STATE_SUMMURY:
      return <SummuryView result={props.result} />;
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
      displaySummury: this.displaySummury,
    };

    return (
      <main id="quiz">
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
