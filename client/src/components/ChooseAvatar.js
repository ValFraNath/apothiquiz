import React, { Component, useState } from "react";
import PropTypes from "proptypes";
import axios from "axios";
import { ArrowLeftIcon, ArrowRightIcon, BlendingModeIcon } from "@modulz/radix-icons";

/** These const should match the number of possibilities in images/avatar/files.png */
const NUMBER_OF_EYES = 5;
const NUMBER_OF_HANDS = 5;
const NUMBER_OF_HATS = 5;
const NUMBER_OF_MOUTHES = 5;

const Select = (props) => {
  const [value, setValue] = useState(0);

  return (
    <div className="choice">
      <ArrowLeftIcon
        onClick={(event) => {
          const newValue = value - 1;
          setValue(newValue);
          props.onValueChange(newValue);
        }}
        className={value === 0 ? "disabled" : ""}
        height="30px"
        width="30px"
      />

      <ArrowRightIcon
        onClick={(event) => {
          const newValue = value + 1;
          setValue(newValue);
          props.onValueChange(newValue);
        }}
        className={value === props.maxValue ? "disabled" : ""}
        height="30px"
        width="30px"
      />
    </div>
  );
};

Select.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  maxValue: PropTypes.number.isRequired,
  onValueChange: PropTypes.func.isRequired,
};

const InputColor = (props) => {
  return (
    <label>
      <BlendingModeIcon height="30px" width="30px" />
      <input
        name={props.name}
        style={{ display: "none" }}
        type="color"
        value={props.value}
        onChange={(event) => {
          props.onValueChange(event.target.value);
        }}
      />
    </label>
  );
};

InputColor.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onValueChange: PropTypes.func.isRequired,
};

class ChooseAvatar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      avatarChooserState: "saved",
    };
  }

  randomAvatar = () => {
    this.setState({ avatarChooserState: "not-saved" });
    this.props.handleInputEyes(Math.round(Math.random() * NUMBER_OF_EYES));
    this.props.handleInputHands(Math.round(Math.random() * NUMBER_OF_HANDS));
    this.props.handleInputHat(Math.round(Math.random() * NUMBER_OF_HATS));
    this.props.handleInputMouth(Math.round(Math.random() * NUMBER_OF_MOUTHES));
    this.props.handleInputColorBody("#" + (((1 << 24) * Math.random()) | 0).toString(16));
    this.props.handleInputColorBG("#" + (((1 << 24) * Math.random()) | 0).toString(16));
  };

  handleSaveAvatar = () => {
    this.setState({ avatarChooserState: "saving" });

    axios
      .patch(`/api/v1/user/me`, {
        avatar: {
          eyes: this.props.choiceEyes,
          hands: this.props.choiceHands,
          hat: this.props.choiceHat,
          mouth: this.props.choiceMouth,
          colorBody: this.props.choiceColorBody,
          colorBG: this.props.choiceColorBG,
        },
      })
      .then((res) => {
        this.setState({ avatarChooserState: "saved", message: "" });
      })
      .catch((error) => {
        console.error(error);
        this.setState({
          message: "Erreur lors de la requête. Veuillez réessayer plus tard",
          avatarChooserState: "not-saved",
        });
      });
  };

  render() {
    return (
      <div id="change-avatar">
        <span htmlFor="eyes">Yeux</span>
        <Select
          name="eyes"
          value={this.props.choiceEyes}
          maxValue={NUMBER_OF_EYES}
          onValueChange={(ev) => {
            this.setState({ avatarChooserState: "not-saved" });
            this.props.handleInputEyes(ev);
          }}
        />

        <span htmlFor="hands">Mains</span>
        <Select
          name="hands"
          value={this.props.choiceHands}
          maxValue={NUMBER_OF_HANDS}
          onValueChange={(ev) => {
            this.setState({ avatarChooserState: "not-saved" });
            this.props.handleInputHands(ev);
          }}
        />

        <span htmlFor="hat">Chapeau</span>
        <Select
          name="hat"
          value={this.props.choiceHat}
          maxValue={NUMBER_OF_HATS}
          onValueChange={(ev) => {
            this.setState({ avatarChooserState: "not-saved" });
            this.props.handleInputHat(ev);
          }}
        />

        <span htmlFor="mouth">Bouche</span>
        <Select
          name="mouth"
          value={this.props.choiceMouth}
          maxValue={NUMBER_OF_MOUTHES}
          onValueChange={(ev) => {
            this.setState({ avatarChooserState: "not-saved" });
            this.props.handleInputMouth(ev);
          }}
        />

        <span htmlFor="body">Couleur du corps</span>
        <InputColor
          name="body"
          value={this.props.choiceColorBody}
          onValueChange={(ev) => {
            this.setState({ avatarChooserState: "not-saved" });
            this.props.handleInputColorBody(ev);
          }}
        />

        <span htmlFor="background">Couleur de fond</span>
        <InputColor
          name="background"
          value={this.props.choiceColorBG}
          onValueChange={(ev) => {
            this.setState({ avatarChooserState: "not-saved" });
            this.props.handleInputColorBG(ev);
          }}
        />

        <button onClick={this.randomAvatar} className="btn">
          Générer un avatar aléatoire
        </button>

        <button
          onClick={this.handleSaveAvatar}
          className="btn"
          disabled={this.state.avatarChooserState === "saved"}
        >
          {this.state.avatarChooserState === "saved" && "Avatar sauvegardé"}
          {this.state.avatarChooserState === "saving" && "Sauvegarde en cours..."}
          {this.state.avatarChooserState === "not-saved" && "Sauvegarder l'avatar"}
        </button>

        {this.state.message !== null && <span className="error">{this.state.message}</span>}
      </div>
    );
  }
}

ChooseAvatar.propTypes = {
  handleInputEyes: PropTypes.func.isRequired,
  handleInputHands: PropTypes.func.isRequired,
  handleInputHat: PropTypes.func.isRequired,
  handleInputMouth: PropTypes.func.isRequired,
  handleInputColorBody: PropTypes.func.isRequired,
  handleInputColorBG: PropTypes.func.isRequired,
};

export default ChooseAvatar;
