import React, { Component } from "react";
import PropTypes from "proptypes";

const NUMBER_OF_EYES = 5;
const NUMBER_OF_HANDS = 5;
const NUMBER_OF_HATS = 5;
const NUMBER_OF_MOUTHES = 5;

class Label extends Component {
  handleChange = (event) => {
    this.props.onValueChange(event.target.value);
  };

  render() {
    const options = [];
    for (let i = 0; i < this.props.maxValue; ++i) {
      options.push(<option value={i}>{i}</option>);
    }

    return (
      <label>
        {this.props.name}
        <select value={this.props.value} onChange={this.handleChange}>
          {options}
        </select>
      </label>
    );
  }
}

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
        onChange={(event) => {
          props.onValueChange(event.target.value);
        }}
      />
    </label>
  );
};

export default class ChooseAvatar extends Component {
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
