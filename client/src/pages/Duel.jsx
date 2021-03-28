import { ArrowRightIcon, RocketIcon } from "@modulz/radix-icons";
import axios from "axios";
import { PropTypes } from "prop-types";
import React, { Component } from "react";

import ButtonCircle from "../components/buttons/ButtonCircle";
import Answers from "../components/quiz/Answers";
import Question from "../components/quiz/Question";
import Timer from "../components/quiz/Timer";
import FloatingError from "../components/status/FloatingError";
import Loading from "../components/status/Loading";
import PageError from "../components/status/PageError";
import AntiCheat from "../utils/antiCheat.js";

class Duel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      duelData: null,
      currentQuestionNum: 1,
      inProgress: true,
      lastClicked: "",
      timer: null,
      userAnswers: [],
      isFetchError: false,
      isValidateError: false,
    };
  }

  componentDidMount() {
    const duelId = Number(this.props.match.params.id);
    axios
      .get(`/api/v1/duels/${duelId}`)
      .then(({ data: duel }) => {
        if (duel.inProgress === 0 || AntiCheat.isDuelBroken(duelId)) {
          this.props.history.push("/homepage");
          return;
        }
        this.setState({
          duelData: duel,
          timer: duel.questionTimerDuration,
        });

        // Can't access to a round already played
        const firstQuestion = duel.rounds[duel.currentRound - 1][0];
        if (firstQuestion.userAnswer !== undefined) {
          this.props.history.push(`/duel/${duelId}`);
        }
        AntiCheat.markDuelAsBroken(duelId, duel.currentRound);
      })
      .catch((error) => {
        console.error(error);
        this.setState({ isFetchError: true });
      });
  }

  /**
   * Get data about current round
   */
  getCurrentRound() {
    const { duelData } = this.state;
    return duelData.rounds[duelData.currentRound - 1];
  }

  /**
   * Get data about current question
   */
  getCurrentQuestion() {
    const { currentQuestionNum } = this.state;
    return this.getCurrentRound()[currentQuestionNum - 1];
  }

  /**
   * Update timer
   * @param {int} value Timer value
   */
  updateTimer = (value) => {
    let { inProgress, userAnswers } = this.state;

    if (!inProgress) return false;
    if (value === 0) {
      userAnswers.push(-1);
      inProgress = false;
    }

    this.setState({
      inProgress: inProgress,
      timer: value,
      userAnswers: userAnswers,
    });
  };

  /**
   * Handle click on an answer
   * @param {string} value Answer value
   */
  handleAnswerClick = (value) => {
    if (!this.state.inProgress) return;

    const { userAnswers } = this.state;
    const currentQuestion = this.getCurrentQuestion();
    userAnswers.push(currentQuestion.answers.indexOf(value));

    this.setState({
      inProgress: false,
      lastClicked: value,
      userAnswers: userAnswers,
    });
  };

  /**
   * Get next question or end the duel if it is the last question.
   */
  nextQuestion = () => {
    const { currentQuestionNum } = this.state;

    if (currentQuestionNum === this.getCurrentRound().length) {
      this.validateDuel();
      return;
    }

    this.setState({
      inProgress: true,
      currentQuestionNum: currentQuestionNum + 1,
      timer: this.state.duelData.questionTimerDuration,
    });
  };

  /**
   * Compute the class of answer indicators at the top of the page
   * @param {int} index Index of the answer
   * @param {object} question Question data
   */
  computeClassDuelBar(index, question) {
    const { userAnswers } = this.state;
    if (index >= userAnswers.length) {
      return "";
    }
    return question.goodAnswer === userAnswers[index] ? "good" : "bad";
  }

  /**
   *Sends user answers to the server
   */
  validateDuel = () => {
    const { duelData, userAnswers } = this.state;

    const duelId = this.props.match.params.id;
    axios
      .post(`/api/v1/duels/${duelData.id}/${duelData.currentRound}`, {
        answers: userAnswers,
      })
      .then(() => {
        AntiCheat.markDuelAsValidated(duelData.id);
        this.props.history.push(`/duel/${duelId}`);
      })
      .catch((error) => {
        console.error(error);
        this.setState({ isValidateError: true });
      });
  };

  render() {
    if (this.state.isFetchError) {
      return <PageError message="Impossible de récupérer le duel" />;
    }

    if (this.state.duelData === null) {
      return <Loading message="Chargement du duel..." />;
    }

    const { duelData, currentQuestionNum, inProgress, lastClicked, timer } = this.state;
    const currentRound = this.getCurrentRound();
    const currentQuestion = this.getCurrentQuestion();

    return (
      <main id="duel">
        <div id="duel-topbar">
          <div>
            {currentRound.map((value, index) => (
              <div key={index} className={this.computeClassDuelBar(index, value)}></div>
            ))}
          </div>
          <div>
            vs
            <br />
            {duelData.opponent}
          </div>
        </div>

        <Question
          numero={currentQuestionNum}
          maxQuestion={duelData.rounds[duelData.currentRound - 1].length}
          text={currentQuestion.wording}
          image={currentQuestion.type === 11 ? currentQuestion.subject : null}
        />

        {inProgress ? (
          <Timer inProgress={inProgress} duration={timer} updateParent={this.updateTimer} />
        ) : (
          <div id="next-btn">
            {this.state.isValidateError && (
              <FloatingError message="Impossible de valider ce duel" />
            )}
            <ButtonCircle onClick={this.nextQuestion}>
              {currentQuestionNum === this.getCurrentRound().length ? (
                <RocketIcon />
              ) : (
                <ArrowRightIcon />
              )}
            </ButtonCircle>
          </div>
        )}

        <Answers
          inProgress={inProgress}
          goodAnswerIndex={currentQuestion.goodAnswer}
          answers={currentQuestion.answers}
          lastClicked={lastClicked}
          onClick={this.handleAnswerClick}
          areImage={currentQuestion.type === 12}
        />
      </main>
    );
  }
}

Duel.propTypes = {
  match: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
};

export default Duel;
