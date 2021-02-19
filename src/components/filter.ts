// String.prototype.replaceAll = function ra(string, string2) {
//     return this.toLowerCase().split(string.toLowerCase()).join(string2);
// }

import { FilterOps } from "../../d/types";


function replaceAll(strmain: string, str1: string, str2: string) {
    return strmain.toLowerCase().split(str1.toLowerCase()).join(str2);
}




export const DefaultFilter: FilterOps = {
    enabled: true,

    words: [
        "fuck", "shit", "Swear", "www", "https", "http"
    ],
    replaceBy: "u",

    filterWords: true,

    filterComas: true,

    filterSlashes: true,

    filterUsingDecoder: true
}

export default async (string: string, filter: FilterOps) => {
    let _filter: FilterOps = filter || DefaultFilter;
    let _string: string = string;

    _string = (_filter.filterWords) ? await step1(_string, _filter) : _string;
    _string = (_filter.filterWords) ? await step2(_string, _filter) : _string;
    _string = (_filter.filterWords) ? await step3(_string) : _string;
    _string = (_filter.filterWords) ? await step4(_string, _filter) : _string;

    return _string
}

// filter words
function step1(string: string, filter: FilterOps): Promise<string> {
    return new Promise((solve) => {
        let _string = string
        filter.words.forEach((word: string) => {
            _string = replaceAll(_string, word, filter.replaceBy)
        })
        solve(_string)
        return _string;
    })
}

// filter commas
function step2(string: string, filter: FilterOps): Promise<string> {
    return new Promise((solve) => {
        let _string = string.replace(/"/gi, filter.replaceBy)
        _string = _string.replace(/'/gi, filter.replaceBy)
        solve(_string);
        return _string
    })
}

// filter with decoding
function step3(string: string, filter?: FilterOps): Promise<string> {
    return new Promise((solve) => {
        let _string = encodeURI(string)
        solve(_string);
        return _string
    })
}

// filter slashes
function step4(string: string, filter: FilterOps): Promise<string> {
    return new Promise((solve) => {
        let _string = string.replace(/\\/gi, filter.replaceBy)
        _string = _string.replace(/\//gi, filter.replaceBy)
        solve(_string);
        return _string
    })
}