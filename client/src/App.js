import React, { Component } from "react";
import { BrowserRouter as Router, Link, Route, Switch } from "react-router-dom";
import "./styles/styles.scss";
import HelloWorld from "./components/HelloWorld";
import InstallApp from "./components/InstallApp";

export default class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      installPromptEvent: null,
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
        <Switch>
          <Route path="/" exact>
            <Link to="/hello_world">Go to Hello World</Link>
            {this.state.installPromptEvent !== null && (
              <InstallApp installPromptEvent={this.state.installPromptEvent} />
            )}
          </Route>
          <Route path="/hello_world" exact component={HelloWorld} />
          <Route status={404}>Not Found</Route>
        </Switch>
      </Router>
    );
  }
}
