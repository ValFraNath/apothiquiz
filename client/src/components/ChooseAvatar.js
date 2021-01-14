import React, { Component } from "react";
import PropTypes from "proptypes";
import axios from "axios";

/** These const should match the number of possibilities in images/avatar/files.png */
const NUMBER_OF_EYES = 5;
const NUMBER_OF_HANDS = 5;
const NUMBER_OF_HATS = 5;
const NUMBER_OF_MOUTHES = 5;

class Select extends Component {
  render() {
    const options = [];
    for (let i = 0; i < this.props.maxValue; ++i) {
      options.push(
        <option key={i} value={i}>
          {i}
        </option>
      );
    }
    return (
      <select
        name={this.props.name}
        value={this.props.value}
        onChange={(event) => {
          this.props.onValueChange(event.target.value);
        }}
      >
        {options}
      </select>
    );
  }
}

Select.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  maxValue: PropTypes.number.isRequired,
  onValueChange: PropTypes.func.isRequired,
};

class InputColor extends Component {
  render() {
    return (
      <input
        name={this.props.name}
        type="color"
        value={this.props.value}
        onChange={(event) => {
          this.props.onValueChange(event.target.value);
        }}
      />
    );
  }
}

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
        avatar: JSON.stringify({
          eyes: this.props.choiceEyes,
          hands: this.props.choiceHands,
          hat: this.props.choiceHat,
          mouth: this.props.choiceMouth,
          colorBody: this.props.choiceColorBody,
          colorBG: this.props.choiceColorBG,
        }),
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
        <label htmlFor="eyes">Yeux</label>
        <Select
          name="eyes"
          value={this.props.choiceEyes}
          maxValue={NUMBER_OF_EYES}
          onValueChange={(ev) => {
            this.setState({ avatarChooserState: "not-saved" });
            this.props.handleInputEyes(ev);
          }}
        />

        <label htmlFor="hands">Mains</label>
        <Select
          name="hands"
          value={this.props.choiceHands}
          maxValue={NUMBER_OF_HANDS}
          onValueChange={(ev) => {
            this.setState({ avatarChooserState: "not-saved" });
            this.props.handleInputHands(ev);
          }}
        />

        <label htmlFor="hat">Chapeau</label>
        <Select
          name="hat"
          value={this.props.choiceHat}
          maxValue={NUMBER_OF_HATS}
          onValueChange={(ev) => {
            this.setState({ avatarChooserState: "not-saved" });
            this.props.handleInputHat(ev);
          }}
        />

        <label htmlFor="mouth">Bouche</label>
        <Select
          name="mouth"
          value={this.props.choiceMouth}
          maxValue={NUMBER_OF_MOUTHES}
          onValueChange={(ev) => {
            this.setState({ avatarChooserState: "not-saved" });
            this.props.handleInputMouth(ev);
          }}
        />

        <label htmlFor="body">Couleur du corps</label>
        <InputColor
          name="body"
          value={this.props.choiceColorBody}
          onValueChange={(ev) => {
            this.setState({ avatarChooserState: "not-saved" });
            this.props.handleInputColorBody(ev);
          }}
        />

        <label htmlFor="background">Couleur de fond</label>
        <InputColor
          name="background"
          value={this.props.choiceColorBG}
          onValueChange={(ev) => {
            this.setState({ avatarChooserState: "not-saved" });
            this.props.handleInputColorBG(ev);
          }}
        />

        <button onClick={this.randomAvatar}>Générer un avatar aléatoire</button>

        <button
          onClick={this.handleSaveAvatar}
          className={this.state.avatarChooserState}
          disabled={this.state.avatarChooserState === "saved"}
        >
          {this.state.avatarChooserState === "saved" && "Avatar sauvegardé"}
          {this.state.avatarChooserState === "saving" && "Sauvegarde en cours..."}
          {this.state.avatarChooserState === "not-saved" && "Valider l'avatar"}
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
