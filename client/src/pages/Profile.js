import { CaretSortIcon } from "@modulz/radix-icons";
import * as Collapsible from "@radix-ui/react-collapsible";
import axios from "axios";
import React, { Component } from "react";
import { Link } from "react-router-dom";

import Avatar from "../components/Avatar";
import ChooseAvatar from "../components/ChooseAvatar";
import AuthService from "../services/auth.service";

export default class Profile extends Component {
  constructor(props) {
    super(props);

    this.state = Avatar.defaultProps;
  }

  componentDidMount() {
    axios
      .get(`/api/v1/users/me`)
      .then((res) => {
        const { avatar } = res.data;
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
        <Avatar
          size="256px"
          infos={{
            eyes: this.state?.choiceEyes,
            hands: this.state?.choiceHands,
            hat: this.state?.choiceHat,
            mouth: this.state?.choiceMouth,
            colorBody: this.state?.choiceColorBody,
            colorBG: this.state?.choiceColorBG,
          }}
        />

        <Collapsible.Root>
          <Collapsible.Button className="btn">
            Personnaliser mon avatar
            <CaretSortIcon height="20px" width="20px" style={{ marginLeft: "10px" }} />
          </Collapsible.Button>
          <Collapsible.Content>
            <ChooseAvatar
              choiceEyes={this.state?.choiceEyes}
              choiceHands={this.state?.choiceHands}
              choiceHat={this.state?.choiceHat}
              choiceMouth={this.state?.choiceMouth}
              choiceColorBody={this.state?.choiceColorBody}
              choiceColorBG={this.state?.choiceColorBG}
              handleInputEyes={(val) => this.setState({ choiceEyes: parseInt(val) })}
              handleInputHands={(val) => this.setState({ choiceHands: parseInt(val) })}
              handleInputHat={(val) => this.setState({ choiceHat: parseInt(val) })}
              handleInputMouth={(val) => this.setState({ choiceMouth: parseInt(val) })}
              handleInputColorBody={(val) => this.setState({ choiceColorBody: val })}
              handleInputColorBG={(val) => this.setState({ choiceColorBG: val })}
            />
          </Collapsible.Content>
        </Collapsible.Root>

        <button className="btn" onClick={this.handleLogoutClick}>
          Me déconnecter
        </button>

        <Link to="/about" className="btn">
          À propos de l'application
        </Link>
      </main>
    );
  }
}
