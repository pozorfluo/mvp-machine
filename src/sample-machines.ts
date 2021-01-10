const drawerMachine = Machine({
  id: 'snackbar',
  initial: 'invisible',
  context: {
    severity: undefined,
    message: undefined,
  },
  states: {
    invisible: {
      entry: 'resetSnackbar',
      on: { SHOW: 'visible' },
    },
    visible: {
      entry: 'setSnackbar',
      on: { HIDE: 'invisible' },
      after: {
        // after 5 seconds, transition to invisible
        3000: 'invisible',
      },
    },
  },
});

const CalendarsMachine = Machine({
  id: 'Calendars',
  initial: 'IDLE',
  states: {
    IDLE: {
      on: {
        fetchData: 'FETCHING_CALENDARS',
      },
    },
    FETCHING_CALENDARS: {
      initial: 'LOADING',
      entry: function fetchData() {
        try {
          console.log('fetching data');
          console.log('emit : success');
        } catch (e) {
          console.log('emit : failure');
        }
      },
      on: {
        cancel: 'IDLE',
      },
      states: {
        LOADING: {
          on: {
            success: '#Calendars.FETCHING_EVENTS',
            failure: 'FAILURE',
          },
        },
        FAILURE: {
          entry: function showError() {
            console.log('error fetching calendars');
          },
          on: {
            retry: 'LOADING',
            abort: '#Calendars.FAILURE',
          },
        },
      },
    },
    FETCHING_EVENTS: {
      initial: 'LOADING',
      on: {
        cancel: 'IDLE',
      },
      states: {
        LOADING: {
          entry: function fetchData() {
            try {
              console.log('fetching data');
              console.log('emit : success');
            } catch (e) {
              console.log('emit : failure');
            }
          },
          on: {
            success: '#Calendars.DISPLAY',
            failure: 'FAILURE',
          },
        },
        FAILURE: {
          on: {
            retry: 'LOADING',
          },
        },
      },
    },
    DISPLAY: {
      id: 'display',
      initial: 'IDLE',
      on: {
        refresh: 'FETCHING_CALENDARS',
      },
      states: {
        IDLE: {
          on: {
            edit: 'EDITING',
          },
        },
        EDITING: {
          on: {
            cancel: 'IDLE',
          },
        },
      },
    },
    FAILURE: {
      entry: function showError() {
        console.log('error');
      },
    },
  },
});

const CalendarsMachine = Machine({
  id: 'Calendars',
  initial: 'IDLE',
  states: {
    IDLE: {
      on: {
        fetchData: 'FETCHING_CALENDARS',
      },
    },
    FETCHING_CALENDARS: {
      initial: 'LOADING',
      on: {
        cancel: 'IDLE',
      },
      states: {
        LOADING: {
          entry: function fetchData() {
            try {
              console.log('fetching data');
              console.log('emit : success');
            } catch (e) {
              console.log('emit : failure');
            }
          },
          on: {
            success: '#Calendars.FETCHING_EVENTS',
            failure: 'FAILURE',
          },
        },
        FAILURE: {
          on: {
            restart: 'LOADING',
          },
        },
      },
    },
    FETCHING_EVENTS: {
      initial: 'LOADING',
      on: {
        cancel: 'IDLE',
      },
      states: {
        LOADING: {
          entry: function fetchData() {
            try {
              console.log('fetching data');
              console.log('emit : success');
            } catch (e) {
              console.log('emit : failure');
            }
          },
          on: {
            success: '#Calendars.DISPLAY',
            failure: 'FAILURE',
          },
        },
        FAILURE: {
          on: {
            restart: 'LOADING',
          },
        },
      },
    },
    DISPLAY: {
      id: 'display',
      initial: 'IDLE',
      on: {
        refresh: 'FETCHING_CALENDARS',
      },
      states: {
        IDLE: {
          on: {
            edit: 'EDITING',
          },
        },
        EDITING: {
          on: {
            cancel: 'IDLE',
          },
        },
      },
    },
  },
});

const createSubredditMachine = Machine({
  initial: 'loading',
  states: {
    loading: {
      invoke: {
        id: 'fetch-subreddit',
        src: invokeFetchSubreddit,
        onDone: {
          target: 'loaded',
          actions: assign({
            posts: (_, event) => event.data,
            lastUpdated: () => Date.now(),
          }),
        },
        onError: 'failure',
      },
    },
    loaded: {
      on: {
        REFRESH: 'loading',
      },
    },
    failure: {
      on: {
        RETRY: 'loading',
      },
    },
  },
});

const fetchyMachine = Machine({
  id: 'fetchy',
  initial: 'LOADING',
  states: {
    // IDLE: {
    //   on: {
    //     fetchData: 'LOADING',
    //   },
    // },
    LOADING: {
      entry: function fetchData() {
        try {
          console.log('fetching data');
          console.log('emit : loaded');
        } catch (e) {
          console.log('emit : failure');
        }
      },
      on: {
        success: 'LOADED',
        failure: 'FAILURE',
      },
    },
    LOADED: {
      on: {
        refresh: 'LOADING',
      },
    },
    FAILURE: {
      on: {
        restart: 'LOADING',
      },
    },
  },
});

// const fetchyMachine = Machine({
//     id: 'fetchy',
//     initial: 'IDLE',
//     states: {
//       IDLE: {
//         on: {
//           fetchWillSucceed: {
//             target: 'LOADING',
//             // send the TOGGLE event again to the service
//             actions: send('succeed')
//           },
//           fetchWillFail: {
//             target: 'LOADING',
//             // send the TOGGLE event again to the service
//             actions: send('fail')
//           }
//         }
//       },
//       LOADING: {
//         on: {
//           succeed: 'DISPLAY',
//           fail: 'FAILURE'
//         }
//       },
//       FAILURE: {
//         on: {
//           restart: 'IDLE'
//         }
//       },
//       DISPLAY: {
//         on: {
//           restart: 'IDLE'
//         }
//       }
//     }
//   });
