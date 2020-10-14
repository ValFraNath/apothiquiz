import React, { Component } from "react";
import { BrowserRouter as Router, Link, Route, Switch } from "react-router-dom";
import "./styles/styles.scss";
import HelloWorld from "./components/HelloWorld";
import InstallApp from "./components/InstallApp";

export default class App extends Component {
  constructor(props) {
    super(props);

    // App installation
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();

      this.setState({
        installPrompt: e
      })
    });

    this.state = {
      installPrompt: null
    };
  }

  render() {
    return (
      <Router>
        <Switch>
          <Route path="/" exact>
            <Link to="/hello_world">Go to Hello World</Link>
            { this.state.installPrompt !== null && (
              <InstallApp installPrompt={this.state.installPrompt} />
            )}
          </Route>
          <Route path="/hello_world" exact component={HelloWorld} />
          <Route status={404}>Not Found</Route>
        </Switch>
      </Router>
    );
  }
}