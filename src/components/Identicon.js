import React from "react";

// sorry I know this is bad practice. babel complained about "experimental jsx not being supported" and adding @babel/preset-react didn't work so i created this little workaround. Also only seems to be working with a class component.
import blockies from "../../node_modules/blockies-identicon/blockies"

class Identicon extends React.Component {
  // eslint-disable-next-line no-useless-constructor
  constructor(props) {
    super(props);
  }
  getOpts() {
    return {
      seed: this.props.opts.seed || "foo",
      size: 9,
      scale: 4,
      spotcolor: "#000"
    };
  }
  componentDidMount() {
    this.draw();
  }
  draw() {
    blockies.render(this.getOpts(), this.canvas);
  }
  render() {
    return React.createElement("canvas", { ref: canvas => this.canvas = canvas });
  }
}

export default Identicon;
