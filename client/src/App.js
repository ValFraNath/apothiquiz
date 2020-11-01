import React, { Component } from "react";
import { BrowserRouter as Router, Link, Route, Switch } from "react-router-dom";
import "./styles/styles.scss";
import HelloWorld from "./components/HelloWorld";
import InstallApp from "./components/InstallApp";
import Train from "./components/Train";
import OfflineBanner from "./components/OfflineBanner";
import Login from "./components/Login";
import AuthService from "./services/auth.service";
import UserBadge from "./components/UserBadge";
import axios from "axios";
import WhoAmI from "./components/PrivateTemp";

/**
 * Set up the authorization header in all request is the user is logged in
 */
axios.interceptors.request.use(function (config) {
  const user = AuthService.getCurrentUser();
  if (user && user.token && user.pseudo) {
    config.headers.Authorization = `Barear ${user.token}`;
  }
  return config;
});

export default class App extends Component {
  constructor(props) {
    super(props);

    let user = AuthService.getCurrentUser();
    if (user) {
      user = user.pseudo;
    }

    this.state = {
      installPromptEvent: null,
      user: user,
    };
  }

  componentDidMount() {
    // Display installation button
    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();

      this.setState({
        installPromptEvent: event,
      });
    });
  }

  render() {
    return (
      <Router>
        <OfflineBanner />
        {this.state.user && UserBadge(this.state.user)}
        <Switch>
          <Route path="/" exact>
            <Link to="/hello_world">Go to Hello World</Link>
            <Link to="/train">Train</Link>
            {this.state.installPromptEvent !== null && (
              <InstallApp installPromptEvent={this.state.installPromptEvent} />
            )}
            {this.state.user === null && <Link to="/login">Login</Link>}
            <Link to="/private">Who an I ? (private)</Link>
          </Route>
          <Route path="/hello_world" exact component={HelloWorld} />
          <Route path="/train" exact component={Train} />
          <Route path="/login" exact component={Login} />
          <Route path="/private" exact component={WhoAmI} />
        </Switch>
      </Router>
    );
  }
}
