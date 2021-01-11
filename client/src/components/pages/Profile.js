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
      choiceEyes: 1,
      choiceHands: 1,
      choiceHat: 1,
      choiceMouth: 1,
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
          handleInputEyes={(newValue) => {
            this.setState({ choiceEyes: newValue });
          }}
          handleInputHands={(newValue) => {
            this.setState({ choiceHands: newValue });
          }}
          handleInputHat={(newValue) => {
            this.setState({ choiceHat: newValue });
          }}
          handleInputMouth={(newValue) => {
            this.setState({ choiceMouth: newValue });
          }}
          handleInputColorBody={(newValue) => {
            this.setState({ choiceColorBody: newValue });
          }}
          handleInputColorBG={(newValue) => {
            this.setState({ choiceColorBG: newValue });
          }}
        />
      </main>
    );
  }
}
