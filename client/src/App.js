import React from 'react';
import {BrowserRouter as Router, Link, Route} from "react-router-dom";
import './App.css';
import HelloWorld from "./components/HelloWorld";


function App() {
    return (
        <Router>
            <Link to="/hello_world">Go to Hello World</Link>
            <Route path='/hello_world' component={HelloWorld}/>
        </Router>
    );
}

export default App;
