import { expect } from "chai";
import { shallow, mount } from "enzyme";
import React from "react";

import App from "../App";

/* eslint-disable */
describe("Good display", () => {
  it("renders without crashing", async () => {
    const wrapper = shallow(<App />);
    await wrapper.instance().componentDidMount();
  });
});
