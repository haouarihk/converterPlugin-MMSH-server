export default class Router {
    constructor(props) {
        this.app = props.app;
        this.pages = props.pages;
        if (props.messagePage)
            this.messagePage = props.messagePage;
    }
    message(str) {
        if (!this.messagePage) {
            throw "you don't have a messagePage property set";
        }
        return;
    }
    page(name, props) {
    }
}
