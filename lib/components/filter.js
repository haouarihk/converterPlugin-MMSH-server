// String.prototype.replaceAll = function ra(string, string2) {
//     return this.toLowerCase().split(string.toLowerCase()).join(string2);
// }
function replaceAll(strmain, str1, str2) {
    return strmain.toLowerCase().split(str1.toLowerCase()).join(str2);
}
export const DefaultFilter = {
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
export default async (string, filter) => {
    let _filter = filter || DefaultFilter;
    let _string = string;
    _string = (_filter.filterWords) ? await step1(_string, _filter) : _string;
    _string = (_filter.filterWords) ? await step2(_string, _filter) : _string;
    _string = (_filter.filterWords) ? await step3(_string) : _string;
    _string = (_filter.filterWords) ? await step4(_string, _filter) : _string;
    return _string;
};
// filter words
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
// filter commas
function step2(string, filter) {
    return new Promise((solve) => {
        let _string = string.replace(/"/gi, filter.replaceBy);
        _string = _string.replace(/'/gi, filter.replaceBy);
        solve(_string);
        return _string;
    });
}
// filter with decoding
function step3(string, filter) {
    return new Promise((solve) => {
        let _string = encodeURI(string);
        solve(_string);
        return _string;
    });
}
// filter slashes
function step4(string, filter) {
    return new Promise((solve) => {
        let _string = string.replace(/\\/gi, filter.replaceBy);
        _string = _string.replace(/\//gi, filter.replaceBy);
        solve(_string);
        return _string;
    });
}
