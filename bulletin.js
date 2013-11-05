// USGAE:
//
// bulletin.check();    // request permission: !!! Must be a user action callback, like click
// bulletin.autocheck();    // request permission on first click anywhere on the document
//
// var myBulletin = bulletin({
//     title: "Title",
//     message: "Some Message",    // optional
//     image: "Image URL",    // optional
//     tag: "unique identifier",    // optional: prevent duplicates
//     onclick: function () {    // optional
//         // do something on click
//     },
//     onclose: function () {    // optional
//         // do something on close, unless clicked on (excluding X button)
//     },
//     timer: 5000 // optional: ms to auto close
// });
//
// CLOSE:
//
// if (typeof myBulletin.cancal === "function") {
//     myBulletin.cancal();
// } else if (typeof myBulletin.close === "function") {
//     myBulletin.close();
// }

var bulletin = (function __bulletin__ (window, document) {
    var exports,
        askPermission,
        autocheck = false,
        API;

    window.Notification = window.Notification ||
        window.webkitNotification ||
        window.mozNotification ||
        window.msNotification ||
        window.oNotification;

    if (!!window.webkitNotifications) {
        API = "webkitNotifications";
    } else if (!!window.Notification) {
        API = "Notification";
    } else {
        API = null;
    }

    switch (API) {
        case "webkitNotifications":
            exports = function bulletin (options) {
                var notification;
                options = options || {};
                options.image = options.image || null;
                options.title = options.title || "";
                options.message = options.message || "";
                if (!window.webkitNotifications || !window.webkitNotifications.createNotification) {
                    return;
                }
                try {
                    notification = window.webkitNotifications.createNotification(options.image,
                            options.title,
                            options.message);

                    if (typeof options.timer === "number") {
                        notification.onshow = function notification$onshow () {
                            setTimeout(function notification$onclose () {
                                notification.onclose();
                            }, options.timer);
                        };
                    }

                    notification.onclick = function notification$onclick (evt) {
                        window.focus();
                        if (typeof options.onclick === "function") {
                            options.onclick();
                        }
                        options.onclose = null;
                        this.onclose();
                    };
                    notification.onclose = function notification$onclose (evt) {
                        if (typeof options.onclose === "function") {
                            options.onclose();
                        }
                        this.onclose();
                    };
                    notification.show();
                    return notification;
                } catch (err) {
                    return null;
                }
            };

            askPermission = function bulletin$_askPermission () {
                window.webkitNotifications.requestPermission();
                if (autocheck) {
                    document.removeEventListener("click", exports.check);
                }
            };
            exports.check = function bulletin$check () {
                if (!window.webkitNotifications) {
                    return;
                }

                // PERMISSION_ALLOWED = 0;
                // PERMISSION_NOT_ALLOWED = 1;
                // PERMISSION_DENIED = 2;
                if (window.webkitNotifications.checkPermission() !== 0) {
                    askPermission();
                }
            };
            exports.autocheck = function bulletin$autocheck () {
                if (typeof window.webkitNotifications === "object" &&
                        window.webkitNotifications.checkPermission() !== 0) {
                    autocheck = true;
                    document.addEventListener("click", exports.check);
                }
            };
            break;
        case "Notification":
            exports = function bulletin (options) {
                var notification,
                    details = {};
                options = options || {};
                options.title = options.title || "";

                details.icon = options.image || null;
                details.body = options.message || "";

                try {
                    notification = new Notification(options.title, details);

                    if (typeof options.timer === "string") {
                        options.timer = parseInt(options.timer, 10);
                    }
                    if (typeof options.timer === "number" &&
                                !!options.timer) {
                        notification.onshow = function notification$onshow () {
                            setTimeout(function notification$close () {
                                notification.close();
                            }, options.timer);
                        };
                    }

                    notification.onclick = function notification$onclick (evt) {
                        window.focus();
                        if (typeof options.onclick === "function") {
                            options.onclick();
                        }
                        options.onclose = null;
                        this.close();
                    };
                    notification.onclose = function notification$onclose (evt) {
                        if (typeof options.onclose === "function") {
                            options.onclose();
                        }
                        this.close();
                    };
                    return notification;
                } catch (err) {
                    return null;
                }
            };
            askPermission = function bulletin$_askPermission () {
                Notification.requestPermission(function Notification$requestPermission (status) {

                    // This allows to use Notification.permission with Chrome/Safari
                    if (Notification.permission !== status) {
                        Notification.permission = status;
                    }
                });
                if (autocheck) {
                    document.removeEventListener("click", exports.check);
                }
            };
            exports.check = function bulletin$check () {
                // "default"
                // "denied"
                // "granted"
                switch (Notification.permission) {
                    case "default":
                    case "denied":
                        askPermission();
                        break;
                    case "granted":
                        break;
                }
            };
            exports.autocheck = function bulletin$autocheck () {

                // "default"
                // "denied"
                // "granted"
                switch (Notification.permission) {
                    case "default":
                    case "denied":
                        autocheck = true;
                        document.addEventListener("click", exports.check);
                        break;
                    case "granted":
                        break;
                }
            };

            break;
        case null:
        default:
            exports = function bulletin () {
                return null;
            };
            exports.check = function bulletin$check () {};
            exports.autocheck = function bulletin$autocheck () {};
            return exports;
            break;
    }

    return exports;
}(window, document));
