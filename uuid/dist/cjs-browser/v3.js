"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.URL = exports.DNS = void 0;
const md5_js_1 = require("./md5.js");
const v35_js_1 = require("./v35.js");
var v35_js_2 = require("./v35.js");
Object.defineProperty(exports, "DNS", { enumerable: true, get: function () { return v35_js_2.DNS; } });
Object.defineProperty(exports, "URL", { enumerable: true, get: function () { return v35_js_2.URL; } });
function v3(value, namespace, buf, offset) {
    return (0, v35_js_1.default)(0x30, md5_js_1.default, value, namespace, buf, offset);
}
v3.DNS = v35_js_1.DNS;
v3.URL = v35_js_1.URL;
exports.default = v3;
