import React from "react";
import { shallow } from "enzyme";
import { expect } from "chai";

import Login from "../components/Login";

describe("Well displayed Login component", function () {
  it("Should contains 2 text inputs and 1 button", function (done) {
    const wrapper = shallow(<Login />);

    expect(wrapper.find('input[type="text"]')).to.have.length(1);
    expect(wrapper.find('input[type="password"]')).to.have.length(1);
    expect(wrapper.find('input[type="submit"]')).to.have.length(1);
    done();
  });
});
