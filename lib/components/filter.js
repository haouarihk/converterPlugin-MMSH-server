"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultFilter = void 0;
function replaceAll(strmain, str1, str2) {
    return strmain.toLowerCase().split(str1.toLowerCase()).join(str2);
}
exports.DefaultFilter = {
    enabled: true,
    words: [
        "fuck", "shit", "Swear", "www", "https", "http", "*", ">", '"'
    ],
    filterWords: true,
    filterComas: true,
    filterUsingEncoder: false,
    filterSlashes: true,
    filterSpaces: true,
    replaceBy: "u",
};
exports.default = (string, filter) => __awaiter(void 0, void 0, void 0, function* () {
    let _filter = filter || exports.DefaultFilter;
    let _string = string;
    _string = (_filter.filterWords) ? yield layer1(_string, _filter) : _string;
    _string = (_filter.filterComas) ? yield layer2(_string, _filter) : _string;
    _string = (_filter.filterUsingEncoder) ? yield layer3(_string) : _string;
    _string = (_filter.filterSlashes) ? yield layer4(_string, _filter) : _string;
    _string = (_filter.filterSpaces) ? yield layer5(_string, _filter) : _string;
    return _string;
});
function layer1(str, filter) {
    return new Promise((solve) => {
        let _str = str;
        filter.words.forEach((word) => {
            _str = replaceAll(_str, word, filter.replaceBy);
        });
        solve(_str);
        return _str;
    });
}
function layer2(str, filter) {
    return new Promise((solve) => {
        let _str = str.replace(/"/gi, filter.replaceBy);
        _str = _str.replace(/'/gi, filter.replaceBy);
        solve(_str);
        return _str;
    });
}
function layer3(str) {
    return new Promise((solve) => {
        let _str = encodeURI(str);
        solve(_str);
        return _str;
    });
}
function layer4(str, filter) {
    return new Promise((solve) => {
        let _str = str.replace(/\\/gi, filter.replaceBy);
        _str = _str.replace(/\//gi, filter.replaceBy);
        solve(_str);
        return _str;
    });
}
function layer5(str, filter) {
    return new Promise((solve) => {
        let _str = str.replace(/ /gi, filter.replaceBy);
        solve(_str);
        return _str;
    });
}
//# sourceMappingURL=filter.js.map