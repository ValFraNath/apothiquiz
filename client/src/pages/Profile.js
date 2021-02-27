import { CaretSortIcon } from "@modulz/radix-icons";
import * as Collapsible from "@radix-ui/react-collapsible";

import { PropTypes } from "prop-types";
import React, { useState } from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";

import Avatar from "../components/Avatar";
import AvatarChooser from "../components/AvatarChooser";
import AuthService from "../services/auth.service";

const Profile = ({ history }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [avatar, setAvatar] = useState();
  const { data, isPlaceholderData } = useQuery(["user", "me"]);

  if (isPlaceholderData) {
    return <span>Chargement</span>;
  }

  if (!isInitialized) {
    setAvatar(data.avatar);
    setIsInitialized(true);
  }

  function updateValue(valueName, newValue) {
    setAvatar((prevAvatar) => ({ ...prevAvatar, [valueName]: newValue }));
  }

  return (
    <main id="profile">
      <Avatar size="256px" infos={avatar} />

      <Collapsible.Root>
        <Collapsible.Button className="btn">
          Personnaliser mon avatar
          <CaretSortIcon height="20px" width="20px" style={{ marginLeft: "10px" }} />
        </Collapsible.Button>
        <Collapsible.Content>
          <AvatarChooser
            choiceEyes={avatar?.eyes}
            choiceHands={avatar?.hands}
            choiceHat={avatar?.hat}
            choiceMouth={avatar?.mouth}
            choiceColorBody={avatar?.colorBody}
            choiceColorBG={avatar?.colorBG}
            handleInputEyes={(val) => updateValue("eyes", parseInt(val))}
            handleInputHands={(val) => updateValue("hands", parseInt(val))}
            handleInputHat={(val) => updateValue("hat", parseInt(val))}
            handleInputMouth={(val) => updateValue("mouth", parseInt(val))}
            handleInputColorBody={(val) => updateValue("colorBody", val)}
            handleInputColorBG={(val) => updateValue("colorBG", val)}
          />
        </Collapsible.Content>
      </Collapsible.Root>

      <button
        className="btn"
        onClick={() => {
          AuthService.logout();
          history.push("/");
        }}
      >
        Me déconnecter
      </button>

      <Link to="/about" className="btn">
        À propos de l'application
      </Link>
    </main>
  );
};

Profile.propTypes = {
  history: PropTypes.object.isRequired,
};

export default Profile;
