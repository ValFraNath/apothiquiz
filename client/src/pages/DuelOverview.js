import React, { Component } from "react";
import { Link } from "react-router-dom";
// import axios from "axios";
// import { ChevronRightIcon } from "@modulz/radix-icons";
// import AuthService from "../services/auth.service";

import Avatar from "../components/Avatar";

// import Plural from "../components/Plural";
// import FightPilette from "../images/fight.png";
// import WaitPilette from "../images/attente.png";

const UserBadge = ({ user }) => {
  return (
    <div className="badge">
      <Avatar
        size="90px"
        eyes={user?.avatar?.eyes}
        hands={user?.avatar?.hands}
        hat={user?.avatar?.hat}
        mouth={user?.avatar?.mouth}
        colorBG={user?.avatar?.colorBG}
        colorBody={user?.avatar?.colorBody}
      />
      <span>{user?.pseudo ?? "Pseudonyme"}</span>
    </div>
  );
};

class DuelOverview extends Component {
  constructor(props) {
    super(props);

    this.state = {
      duelID: this.props.match.params.duelID,
      currentUser: {
        pseudo: "moi",
        avatar: {
          eyes: 2,
          hands: 2,
          hat: 2,
          mouth: 2,
          colorBG: "#48291A",
          colorBody: "#fa1240",
        },
      },
      opponent: {
        pseudo: "fdadeau",
        avatar: {
          eyes: 1,
          hands: 1,
          hat: 1,
          mouth: 1,
          colorBG: "#fa1240",
          colorBody: "#48291A",
        },
      },
      rounds: [
        [
          {
            type: 0,
            title: "",
            subject: "",
            wording: "",
            answers: ["", "", ""],
            goodAnswer: 0,
            userAnswer: 1,
            opponentAnswer: 0,
          },
          {
            type: 0,
            title: "",
            subject: "",
            wording: "",
            answers: ["", "", ""],
            goodAnswer: 0,
            userAnswer: 0,
            opponentAnswer: 0,
          },
          {
            type: 0,
            title: "",
            subject: "",
            wording: "",
            answers: ["", "", ""],
            goodAnswer: 0,
            userAnswer: 1,
            opponentAnswer: 0,
          },
        ],
        [
          {
            type: 0,
            title: "",
            subject: "",
            wording: "",
            answers: ["", "", ""],
            goodAnswer: 0,
            userAnswer: 1,
          },
          {
            type: 0,
            title: "",
            subject: "",
            wording: "",
            answers: ["", "", ""],
            goodAnswer: 0,
            userAnswer: 1,
          },
          {
            type: 0,
            title: "",
            subject: "",
            wording: "",
            answers: ["", "", ""],
            goodAnswer: 0,
            userAnswer: 0,
          },
        ],
      ],
    };
  }

  componentDidMount() {
    // axios
    //   .get("/api/v1/duels/")
    //   .then((res) => {
    //     const toPlay = [],
    //       pending = [];
    //     res.data.forEach((val) => {
    //       if (!val.inProgress) return;
    //       if (val.rounds[val.currentRound - 1][0].userAnswer !== undefined) {
    //         pending.push(val);
    //       } else {
    //         toPlay.push(val);
    //       }
    //     });
    //     this.setState({
    //       toPlayChallenges: toPlay,
    //       pendingChallenges: pending,
    //     });
    //     const listOfUsers = [
    //       ...toPlay.map((value) => value.opponent),
    //       ...pending.map((value) => value.opponent),
    //     ];
    //     this.getUsersData(listOfUsers);
    //   })
    //   .catch((err) => console.error(err));
  }

  //   getUsersData(otherUsers) {
  //     const currentUser = AuthService.getCurrentUser();
  //     const listOfUsers = [currentUser.pseudo, ...otherUsers];
  //     axios
  //       .post("/api/v1/users/", listOfUsers)
  //       .then((res) => {
  //         this.setState({
  //           currentUser: res.data[currentUser.pseudo],
  //           usersData: res.data,
  //         });
  //       })
  //       .catch((err) => console.error(err));
  //   }

  render() {
    const { currentUser, opponent, rounds } = this.state;
    const isMyTurn = false;

    return (
      <main id="duel-overview">
        <header>
          <UserBadge user={currentUser} />
          <span>0 - 1</span>
          <UserBadge user={opponent} />
        </header>

        <Link
          to="#"
          className="btn btn-fw"
          onClick={() => alert("Oups, tu as trouvé une fonctionnalité pas encore implémentée !")}
          disabled={!isMyTurn}
        >
          Jouer mon tour
        </Link>

        {rounds.map((round, index) => {
          let userAnswers = [],
            opponentAnswers = [];

          round.forEach((question) => {
            const good = question.goodAnswer;

            userAnswers.push(
              question?.userAnswer === undefined ? undefined : good === question.userAnswer
            );
            opponentAnswers.push(
              question?.opponentAnswer === undefined ? undefined : good === question.opponentAnswer
            );
          });

          return (
            <section key={index}>
              <div className="result">
                <span>{currentUser?.pseudo ?? "Pseudo"}</span>
                {userAnswers.map((isCorrect, index) => (
                  <span key={index} className={"brick " + isCorrect}></span>
                ))}
              </div>

              <div className="result">
                <span>{opponent?.pseudo ?? "Pseudo"}</span>
                {opponentAnswers.map((isCorrect, index) => (
                  <span key={index} className={"brick " + isCorrect}></span>
                ))}
              </div>
            </section>
          );
        })}
      </main>
    );
  }
}

export default DuelOverview;
