import { CaretSortIcon } from "@modulz/radix-icons";
import * as Collapsible from "@radix-ui/react-collapsible";

import { PropTypes } from "prop-types";
import React, { useState } from "react";
import { useQuery } from "react-query";
import { Link } from "react-router-dom";

import Avatar from "../components/Avatar";
import AvatarChooser from "../components/AvatarChooser";
import Loading from "../components/status/Loading";
import AuthService from "../services/auth.service";

const Profile = ({ history }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [avatar, setAvatar] = useState();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const { data, isPlaceholderData, isError } = useQuery(["user", "me"]);
  const { isAdmin } = AuthService.getCurrentUser();

  if (!isInitialized && !isPlaceholderData && !isError) {
    setAvatar(data.avatar);
    setIsInitialized(true);
  }

  function updateValue(valueName, newValue) {
    setAvatar((prevAvatar) => ({ ...prevAvatar, [valueName]: newValue }));
  }

  function updateTheme(event) {
    const { value } = event.target;
    localStorage.setItem("theme", value);
    setTheme(value);
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
          {!isInitialized ? (
            <Loading />
          ) : (
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
          )}
        </Collapsible.Content>
      </Collapsible.Root>

      {isAdmin && (
        <Link to="/admin" className="btn">
          Espace administrateur
        </Link>
      )}

      <p>Choix du thème</p>
      <select value={theme} onChange={updateTheme}>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="automatic">Automatique</option>
      </select>

      <button
        className="btn"
        onClick={async () => {
          await AuthService.logout();
          document.location.replace("/");
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
