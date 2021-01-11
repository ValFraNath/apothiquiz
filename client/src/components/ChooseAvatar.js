import React, { Component } from "react";
import PropTypes from "proptypes";

const NUMBER_OF_EYES = 5;
const NUMBER_OF_HANDS = 5;
const NUMBER_OF_HATS = 5;
const NUMBER_OF_MOUTHES = 5;

const Label = function (props) {
  const options = [];
  for (let i = 0; i < props.maxValue; ++i) {
    options.push(
      <option key={i} value={i}>
        {i}
      </option>
    );
  }

  return (
    <label>
      {props.name}
      <select
        value={props.value}
        onChange={(event) => {
          props.onValueChange(event.target.value);
        }}
      >
        {options}
      </select>
    </label>
  );
};

Label.propTypes = {
  name: PropTypes.string.isRequired,
  maxValue: PropTypes.number.isRequired,
  onValueChange: PropTypes.func.isRequired,
};

const InputColor = function (props) {
  return (
    <label>
      {props.name}
      <input
        type="color"
        value={props.value}
        onChange={(event) => {
          props.onValueChange(event.target.value);
        }}
      />
    </label>
  );
};

export default class ChooseAvatar extends Component {
  randomAvatar = () => {
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

  render() {
    return (
      <div id="change-avatar">
        <Label
          name="Yeux"
          value={this.props.choiceEyes}
          maxValue={NUMBER_OF_EYES}
          onValueChange={this.props.handleInputEyes}
        />
        <Label
          name="Mains"
          value={this.props.choiceHands}
          maxValue={NUMBER_OF_HANDS}
          onValueChange={this.props.handleInputHands}
        />
        <Label
          name="Chapeau"
          value={this.props.choiceHat}
          maxValue={NUMBER_OF_HATS}
          onValueChange={this.props.handleInputHat}
        />
        <Label
          name="Bouche"
          value={this.props.choiceMouth}
          maxValue={NUMBER_OF_MOUTHES}
          onValueChange={this.props.handleInputMouth}
        />

        <InputColor
          name="Couleur du corps"
          value={this.props.choiceColorBody}
          onValueChange={this.props.handleInputColorBody}
        />

        <InputColor
          name="Couleur de fond"
          value={this.props.choiceColorBG}
          onValueChange={this.props.handleInputColorBG}
        />

        <button onClick={this.randomAvatar}>Avatar aléatoire</button>
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
