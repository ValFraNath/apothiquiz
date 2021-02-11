import { CaretSortIcon } from "@modulz/radix-icons";
import * as Collapsible from "@radix-ui/react-collapsible";

import React, { useState } from "react";
import {
  // useQuery,
  useQueryClient,
} from "react-query";
import { Link } from "react-router-dom";

import Avatar from "../components/Avatar";
import ChooseAvatar from "../components/ChooseAvatar";
import AuthService from "../services/auth.service";

const Profile = () => {
  const queryClient = useQueryClient();
  const user = queryClient.getQueryData(["user", "me"]);

  // TODO: fails to initalise when you arrive directly on this page
  const [avatar, setAvatar] = useState(user?.avatar);

  return (
    <main id="profile">
      <Avatar
        size="256px"
        eyes={avatar?.eyes}
        hands={avatar?.hands}
        hat={avatar?.hat}
        mouth={avatar?.mouth}
        colorBody={avatar?.colorBody}
        colorBG={avatar?.colorBG}
      />

      <Collapsible.Root>
        <Collapsible.Button className="btn">
          Personnaliser mon avatar
          <CaretSortIcon height="20px" width="20px" style={{ marginLeft: "10px" }} />
        </Collapsible.Button>
        <Collapsible.Content>
          <ChooseAvatar
            choiceEyes={avatar?.eyes}
            choiceHands={avatar?.hands}
            choiceHat={avatar?.hat}
            choiceMouth={avatar?.mouth}
            choiceColorBody={avatar?.colorBody}
            choiceColorBG={avatar?.colorBG}
            handleInputEyes={(val) => setAvatar({ eyes: parseInt(val) })}
            handleInputHands={(val) => setAvatar({ hands: parseInt(val) })}
            handleInputHat={(val) => setAvatar({ hat: parseInt(val) })}
            handleInputMouth={(val) => setAvatar({ mouth: parseInt(val) })}
            handleInputColorBody={(val) => setAvatar({ colorBody: val })}
            handleInputColorBG={(val) => setAvatar({ colorBG: val })}
          />
        </Collapsible.Content>
      </Collapsible.Root>

      <button
        className="btn"
        onClick={() => {
          AuthService.logout();
          document.location.replace("/");
        }}
      >
        Me déconnecter
      </button>

      <Link to="/about" className="btn btn-fw">
        À propos de l'application
      </Link>
    </main>
  );
};

export default Profile;
