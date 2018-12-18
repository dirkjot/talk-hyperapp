import { h, app } from "./hyperapp"

app(
  // state
  {
    message: "Hi "
  },
  // actions
  {},
  // view
  state => h("h1", {}, state.message, "Dirk"), 
  // container
  document.getElementById('target')
)

