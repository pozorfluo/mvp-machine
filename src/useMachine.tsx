import { useSelector } from 'react-redux';
import { useEffect, useRef } from 'react';

import { useAppDispatch } from '@focus-front/core/web';
import { calendarsStatusSelector } from '@focus-front/core';

const rules = {};

/**
 * @see https://reactjs.org/docs/hooks-faq.html#how-to-create-expensive-objects-lazily
 * @see https://github.com/reduxjs/react-redux/blob/e9094e7800e7b464d1221d26714454291f8a9730/src/hooks/useDispatch.js
 *      for createSomeHook(...) example.
 */
// export function createMachineHook(...) {
function useMachine() {
  const dispatch = useAppDispatch();
  const status = useSelector(calendarsStatusSelector);
  /** Without redux. */
  //   const [status, setStatus] = useState([rules.initial]);

  /** Initialize once. */
  const machineRef = useRef(null);
  if (machineRef.current === null) {
    /**
     * @see https://github.com/reduxjs/react-redux/issues/1468
     *      for instance where dispatch might not be stable.
     *      This is most likely a big no-no for isomorphic app.
     */
    machineRef.current = new Machine(rules, {
      /** Without redux. */
      //   onTransition: (state) => setStatus(state),
      onTransition: (state) => dispatch(setCalendarsStatus(state)),
      /** How to make dispatch/context available to machine, if/when it needs it ? */
      context: {
        store,
        dispatch,
      },
    });
    /** Store initial state as AbsolutePath.*/
    dispatch(setCalendarsStatus([rules.initial]));
  }

  const machine = machineRef.current;

  function emitWrapper(action: string, ...payload: unknown[]) {
    machine.emit(status, action, payload);
  }

  return [status, emitWrapper];
}

//   return useMachine;
// }

// export const useMachine = createMachineHook();
