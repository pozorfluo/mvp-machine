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
 * absolute state id    : '#top.state.sub'
 * relative state id    : 'sub'
 * absolute state path  : ['#top', 'state', 'sub']
 * relative state path  : 'sub'
 */
export type StateId = string;
export const STATE_PATH_DELIMITER = '.';
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
export type Transition = StateId | InternalTransition;

/**
 * Define Action handlers of a Machine Rules.
 *
 * After executing the Action, the Machine will transition to the returned
 * Transition value which is either a target State or a value to denote an
 * InternalTransition.
 */
export type PayloadShape<TCommand = string> = {
  command: TCommand;
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
export interface Machine<TPayload extends PayloadShape = any> {
  rules: Rules<TPayload> & { id: string };
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
    absoluteStateId: StateId,
    // action: string,
    payload: TPayload
  ) => StateId;
}

/**
 * @note A lone '#top' will yield a relative path that makes no sense.
 */
export function toStatePath(id: StateId): StatePath {
  const path = id.split(STATE_PATH_DELIMITER);
  return path.length === 1 ? path[0] : path.slice(1);
}

export function toStateId(topId: string, path: AbsoluteStatePath): StateId {
  return `#${topId}.${path.join('.')}`;
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
  rules: Rules<TPayload> & { id: string }
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
      absoluteStateId: StateId,
      //   action: TPayload['command'],
      payload: TPayload
    ) => {
      /** @todo Look for a way to 'enforce' absoluteStateId beyond asking nicely. */
      const statePath = toStatePath(absoluteStateId) as AbsoluteStatePath;
      //   const _current = this._targetAbsolute(state);

      let _current: Rules<TPayload> = this.rules;
      let handler: Action<TPayload> | undefined = undefined;

      for (let i = 0, depth = statePath.length; i < depth; i++) {
        const exists = _current.states?.[statePath[i]];
        if (exists) {
            _current = exists;
        } else {
          throw new Error(
            `Invalid path : ${absoluteStateId} does not exist in ${this.rules.id} !`
          );
        }
        /**
         * Latch on deepest available command handler if any.
         * 
         * @todo Check if asserting TPayload['command'] is fine or if TS has reasons
         *       to be dubious about it.
         */
        handler = _current.on?.[payload.command as TPayload['command']] ?? handler;
      }

      if (handler) {
        const target = handler(payload);
        return target
          ? toStateId(
              this.rules.id,
              this._transition(_current, statePath, target)
            )
          : absoluteStateId;
      }
      return absoluteStateId;
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
  let target: Rules<TPayload> = this.rules;

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

  /**
   * @todo fire whatever is registered as .onTransition here.
   */
  return _new.initial
    ? this._transition(_new, newState, _new.initial)
    : newState;
};

/**
 * @todo Hook factory.
 */

/**
 *
 * @todo Selector that return a delimiter joined version of AbsolutePath.
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

const testMachine = new ((Machine as any) as MachineCtor<TestPayload>)(
  AnotherRuleSet
);

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
