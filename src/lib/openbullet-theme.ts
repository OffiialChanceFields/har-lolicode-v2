// Converted from: https://github.com/formidablelabs/prism-react-renderer/blob/master/src/themes/nightOwl.js
// Original: https://github.com/sdras/night-owl-vscode-theme
// Converted by: LoliScript (https://github.com/LoliScript/LoliScript)

import { PrismTheme } from "prism-react-renderer";

const theme: PrismTheme = {
  plain: {
    color: "hsl(220, 9%, 95%)",
    backgroundColor: "hsl(220, 13%, 8%)"
  },
  styles: [{
    types: ["comment", "prolog", "doctype", "cdata"],
    style: {
      color: "hsl(220, 9%, 65%)"
    }
  }, {
    types: ["namespace"],
    style: {
      opacity: 0.7
    }
  }, {
    types: ["string", "attr-value"],
    style: {
      color: "hsl(142, 76%, 45%)"
    }
  }, {
    types: ["punctuation", "operator"],
    style: {
      color: "hsl(220, 9%, 65%)"
    }
  }, {
    types: ["entity", "url", "symbol", "number", "boolean", "variable", "constant", "property", "regex", "inserted"],
    style: {
      color: "hsl(192, 84%, 50%)"
    }
  }, {
    types: ["at-rule", "keyword", "attr-name", "selector"],
    style: {
      color: "hsl(271, 91%, 65%)"
    }
  }, {
    types: ["function", "deleted", "tag"],
    style: {
      color: "hsl(0, 84%, 60%)"
    }
  }, {
    types: ["function-variable"],
    style: {
      color: "hsl(192, 84%, 50%)"
    }
  }, {
    types: ["tag", "selector", "keyword"],
    style: {
      color: "hsl(192, 84%, 50%)"
    }
  }]
};

export default theme;
