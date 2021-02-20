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
        "fuck", "shit", "Swear", "www", "https", "http"
    ],
    replaceBy: "u",
    filterWords: true,
    filterComas: true,
    filterSlashes: true,
    filterUsingDecoder: true
};
exports.default = (string, filter) => __awaiter(void 0, void 0, void 0, function* () {
    let _filter = filter || exports.DefaultFilter;
    let _string = string;
    _string = (_filter.filterWords) ? yield step1(_string, _filter) : _string;
    _string = (_filter.filterWords) ? yield step2(_string, _filter) : _string;
    _string = (_filter.filterWords) ? yield step3(_string) : _string;
    _string = (_filter.filterWords) ? yield step4(_string, _filter) : _string;
    return _string;
});
function step1(string, filter) {
    return new Promise((solve) => {
        let _string = string;
        filter.words.forEach((word) => {
            _string = replaceAll(_string, word, filter.replaceBy);
        });
        solve(_string);
        return _string;
    });
}
function step2(string, filter) {
    return new Promise((solve) => {
        let _string = string.replace(/"/gi, filter.replaceBy);
        _string = _string.replace(/'/gi, filter.replaceBy);
        solve(_string);
        return _string;
    });
}
function step3(string, filter) {
    return new Promise((solve) => {
        let _string = encodeURI(string);
        solve(_string);
        return _string;
    });
}
function step4(string, filter) {
    return new Promise((solve) => {
        let _string = string.replace(/\\/gi, filter.replaceBy);
        _string = _string.replace(/\//gi, filter.replaceBy);
        solve(_string);
        return _string;
    });
}
//# sourceMappingURL=filter.js.map