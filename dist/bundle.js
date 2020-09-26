(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./machine"), exports);

},{"./machine":3}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepFreeze = void 0;
exports.deepFreeze = function (obj) {
    const props = Object.getOwnPropertyNames(obj);
    const length = props.length;
    Object.freeze(obj);
    for (let i = 0; i < length; i++) {
        const value = obj[props[i]];
        if (value) {
            const type = typeof value;
            if ((type === 'object' || type === 'function') &&
                !Object.isFrozen(value)) {
                exports.deepFreeze(value);
            }
        }
    }
    return obj;
};

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Machine = void 0;
const deep_freeze_1 = require("./lib/deep-freeze");
exports.Machine = function (rules, initial_state) {
    if (!new.target) {
        throw new Error('Machine() must be called with new !');
    }
    this.states = deep_freeze_1.deepFreeze(rules);
    this.emit = (() => {
        return (action, ...payload) => {
            if (action in this._current.actions) {
                const handler = this._current.actions[action];
                if (payload.length !== handler.length) {
                    throw new Error(`${action} expects ${handler.length} arguments, ${payload.length} given !`);
                }
                const target = handler.apply(this, payload);
                if (target) {
                    this._transition(target);
                }
            }
        };
    })();
    this._current = { init: { actions: {} } };
    this._transition(initial_state);
    return this;
};
exports.Machine.prototype._transition = function (state) {
    if ('onExit' in this._current) {
        this._current.onExit();
    }
    let target = this;
    const depth = state.length;
    for (let i = 0; i < depth; i++) {
        const s = state[i];
        if (s in target.states) {
            target = target.states[s];
        }
        else {
            throw new Error(`${s} does not exist in ${i ? state[i - 1] : 'top level'} !`);
        }
    }
    this._current = target;
    this._latest_transition = state;
    if ('onEntry' in this._current) {
        const automatic_transition = this._current.onEntry();
        if (automatic_transition) {
            this._transition(automatic_transition);
        }
    }
};
exports.Machine.prototype.peek = function () {
    return [...this._latest_transition];
};

},{"./lib/deep-freeze":2}]},{},[1]);
