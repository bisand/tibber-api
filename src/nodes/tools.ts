/* eslint-disable no-unused-vars */
export class UrlTools {
    public validateUrl(url: string) {
        const regExp = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
        // var feedUrl = $("#node-config-input-feedUrl").val();
        // var queryUrl = $("#node-config-input-queryUrl").val();
        return new RegExp(regExp).test(url);
    }
}
