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
