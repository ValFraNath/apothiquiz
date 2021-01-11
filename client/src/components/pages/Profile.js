import React, { Component } from "react";
import axios from "axios";

import AuthService from "../../services/auth.service";
import Avatar from "../Avatar";
import ChooseAvatar from "../ChooseAvatar";

export default class Profile extends Component {
  constructor(props) {
    super(props);

    this.state = {
      message: "",
      choiceEyes: 0,
      choiceHands: 0,
      choiceHat: 0,
      choiceMouth: 0,
      choiceColorBody: "#0c04fc",
      choiceColorBG: "lightgrey",
    };
  }

  handleButtonClick = () => {
    axios
      .get("/api/v1/user")
      .then((res) => {
        this.setState({ message: res.data.pseudo });
      })
      .catch((error) => {
        console.error(error);
        this.setState({ message: "Erreur lors de la requête" });
      });
  };

  handleLogoutClick = () => {
    AuthService.logout();
    document.location.replace("/");
  };

  render() {
    return (
      <main id="profile">
        <button onClick={this.handleLogoutClick}>Me déconnecter</button>

        <button onClick={this.handleButtonClick}>Who am I ? </button>

        <span>{this.state.message !== null && this.state.message}</span>

        <Avatar
          eyes={parseInt(this.state.choiceEyes)}
          hands={parseInt(this.state.choiceHands)}
          hat={parseInt(this.state.choiceHat)}
          mouth={parseInt(this.state.choiceMouth)}
          colorBody={this.state.choiceColorBody}
          colorBG={this.state.choiceColorBG}
        />

        <ChooseAvatar
          choiceEyes={this.state.choiceEyes}
          choiceHands={this.state.choiceHands}
          choiceHat={this.state.choiceHat}
          choiceMouth={this.state.choiceMouth}
          choiceColorBody={this.state.choiceColorBody}
          choiceColorBG={this.state.choiceColorBG}
          handleInputEyes={(val) => this.setState({ choiceEyes: val })}
          handleInputHands={(val) => this.setState({ choiceHands: val })}
          handleInputHat={(val) => this.setState({ choiceHat: val })}
          handleInputMouth={(val) => this.setState({ choiceMouth: val })}
          handleInputColorBody={(val) =>
            this.setState({ choiceColorBody: val })
          }
          handleInputColorBG={(val) => this.setState({ choiceColorBG: val })}
        />
      </main>
    );
  }
}
