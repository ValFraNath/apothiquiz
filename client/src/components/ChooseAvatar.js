import React, { Component } from "react";
import PropTypes from "proptypes";

const NUMBER_OF_EYES = 5;
const NUMBER_OF_HANDS = 5;
const NUMBER_OF_HATS = 5;
const NUMBER_OF_MOUTHES = 5;

const Select = function (props) {
  const options = [];
  for (let i = 0; i < props.maxValue; ++i) {
    options.push(
      <option key={i} value={i}>
        {i}
      </option>
    );
  }

  return (
    <select
      name={props.name}
      value={props.value}
      onChange={(event) => {
        props.onValueChange(event.target.value);
      }}
    >
      {options}
    </select>
  );
};

Select.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  maxValue: PropTypes.number.isRequired,
  onValueChange: PropTypes.func.isRequired,
};

const InputColor = function (props) {
  return (
    <input
      name={props.name}
      type="color"
      value={props.value}
      onChange={(event) => {
        props.onValueChange(event.target.value);
      }}
    />
  );
};

InputColor.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onValueChange: PropTypes.func.isRequired,
};

export default class ChooseAvatar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      modified: "saved",
    };
  }

  randomAvatar = () => {
    this.setState({ modified: "modified" });
    this.props.handleInputEyes(Math.round(Math.random() * NUMBER_OF_EYES));
    this.props.handleInputHands(Math.round(Math.random() * NUMBER_OF_HANDS));
    this.props.handleInputHat(Math.round(Math.random() * NUMBER_OF_HATS));
    this.props.handleInputMouth(Math.round(Math.random() * NUMBER_OF_MOUTHES));
    this.props.handleInputColorBody(
      "#" + (((1 << 24) * Math.random()) | 0).toString(16)
    );
    this.props.handleInputColorBG(
      "#" + (((1 << 24) * Math.random()) | 0).toString(16)
    );
  };

  saveAvatar = () => {
    this.setState({ modified: "saving" });

    // TODO Send to backend
    console.error(" Impossible d'enregistrer pour le moment");
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
            this.setState({ modified: "modified" });
            this.props.handleInputEyes(ev);
          }}
        />
        <label htmlFor="hands">Mains</label>
        <Select
          name="hands"
          value={this.props.choiceHands}
          maxValue={NUMBER_OF_HANDS}
          onValueChange={(ev) => {
            this.setState({ modified: "modified" });
            this.props.handleInputHands(ev);
          }}
        />
        <label htmlFor="hat">Chapeau</label>
        <Select
          name="hat"
          value={this.props.choiceHat}
          maxValue={NUMBER_OF_HATS}
          onValueChange={(ev) => {
            this.setState({ modified: "modified" });
            this.props.handleInputHat(ev);
          }}
        />
        <label htmlFor="mouth">Bouche</label>
        <Select
          name="mouth"
          value={this.props.choiceMouth}
          maxValue={NUMBER_OF_MOUTHES}
          onValueChange={(ev) => {
            this.setState({ modified: "modified" });
            this.props.handleInputMouth(ev);
          }}
        />

        <label htmlFor="body">Couleur du corps</label>
        <InputColor
          name="body"
          value={this.props.choiceColorBody}
          onValueChange={(ev) => {
            this.setState({ modified: "modified" });
            this.props.handleInputColorBody(ev);
          }}
        />

        <label htmlFor="background">Couleur de fond</label>
        <InputColor
          name="background"
          value={this.props.choiceColorBG}
          onValueChange={(ev) => {
            this.setState({ modified: "modified" });
            this.props.handleInputColorBG(ev);
          }}
        />

        <button
          onClick={this.randomAvatar}
          disabled={this.state.modified === "saving"}
        >
          Avatar aléatoire
        </button>

        <button
          onClick={this.saveAvatar}
          style={{
            backgroundColor:
              this.state.modified === "saved"
                ? "green"
                : this.state.modified === "saving"
                ? "blue"
                : "red",
          }}
          disabled={this.state.modified === "saved"}
        >
          {this.state.modified === "saved" && "Avatar sauvegardé"}
          {this.state.modified === "saving" && "Sauvegarde en cours..."}
          {this.state.modified === "modified" && "Valider l'avatar"}
        </button>
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
