import { h, app } from "./hyperapp"



// DEMO 1: A simple app with JSX
// app( // state, actions, view, container
//   { message: 'Hi'},
//   {},
//   (state, actions) => (<h1>{state.message} Audience</h1>),
//   document.getElementById('target')
// )


// DEMO 2: Same app using 'h'
// app(
//   { message: 'Hi'},
//   {},
//   function (state, actions) { return  h("h1", {}, state.message, " Audience")},
//   document.getElementById('target')
// )





// DEMO 3: Counters

const CounterComponent = ({counterName })   => (state, actions) => {
    return (
      <div name={counterName}>
        <h3>{counterName} = {state[counterName].count}</h3>
        <button 
          onclick={() => actions.downCounter({counterName})} 
          disabled={state[counterName].count <= 0}>
        ー</button>
        <button 
          onclick={()=>actions.upCounter({counterName})}>
        +</button>
  </div>)}

const state = {
      message: 'Hello',
      hours: { count: 2},
      minutes: { count: 10}
}

const actions = {  
  upCounter: ({counterName, value = 1}) => state =>
    ({[counterName]: { count:  state[counterName].count + value }}),
  downCounter:  ({counterName, value = 1}) => state =>
    ({[counterName]: { count:  state[counterName].count - value }})
  }

const view = (state, actions) => {
    return (<main>
        <h1>{state.message} Audience</h1>  
        <CounterComponent counterName="hours"></CounterComponent>
        {/* <CounterComponent counterName="minutes"></CounterComponent> */}
  </main>)
}

app(
  state,
  actions,
  view,
  document.getElementById('target')
)

