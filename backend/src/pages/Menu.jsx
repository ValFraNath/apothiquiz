import { PropTypes } from "prop-types";
import React from "react";
import { Link } from "react-router-dom";

import connectionImg from "../images/logo192.png";

const Menu = ({ user }) => {

  return (
    <>
    <img src={connectionImg} alt ="connection"/>
    <div id="menu">
        <Link to='/user'><button> Utilisateurs </button></Link>
        <Link to='/molecule'><button> Molécules </button></Link>
        <Link to='/property'><button> Propriétés (I, EI, IM) </button></Link>
        <Link to='/system'><button> Systèmes </button></Link>
        <Link to='/class'><button> Classes pharmacologiques </button></Link>
    </div>
    </>
  );
};

Menu.propTypes = {
  user: PropTypes.string,
};

export default Menu;
