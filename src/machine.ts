//---------------------------------------------------------------------- machine
/**
 * # mvp-machine
 *
 * Simple, declarative-ish state machines inspired by statecharts.
 *
 * handles :
 *
 * - actions
 * - nested/compound states
 * - self transitions
 * - internal transitions
 * - state entry/exit events
 *
 * does not handle :
 *
 * - parallel states
 * - internal transitions to children compound states
 *
 * @note Footguns :
 *         - It is possible to set up infinite automatic transition loops
 */

/**
 * A relative or an absolute state path.
 */
export type StatePath = string | string[];
export type AbsoluteStatePath = Extract<StatePath, string[]>;
export type RelativeStatePath = Extract<StatePath, string>;
/**
 *
 */
export type InternalTransition = null;
/**
 * Define Transition as either a target State or an InternalTransition.
 *
 * @notes Transition to a State will trigger onEntry, onExit special actions
 * including on self-transitions where target State is the same as current State.
 *
 * @note InternalTransition is used to denote that no transition happens and
 * that the Action is executed without causing current State to change.
 */
export type Transition = StatePath | InternalTransition;

/**
 * Define Action handlers of a Machine Rules.
 *
 * After executing the Action, the Machine will transition to the returned
 * Transition value which is either a target State or a value to denote an
 * InternalTransition.
 */
export type PayloadShape = {
  command: string;
};

export type Action<TPayload extends PayloadShape> = (
  payload: TPayload
) => Transition;

/**
 * Define Rules with possible states, actions of a Machine.
 *
 * @note onEntry, onExit are special action automatically executed when the
 *       their parent state is entered/exited.
 *
 * @note onExit returned value is ignored to forbid automatic transitions
 *       from this special action.
 */

type StateNode<TPayload extends PayloadShape> =
  | {
      initial: StatePath;
      states: { [state: string]: Rules<TPayload> };
    }
  | { initial?: never; states?: never };

export type Rules<TPayload extends PayloadShape> = StateNode<TPayload> & {
  id?: string;
  entry?: Action<{ command: 'entry' }>;
  exit?: Action<{ command: 'exit' }>;
  on?: {
    [K in TPayload['command']]?: Action<TPayload & { command: K }>;
  };
};

/**
 * Define Machine object.
 */
export interface Machine<TPayload extends PayloadShape> {
  rules: Rules<TPayload>;
  _transition: (
    _current: Rules<TPayload>,
    state: AbsoluteStatePath,
    target: StatePath
  ) => AbsoluteStatePath;
  _target: (
    _current: Rules<TPayload>,
    state: RelativeStatePath
  ) => Rules<TPayload>;
  _targetAbsolute: (state: AbsoluteStatePath) => Rules<TPayload>;
  emit: (
    state: AbsoluteStatePath,
    action: string,
    payload: TPayload
  ) => AbsoluteStatePath;
}

/**
 * Define Machine constructor.
 */
export type MachineCtor<TPayload extends PayloadShape> = {
  new (rules: Rules<TPayload>): Machine<TPayload>;
};

/**
 * Create a new Machine object.
 */
export const Machine = function <TPayload extends PayloadShape>(
  this: Machine<TPayload>,
  rules: Rules<TPayload>
): Machine<TPayload> {
  if (!new.target) {
    throw new Error('Machine() must be called with new !');
  }

  this.rules = rules;
  /**
   * Execute Action handler if a rule for given action name exists in current
   * Machine State, passing along given payload as Action arguments.
   *
   * Transition to State returned by executed Action handler if any.
   *
   * @todo Consider using hasOwnProperty or not inheriting from Object to avoid
   *       unintended match on {} prototype methods.
   *
   * @todo Handle 'globally' available actions ?
   */
  this.emit = (() => {
    return (
      state: AbsoluteStatePath,
      action: TPayload['command'],
      payload: TPayload
    ) => {
      const _current = this._targetAbsolute(state);

      const handler = _current.on?.[action];
      if (handler) {
        // if (payload.length !== handler.length) {
        //   throw new Error(
        //     `${action} expects ${handler.length} arguments, ${payload.length} given !`
        //   );
        // }
        // const target = handler.apply(this, payload);
        const target = handler(payload);
        return target ? this._transition(_current, state, target) : state;
      }
      return state;
    };
  })();

  return this;
}; //as any) as MachineCtor<TestPayload>;
/**
 *
 */
Machine.prototype._targetAbsolute = function <TPayload extends PayloadShape>(
  this: Machine<TPayload>,
  state: AbsoluteStatePath
): Rules<TPayload> {
  let target = this.rules;

  for (let i = 0, depth = state.length; i < depth; i++) {
    const exists = target.states?.[state[i]];
    if (exists) {
      target = exists;
    } else {
      throw new Error(
        `${state[i]} does not exist in ${i ? state[i - 1] : 'top level'} !`
      );
    }
  }
  return target;
};

/**
 *
 */
Machine.prototype._target = function <TPayload extends PayloadShape>(
  this: Machine<TPayload>,
  _current: Rules<TPayload>,
  state: RelativeStatePath
): Rules<TPayload> {
  const target = _current.states?.[state];
  if (!target) {
    throw new Error(`${state} does not exist in ${JSON.stringify(_current)} !`);
  }
  return target;
};

/**
 *
 */
Machine.prototype._transition = function <TPayload extends PayloadShape>(
  this: Machine<TPayload>,
  _current: Rules<TPayload>,
  state: AbsoluteStatePath,
  target: StatePath
): AbsoluteStatePath {
  _current.exit?.({ command: 'exit' });

  let _new, newState;

  if (Array.isArray(target)) {
    _new = this._targetAbsolute(target);
    newState = target;
  } else {
    _new = this._target(_current, target);
    newState = [...state, target];
  }

  _new.entry?.({ command: 'entry' });

  return _new.initial
    ? this._transition(_new, newState, _new.initial)
    : newState;
};

/**
 * @todo Hook factory.
 */

/**
 * @todo Selector that return a '/' joined version of AbsolutePath.
 */

type WithDispatch = { dispatch: {} };
type TestPayload = WithDispatch &
  (
    | { command: 'fetchCalendars' }
    | { command: 'fetchCalendarsSuccess'; delay: number }
    | {
        command: 'fetchCalendarsFailure';
        a: string;
        b: number;
        c: { d: boolean; e: string };
      }
  );

const AnotherRuleSet: Rules<TestPayload> = {
  id: 'calendarMachine',
  initial: 'IDLE',
  states: {
    LOADING_CALENDARS: {
      on: {
        fetchCalendarsSuccess: (payload) => {
          //   if (payload.command === 'fetchCalendarsSuccess') {
          console.log(payload.command, payload.dispatch);
          //   }
          return 'CALENDARS_FETCHED';
        },
        fetchCalendarsFailure: ({ command, dispatch, a, b, c: { d, e } }) =>
          'FAILURE',
      },
    },
  },
};

const testMachine = new (Machine as any as MachineCtor<TestPayload>)(AnotherRuleSet);

// const actionTest: Action<TestPayload> = (payload) => {
//   if (payload.command === 'fetchCalendarsSuccess') {
//     console.log(payload.command, payload.delay);
//   }
//   return null;
// };

// actionTest({ command: 'fetchCalendarsSuccess', delay: 8 });
// const actionTest3: Action<{ command: string; a: string }> = () =>
//   null;
// const actionTest2: Action<{ command: string }> = () => null;
// const actionTest4: Action<{ command: string }> = (payload: { a: string }) => null;

// const AnotherRuleSet: Rules<TestPayload> = {
//   id: 'calendarMachine',
//   initial: 'IDLE',
//   states: {
//     IDLE: {
//       on: {
//         fetchCalendars: () => 'LOADING_CALENDARS',
//       },
//     },
//     LOADING_CALENDARS: {
//       on: {
//         fetchCalendarsSuccess: ({
//           a: string,
//           b: number,
//           c: { d: boolean, e: string },
//         }) => 'CALENDARS_FETCHED',
//         fetchCalendarsFailure: () => 'FAILURE',
//       },
//     },
//     CALENDARS_FETCHED: {
//       on: {
//         fetchEvents: () => 'LOADING_EVENTS',
//         // displayDay: "DAY",
//         // displayWeek: "WEEK",
//         // displayYear: "YEAR",
//       },
//     },
//     LOADING_EVENTS: {
//       on: {
//         fetchEventsSuccess: () => 'DISPLAY',
//         fetchEventsFailure: () => 'FAILURE',
//       },
//     },
//     DISPLAY: {
//       on: {
//         changeDate: () => 'LOADING_EVENTS',
//         createEvent: () => 'CREATING_EVENT',
//         updateEvent: () => 'UPDATING_EVENT',
//         editEvent: () => 'EDIT',
//       },
//     },
//     EDIT: {
//       on: {
//         updateEvent: () => 'UPDATING_EVENT',
//         createEvent: () => 'CREATING_EVENT',
//         deleteEvent: () => 'DELETING_EVENT',
//         cancelEditEvent: () => 'DISPLAY',
//       },
//     },
//   },
// };
