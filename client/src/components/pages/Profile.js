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
      choiceColorBody: "#0c04fc", // blue
      choiceColorBG: "#D3D3D3", // lightgray
    };
  }

  componentDidMount() {
    axios
      .get(`/api/v1/user/me`)
      .then((res) => {
        const avatar = res.data.avatar;
        this.setState({
          choiceEyes: avatar.eyes,
          choiceHands: avatar.hands,
          choiceHat: avatar.hat,
          choiceMouth: avatar.mouth,
          choiceColorBody: avatar.colorBody,
          choiceColorBG: avatar.colorBG,
        });
      })
      .catch((error) => {
        // TODO show message
        console.error(error);
        return;
      });
  }

  handleLogoutClick = () => {
    AuthService.logout();
    document.location.replace("/");
  };

  render() {
    return (
      <main id="profile">
        <button onClick={this.handleLogoutClick}>Me déconnecter</button>

        <Avatar
          size="256px"
          eyes={this.state.choiceEyes}
          hands={this.state.choiceHands}
          hat={this.state.choiceHat}
          mouth={this.state.choiceMouth}
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
          handleInputEyes={(val) => this.setState({ choiceEyes: parseInt(val) })}
          handleInputHands={(val) => this.setState({ choiceHands: parseInt(val) })}
          handleInputHat={(val) => this.setState({ choiceHat: parseInt(val) })}
          handleInputMouth={(val) => this.setState({ choiceMouth: parseInt(val) })}
          handleInputColorBody={(val) => this.setState({ choiceColorBody: val })}
          handleInputColorBG={(val) => this.setState({ choiceColorBG: val })}
        />
      </main>
    );
  }
}
