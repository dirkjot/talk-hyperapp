import { h, app } from "./hyperapp"

const CounterComponent = ({counterName })   => (state, actions) => {
    return (
      <div name={counterName}>
        <h3>{counterName} = {state[counterName].count}</h3>
        <button onclick={() => actions.downCounter({counterName})} 
            disabled={state[counterName].count <= 0}>
        ー</button>
        <button onclick={()=>actions.upCounter({counterName, value:2})}>
        +</button>
  </div>)}

const state = {
      message: 'Hello',
      hours: { count: 0},
      minutes: { count: 0}
}

const actions = {  
  upCounter: ({counterName, value = 1}) => state =>
    ({[counterName]: { count:  state[counterName].count + value }}),
  downCounter:  ({counterName, value = 1}) => state =>
    ({[counterName]: { count:  state[counterName].count - value }})
  }

const view = (state, actions) => {
    return (<main>
        <h1>{state.message} Dirk</h1>  
        <CounterComponent counterName="hours"></CounterComponent>
        <CounterComponent counterName="minutes"></CounterComponent>
  </main>)
}



// app(state, actions, view, document.body)



app(
  // state
  state,
  // actions
  actions,
  // view
  view,
  // container
  document.getElementById('target')
)

