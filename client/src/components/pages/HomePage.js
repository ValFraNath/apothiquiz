import React, { Component } from "react";
import axios from "axios";

import AuthService from "../../services/auth.service";

class HomePage extends Component {
  render() {
    const currentUser = AuthService.getCurrentUser();
    const listOfUsers = [currentUser];

    axios
      .post("/api/v1/users/about", listOfUsers)
      .then(res => {
        console.log(res.data);
      })
      .catch(err => console.error(err));

    return (
      <main id="userhomepage">
        <p>Welcome</p>
      </main>
    );
  }
}

export default HomePage;