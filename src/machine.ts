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
export type CommandShape<TCommand = string> = {
  command: TCommand;
};

export type Action<TCommand extends CommandShape> = (
  payload: TCommand
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

type StateNode<TCommand extends CommandShape> =
  | {
      initial: StatePath;
      states: { [state: string]: Rules<TCommand> };
    }
  | { initial?: never; states?: never };

export type Rules<TCommand extends CommandShape> = StateNode<TCommand> & {
  id?: string;
  entry?: Action<{ command: 'entry' }>;
  exit?: Action<{ command: 'exit' }>;
  on?: {
    [K in TCommand['command']]?: Action<TCommand & { command: K }>;
  };
};

export type MachineConfig<TCommand extends CommandShape> = Rules<TCommand> & {
  id: string;
};
/**
 * Define Machine object.
 */
export interface Machine<TCommand extends CommandShape = any> {
  rules: MachineConfig<TCommand>;
  //   _transition: (
  //     _current: Rules<TCommand>,
  //     state: AbsoluteStatePath,
  //     target: StatePath
  //   ) => AbsoluteStatePath;
  //   _target: (
  //     _current: Rules<TCommand>,
  //     state: RelativeStatePath
  //   ) => Rules<TCommand>;
  //   _targetAbsolute: (state: AbsoluteStatePath) => Rules<TCommand>;
  emit: (
    absoluteStateId: StateId,
    // action: string,
    payload: TCommand
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
// export type MachineCtor<TCommand extends PayloadShape> = {
//   new (rules: Rules<TCommand>): Machine<TCommand>;
// };

/**
 * Create a new Machine object.
 *
 * @todo Add onTransition option.
 */
export const createMachine = function <TCommand extends CommandShape>(
  config: MachineConfig<TCommand>
): Machine<TCommand> {
  const machine = {
    rules: config,
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
    emit: (absoluteStateId: StateId, payload: TCommand) => {
      /** @todo Look for a way to 'enforce' absoluteStateId beyond asking nicely. */
      const statePath = toStatePath(absoluteStateId) as AbsoluteStatePath;
      //   const _current = this._targetAbsolute(state);

      let current: Rules<TCommand> = config;
      let handler: Action<TCommand> | undefined = undefined;

      for (let i = 0, depth = statePath.length; i < depth; i++) {
        const exists = current.states?.[statePath[i]];
        if (exists) {
          current = exists;
        } else {
          throw new Error(
            `Invalid path : ${absoluteStateId} does not exist in ${config.id} !`
          );
        }
        /**
         * Latch on deepest available command handler if any.
         *
         * @todo Check if asserting TCommand['command'] is fine or if TS has reasons
         *       to be dubious about it.
         */
        handler =
          current.on?.[payload.command as TCommand['command']] ?? handler;
      }

      if (handler) {
        const target = handler(payload);
        return target
          ? toStateId(config.id, transition(config, current, statePath, target))
          : absoluteStateId;
      }
      return absoluteStateId;
    },
  };

  return machine;
};
/**
 *
 */
function targetByAbsolutePath<TCommand extends CommandShape>(
  top: Rules<TCommand>,
  target: AbsoluteStatePath
): Rules<TCommand> {
  let state: Rules<TCommand> = top;

  for (let i = 0, depth = target.length; i < depth; i++) {
    const exists = state.states?.[target[i]];
    if (exists) {
      state = exists;
    } else {
      throw new Error(
        `${target[i]} does not exist in ${i ? target[i - 1] : 'top level'} !`
      );
    }
  }
  return state;
}

/**
 *
 */
function targetByRelativePath<TCommand extends CommandShape>(
  from: Rules<TCommand>,
  target: RelativeStatePath
): Rules<TCommand> {
  const state = from.states?.[target];
  if (!state) {
    throw new Error(`${target} does not exist in ${JSON.stringify(from)} !`);
  }
  return state;
}

/**
 *
 */
function transition<TCommand extends CommandShape>(
  top: Rules<TCommand>,
  from: Rules<TCommand>,
  fromPath: AbsoluteStatePath,
  target: StatePath
): AbsoluteStatePath {
  from.exit?.({ command: 'exit' });

  let _new, newState;

  if (Array.isArray(target)) {
    _new = targetByAbsolutePath(top, target);
    newState = target;
  } else {
    _new = targetByRelativePath(from, target);
    newState = [...fromPath, target];
  }

  _new.entry?.({ command: 'entry' });

  /**
   * @todo fire whatever is registered as .onTransition here.
   */
  return _new.initial ? transition(top, _new, newState, _new.initial) : newState;
}

/**
 * @todo Hook factory.
 */

/**
 *
 * @todo Selector that return a delimiter joined version of AbsolutePath.
 */

type WithDispatch = { dispatch: {} };
type TestCommand = WithDispatch &
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

const AnotherRuleSet: MachineConfig<TestCommand> = {
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

const testMachine = createMachine(AnotherRuleSet);
const testMachineD = createMachine<TestCommand>({
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
});

// const actionTest: Action<TesTCommand> = (payload) => {
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

// const AnotherRuleSet: Rules<TesTCommand> = {
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
