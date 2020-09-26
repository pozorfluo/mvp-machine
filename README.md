# mvp-machine

Simple, declarative-ish Typescript state machines inspired by statecharts.

handles :

- actions
- automatic transitions
- nested/compound states
- self transitions
- internal transitions
- state entry/exit events

allows :

- guards
- transient states
- final states
- raised events

does not handle :

- parallel states
- internal transitions to children compound states