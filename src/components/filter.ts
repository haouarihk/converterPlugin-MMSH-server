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
        "fuck", "shit", "Swear", "www", "https", "http", "*", ">", '"'
    ],
    filterWords: true,

    filterComas: true,

    filterUsingEncoder: false,

    filterSlashes: true,

    filterSpaces: true,

    replaceBy: "u",
}

export default async (string: string, filter: FilterOps) => {
    let _filter: FilterOps = filter || DefaultFilter;
    let _string: string = string;

    _string = (_filter.filterWords) ? await layer1(_string, _filter) : _string;
    _string = (_filter.filterComas) ? await layer2(_string, _filter) : _string;
    _string = (_filter.filterUsingEncoder) ? await layer3(_string) : _string;
    _string = (_filter.filterSlashes) ? await layer4(_string, _filter) : _string;
    _string = (_filter.filterSpaces) ? await layer5(_string, _filter) : _string;


    return _string
}

/** Filtering words out */
function layer1(str: string, filter: FilterOps): Promise<string> {
    return new Promise((solve) => {
        let _str = str
        filter.words.forEach((word: string) => {
            _str = replaceAll(_str, word, filter.replaceBy)
        })
        solve(_str)
        return _str;
    })
}

/** Filtering commas out */
function layer2(str: string, filter: FilterOps): Promise<string> {
    return new Promise((solve) => {
        let _str = str.replace(/"/gi, filter.replaceBy)
        _str = _str.replace(/'/gi, filter.replaceBy)
        solve(_str);
        return _str
    })
}

/** Filtering with encoding */
function layer3(str: string): Promise<string> {
    return new Promise((solve) => {
        let _str = encodeURI(str)
        solve(_str);
        return _str
    })
}

/** Filtering slashes out */
function layer4(str: string, filter: FilterOps): Promise<string> {
    return new Promise((solve) => {
        let _str = str.replace(/\\/gi, filter.replaceBy)
        _str = _str.replace(/\//gi, filter.replaceBy)
        solve(_str);
        return _str
    })
}

/** Filtering spaces out */
function layer5(str: string, filter: FilterOps): Promise<string> {
    return new Promise((solve) => {
        let _str = str.replace(/ /gi, filter.replaceBy)
        solve(_str);
        return _str
    })
}