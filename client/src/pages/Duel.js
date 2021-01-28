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
      })
      .catch((err) => console.error(err));
  }

  getCurrentQuestion() {
    const { duelData, currentQuestionNum } = this.state;
    return duelData.rounds[duelData.currentRound - 1][currentQuestionNum - 1];
  }

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

  nextQuestion = () => {
    const { currentQuestionNum } = this.state;

    const currentQuestion = this.getCurrentQuestion();
    if (currentQuestionNum === currentQuestion.answers.length + 1) {
      console.log("fin");
      this.validateDuel();
      return;
    }

    this.setState({
      inProgress: true,
      currentQuestionNum: currentQuestionNum + 1,
      timer: Duel.TIMER_DURATION,
    });
  };

  validateDuel = () => {
    const { duelData, userAnswers } = this.state;

    axios
      .post(`/api/v1/duels/${duelData.id}/${duelData.currentRound}`, {
        answers: userAnswers,
      })
      .then(() => console.log("super"))
      .catch((error) => console.error(error));
  };

  render() {
    if (this.state.duelData === null) {
      return <p>Chargement en cours</p>;
    }

    const { duelData, currentQuestionNum, inProgress, lastClicked, timer } = this.state;
    const currentQuestion = this.getCurrentQuestion();

    return (
      <main id="duel">
        <div id="duel-topbar"></div>

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
