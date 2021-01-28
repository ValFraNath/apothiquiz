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
    };
  }

  componentDidMount() {
    if (this.state.duelData !== null) return;

    const duelId = this.props.match.params.id;
    axios
      .get(`/api/v1/duels/${duelId}`)
      .then((res) => {
        this.setState({
          duelData: res.data,
        });
      })
      .catch((err) => console.error(err));
  }

  updateTimer = (value) => {
    let { inProgress } = this.state;

    if (!inProgress) return false;
    if (value === 0) {
      inProgress = false;
    }

    this.setState({
      inProgress: inProgress,
      timer: value,
    });
  };

  handleAnswerClick = (value) => {
    if (!this.state.inProgress) return;
    this.setState({
      inProgress: false,
      lastClicked: value,
    });
  };

  nextQuestion = () => {
    const { currentQuestionNum } = this.state;
    this.setState({
      inProgress: true,
      currentQuestionNum: currentQuestionNum + 1,
    });
  };

  render() {
    if (this.state.duelData === null) {
      return <p>Chargement en cours</p>;
    }

    const { duelData, currentQuestionNum, inProgress, lastClicked, timer } = this.state;
    const currentQuestion = duelData.rounds[duelData.currentRound - 1][currentQuestionNum - 1];

    return (
      <main id="duel">
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
          goodAnswerIndex={-1}
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
