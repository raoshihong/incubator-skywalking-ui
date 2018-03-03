import { query as queryService } from '../services/graphql';

export function generateModal({ namespace, dataQuery, optionsQuery, state = {},
  effects = {}, reducers = {}, subscriptions = {} }) {
  return {
    namespace,
    state: {
      variables: {
        values: {},
        labels: {},
        options: {},
      },
      data: state,
    },
    effects: {
      *initOptions({ payload }, { call, put }) {
        const { variables, reducer = undefined } = payload;
        const response = yield call(queryService, `${namespace}/options`, { variables, query: optionsQuery });
        if (reducer) {
          yield put({
            type: reducer,
            payload: response.data,
          });
        } else {
          yield put({
            type: 'saveOptions',
            payload: response.data,
          });
        }
      },
      *fetchData({ payload }, { call, put }) {
        const { variables, reducer = undefined } = payload;
        const response = yield call(queryService, namespace, { variables, query: dataQuery });
        if (reducer) {
          yield put({
            type: reducer,
            payload: response.data,
          });
        } else {
          yield put({
            type: 'saveData',
            payload: response.data,
          });
        }
      },
      ...effects,
    },
    reducers: {
      saveOptions(preState, { payload: allOptions }) {
        if (!allOptions) {
          return preState;
        }
        const { variables } = preState;
        const { values, labels, options } = variables;
        const amendOptions = {};
        const defaultValues = {};
        const defaultLabels = {};
        Object.keys(allOptions).forEach((_) => {
          const thisOptions = allOptions[_];
          if (!values[_]) {
            if (thisOptions.length > 0) {
              defaultValues[_] = thisOptions[0].key;
              defaultLabels[_] = thisOptions[0].label;
            }
            return;
          }
          const key = values[_];
          if (!thisOptions.find(o => o.key === key)) {
            amendOptions[_] = [...thisOptions, { key, label: labels[_] }];
          }
        });
        variables.options = {
          ...options,
          ...allOptions,
          ...amendOptions,
        };
        let newVariables = variables;
        if (Object.keys(defaultValues).length > 0) {
          newVariables = {
            ...variables,
            values: {
              ...values,
              ...defaultValues,
            },
            labels: {
              ...labels,
              ...defaultLabels,
            },
          };
        }
        return {
          ...preState,
          variables: newVariables,
        };
      },
      save(preState, { payload: { variables: { values = {}, options = {}, labels = {} },
        data = {} } }) {
        const { variables: { values: preValues, options: preOptions, labels: preLabels },
          data: preData } = preState;
        return {
          variables: {
            values: {
              ...preValues,
              ...values,
            },
            options: {
              ...preOptions,
              ...options,
            },
            labels: {
              ...preLabels,
              ...labels,
            },
          },
          data: {
            ...preData,
            ...data,
          },
        };
      },
      saveData(preState, { payload }) {
        const { data } = preState;
        return {
          ...preState,
          data: {
            ...data,
            ...payload,
          },
        };
      },
      saveVariables(preState, { payload: { values: variableValues, labels = {} } }) {
        const { variables: preVariables } = preState;
        const { values: preValues, lables: preLabels } = preVariables;
        return {
          ...preState,
          variables: {
            ...preVariables,
            values: {
              ...preValues,
              ...variableValues,
            },
            labels: {
              ...preLabels,
              ...labels,
            },
          },
        };
      },
      ...reducers,
    },
    subscriptions: {
      ...subscriptions,
    },
  };
}