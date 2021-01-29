import React, { Component } from "react";
import axios from "axios";
import { ArrowRightIcon } from "@modulz/radix-icons";

import Question from "../components/quiz/Question";
import Timer from "../components/quiz/Timer";
import Answers from "../components/quiz/Answers";
import ButtonCircle from "../components/buttons/ButtonCircle";

class Duel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      duelData: null,
      currentQuestionNum: 1,
      inProgress: true,
      lastClicked: "",
      timer: Duel.TIMER_DURATION,
      userAnswers: [],
    };
  }

  componentDidMount() {
    if (this.state.duelData !== null) return;

    const duelId = this.props.match.params.id;
    axios
      .get(`/api/v1/duels/${duelId}`)
      .then((res) => {
        if (res.data.inProgress === 0) {
          document.location.replace("/homepage");
          return;
        }
        this.setState({
          duelData: res.data,
        });

        // Can't access to a round already played
        const firstQuestion = res.data.rounds[res.data.currentRound - 1][0];
        console.log(firstQuestion);
        if (firstQuestion.userAnswer !== undefined) {
          document.location.replace("/homepage");
        }
      })
      .catch((err) => console.error(err));

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

    const currentRound = this.getCurrentRound();
    if (currentQuestionNum === currentRound.length) {
      this.validateDuel();
      return;
    }

    this.setState({
      inProgress: true,
      currentQuestionNum: currentQuestionNum + 1,
      timer: Duel.TIMER_DURATION,
    });
  };

  /**
   * Compute the class of answer indicators at the top of the page
   * @param {int} index Index of the answer
   * @param {object} question Question data
   */
  computeClassTopBar(index, question) {
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

    axios
      .post(`/api/v1/duels/${duelData.id}/${duelData.currentRound}`, {
        answers: userAnswers,
      })
      .then(() => document.location.replace(`/duel/${duelData.currentRound}`))
      .catch((error) => console.error(error));
  };

  render() {
    if (this.state.duelData === null) {
      return <p>Chargement en cours</p>;
    }

    const { duelData, currentQuestionNum, inProgress, lastClicked, timer } = this.state;
    const currentRound = this.getCurrentRound();
    const currentQuestion = this.getCurrentQuestion();

    return (
      <main id="duel">
        <div id="duel-topbar">
          <div>
            {currentRound.map((value, index) => (
              <div key={index} className={this.computeClassTopBar(index, value)}></div>
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
        />

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
          goodAnswerIndex={currentQuestion.goodAnswer}
          answers={currentQuestion.answers}
          lastClicked={lastClicked}
          onClick={this.handleAnswerClick}
        />
      </main>
    );
  }
}

Duel.TIMER_DURATION = 10;

export default Duel;
