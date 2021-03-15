import { shallow } from "enzyme";
import React from "react";

import App from "../App";

describe("Good display", () => {
  it("renders without crashing", () => {
    const wrapper = shallow(<App />);
    wrapper.instance().componentDidMount();
  });
});
