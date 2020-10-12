import React from "react";
import { BrowserRouter as Router, Link, Route, Switch } from "react-router-dom";
import "./App.css";
import HelloWorld from "./components/HelloWorld";

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" exact>
          <Link to="/hello_world">Go to Hello World</Link>
        </Route>
        <Route path="/hello_world" exact component={HelloWorld} />
        <Route status={404} >Not Found</Route>
      </Switch>
    </Router>
  );
}

export default App;
