import { ArrowLeftIcon, ArrowRightIcon } from "@modulz/radix-icons";
import axios from "axios";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { useQueryClient } from "react-query";

import variables from "../styles/base/_variables.module.scss";

const NUMBER_OF_EYES = Number(variables.numberChoicesEyes);
const NUMBER_OF_HANDS = Number(variables.numberChoicesHands);
const NUMBER_OF_HATS = Number(variables.numberChoicesHats);
const NUMBER_OF_MOUTHES = Number(variables.numberChoicesMouthes);

const Select = (props) => {
  return (
    <div className="choice">
      <ArrowLeftIcon
        onClick={() => {
          props.onValueChange(props.value - 1);
        }}
        className={props.value === 0 ? "disabled" : ""}
        height="30px"
        width="30px"
      />

      <ArrowRightIcon
        onClick={() => {
          props.onValueChange(props.value + 1);
        }}
        className={props.value >= props.maxValue - 1 ? "disabled" : ""}
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

const InputColor = (props) => (
  <input
    name={props.name}
    style={{ height: "25px" }}
    type="color"
    value={props.value}
    onChange={(event) => {
      props.onValueChange(event.target.value);
    }}
  />
);

InputColor.propTypes = {
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onValueChange: PropTypes.func.isRequired,
};

function randomHexColor() {
  const hexCode = "0123456789abcdef";

  let color = "#";
  for (let i = 0; i < 6; i++) color += hexCode[Math.floor(Math.random() * 16)];

  return color;
}

const AvatarChooser = (props) => {
  const [avatarChooserState, setAvatarChooserState] = useState("saved");
  const queryClient = useQueryClient();

  function randomAvatar() {
    setAvatarChooserState("not-saved");
    props.handleInputEyes(Math.floor(Math.random() * NUMBER_OF_EYES));
    props.handleInputHands(Math.floor(Math.random() * NUMBER_OF_HANDS));
    props.handleInputHat(Math.floor(Math.random() * NUMBER_OF_HATS));
    props.handleInputMouth(Math.floor(Math.random() * NUMBER_OF_MOUTHES));
    props.handleInputColorBody(randomHexColor());
    props.handleInputColorBG(randomHexColor());
  }

  function handleSaveAvatar() {
    setAvatarChooserState("saving");

    axios
      .patch(`/api/v1/users/me`, {
        avatar: {
          eyes: props.choiceEyes,
          hands: props.choiceHands,
          hat: props.choiceHat,
          mouth: props.choiceMouth,
          colorBody: props.choiceColorBody,
          colorBG: props.choiceColorBG,
        },
      })
      .then(() => {
        setAvatarChooserState("saved");
        queryClient.invalidateQueries(["user", "me"]);
      })
      .catch((error) => {
        console.error(error);
        setAvatarChooserState("not-saved");
      });
  }

  return (
    <div id="change-avatar">
      <span>Yeux</span>
      <Select
        name="choice-eyes"
        value={props.choiceEyes}
        maxValue={NUMBER_OF_EYES}
        onValueChange={(ev) => {
          setAvatarChooserState("not-saved");
          props.handleInputEyes(ev);
        }}
      />

      <span>Mains</span>
      <Select
        name="choice-hands"
        value={props.choiceHands}
        maxValue={NUMBER_OF_HANDS}
        onValueChange={(ev) => {
          setAvatarChooserState("not-saved");
          props.handleInputHands(ev);
        }}
      />

      <span>Chapeau</span>
      <Select
        name="choice-hat"
        value={props.choiceHat}
        maxValue={NUMBER_OF_HATS}
        onValueChange={(ev) => {
          setAvatarChooserState("not-saved");
          props.handleInputHat(ev);
        }}
      />

      <span>Bouche</span>
      <Select
        name="choice-mouth"
        value={props.choiceMouth}
        maxValue={NUMBER_OF_MOUTHES}
        onValueChange={(ev) => {
          setAvatarChooserState("not-saved");
          props.handleInputMouth(ev);
        }}
      />

      <span>Couleur du corps</span>
      <InputColor
        name="choice-body"
        value={props.choiceColorBody}
        onValueChange={(ev) => {
          setAvatarChooserState("not-saved");
          props.handleInputColorBody(ev);
        }}
      />

      <span>Couleur de fond</span>
      <InputColor
        name="choice-background"
        value={props.choiceColorBG}
        onValueChange={(ev) => {
          setAvatarChooserState("not-saved");
          props.handleInputColorBG(ev);
        }}
      />

      <button onClick={randomAvatar} className="btn">
        Générer un avatar aléatoire
      </button>

      <button onClick={handleSaveAvatar} className="btn" disabled={avatarChooserState === "saved"}>
        {avatarChooserState === "saved" && "Avatar sauvegardé"}
        {avatarChooserState === "saving" && "Sauvegarde en cours..."}
        {avatarChooserState === "not-saved" && "Sauvegarder l'avatar"}
      </button>
    </div>
  );
};

AvatarChooser.propTypes = {
  handleInputEyes: PropTypes.func.isRequired,
  handleInputHands: PropTypes.func.isRequired,
  handleInputHat: PropTypes.func.isRequired,
  handleInputMouth: PropTypes.func.isRequired,
  handleInputColorBody: PropTypes.func.isRequired,
  handleInputColorBG: PropTypes.func.isRequired,
  choiceEyes: PropTypes.number,
  choiceHands: PropTypes.number,
  choiceHat: PropTypes.number,
  choiceMouth: PropTypes.number,
  choiceColorBody: PropTypes.string,
  choiceColorBG: PropTypes.string,
};

export default AvatarChooser;
