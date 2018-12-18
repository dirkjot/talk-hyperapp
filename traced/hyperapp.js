// HYPER APP SOURCE CODE
//
// Taken from GitHub repo on Dec 16, 2018
// Original commit sha:  61addd8d1ce1436b8c8d601e010cfb89dbd3eae2
//
// This version of the source code has been slightly modified and comments
// have been added. 


// h - Main function to create virtual dom element
//
// example:
//   const node = h("div", { class: "main" }, "Hello World")
//
export function h(name, attributes) {
  var rest = []
  var children = []
  var length = arguments.length

  while (length-- > 2) {
    // extra arguments are potential children 
    rest.push(arguments[length])
  }

  while (rest.length) {
    // loop over rest args (potential children)
    var node = rest.pop()
    if (node && node.pop) {
      // JSX: if child arg is array, push its children to `rest`
      for (length = node.length; length--;) {
        rest.push(node[length])
      }
    } else if (node != null && node !== true && node !== false) {
      // if node is an element, add child 
      // JSX: exclude booleans so you can do:  hideButton || h("button")
      children.push(node)
    }
  }

  if (typeof name === "function") {
    // if h was called with a function, execute it
    return name(attributes || {}, children)
  }
  else {
    // return vdom node
    return {
      nodeName: name,
      attributes: attributes || {},
      children: children,
      key: attributes && attributes.key
    }
  }
}

// app - MAIN function to create a hyperapp
// 
// arguments:
// - initial state 
// - map of actions
// - html view to return
// - container in current page to attach view to
//
export function app(state, actions, view, container) {
  console.log("Hyper app initializing")
  var map = [].map
  var rootElement = (container && container.children[0]) || null
  var oldNode = rootElement && recycleElement(rootElement)
  var lifecycle = []
  var skipRender
  var isRecycling = true
  var globalState = clone(state)
  var wiredActions = wireStateToActions([], globalState, clone(actions))

  scheduleRender()

  return wiredActions

  // recycleElement - create vdom node for actual element 
  // creates a vdom node which has a recursive copy of all text nodes under this element
  // 
  // Used to replace container in current page with hyperapp view
  //
  function recycleElement(element) {
    return {
      nodeName: element.nodeName.toLowerCase(),
      attributes: {},
      children: map.call(element.childNodes, function (element) {
        return element.nodeType === 3 // Node.TEXT_NODE
          ? element.nodeValue
          : recycleElement(element)
      })
    }
  }


  // resolveNode - resolve all pending actions and remove empty branches
  // 
  // Recursively traverse node, replacing all functions with their results 
  // and all null nodes with empty string ("")
  // 
  function resolveNode(node) {
    return typeof node === "function"
      ? resolveNode(node(globalState, wiredActions))
      : node != null
        ? node
        : ""
  }

  function render() {
    console.log("Render called, lifecycle:", lifecycle)
    skipRender = !skipRender

    var node = resolveNode(view)

    if (container && !skipRender) {
      rootElement = patch(container, rootElement, oldNode, (oldNode = node))
    }

    isRecycling = false

    while (lifecycle.length) lifecycle.pop()()
  }

  // scheduleRender - schedule a render pass if not already scheduled
  function scheduleRender() {
    if (!skipRender) {
      skipRender = true
      setTimeout(render)
    }
  }

  // clone - create new js object from target and source
  // similar to Object.asign
  //
  function clone(target, source) {
    var out = {}

    for (var i in target) out[i] = target[i]
    for (var i in source) out[i] = source[i]

    return out
  }

  // setPartialState - Create updated copy of store with old values as defaults
  // 
  // Return an updated copy of store (state) after making update on path
  // take old values from source if new value does not supply them.
  // 
  // Only application in wireStatetoActions: 
  //    globalState = setPartialState(path,  clone(state, result),  globalState)
  // 
  function setPartialState(path, value, source) {
    console.log('setPartialState', path, value, source)
    var target = {}
    if (path.length) {
      target[path[0]] =
        path.length > 1
          ? setPartialState(path.slice(1), value, source[path[0]])
          : value
      return clone(source, target)
    }
    return value
  }

  // get namespaced part of store
  function getPartialState(path, source) {
    var i = 0
    while (i < path.length) {
      source = source[path[i++]]
    }
    return source
  }

  // wireStateToActions - prepare actions for store
  //
  // Example:
  //    const actions = {
  //      counter: {
  //        down: value => state => ({ count: state.count - value }),
  //        up: value => state => ({ count: state.count + value })
  //      }
  //    }
  //
  // from app:
  //    var wiredActions = wireStateToActions([], globalState, clone(actions))

  function wireStateToActions(path, state, actions) {
    for (var key in actions) {
      if (typeof actions[key] === "function") {
        // uses anonymous function + argument to simplify the loop 
        (function (key, action) {
          actions[key] = function (data) {
            var result = action(data)

            if (typeof result === "function") {
              // if executing the action returns a function, execute it with local state and actions as params
              result = result(getPartialState(path, globalState), actions)
            }
            // if we have a delta, schedule a render and update 'globalState' var
            if (
              result &&
              result !== (state = getPartialState(path, globalState)) &&
              !result.then // !isPromise
            ) {
              // update global state with the union of our action's result and the original local state, 
              // use the old globalState as a fallback for any unspecified keys and paths
              scheduleRender(
                (globalState = setPartialState(
                  path,
                  clone(state, result),
                  globalState
                ))
              )
            }
            return result
          }
        })(key, actions[key])
      } else {
        // we have a namespace part: recurse
        wireStateToActions(
          path.concat(key),
          (state[key] = clone(state[key])),
          (actions[key] = clone(actions[key]))
        )
      }
    }
    return actions
  }

  // helper function for keyed dom elements, returns the key or null if node 
  // does not exist
  function getKey(node) {
    return node ? node.key : null
  }

  // helper function for event listening:  use the 'events' map on the element 
  // to run the right listener, with the invoked event as its argument
  function eventListener(event) {
    return event.currentTarget.events[event.type](event)
  }

  function updateAttribute(element, name, value, oldValue, isSvg) {
    if (name === "key") {
    } else if (name === "style") {
      if (typeof value === "string") {
        element.style.cssText = value
      } else {
        if (typeof oldValue === "string") oldValue = element.style.cssText = ""
        for (var i in clone(oldValue, value)) {
          var style = value == null || value[i] == null ? "" : value[i]
          if (i[0] === "-") {
            element.style.setProperty(i, style)
          } else {
            element.style[i] = style
          }
        }
      }
    } else {
      if (name[0] === "o" && name[1] === "n") {
        // event listener, starts with 'on'
        name = name.slice(2)

        if (element.events) {
          if (!oldValue) oldValue = element.events[name]
        } else {
          element.events = {}
        }

        element.events[name] = value

        if (value) {
          if (!oldValue) {
            element.addEventListener(name, eventListener)
          }
        } else {
          element.removeEventListener(name, eventListener)
        }
      } else if (
        // existing attribute, not special
        name in element &&
        name !== "list" &&
        name !== "type" &&
        name !== "draggable" &&
        name !== "spellcheck" &&
        name !== "translate" &&
        !isSvg
      ) {
        element[name] = value == null ? "" : value
      } else if (value != null && value !== false) {
        // otherwise
        element.setAttribute(name, value)
      }

      if (value == null || value === false) {
        element.removeAttribute(name)
      }
    }
  }

  function createElement(node, isSvg) {
    console.log('createElement', node)
    var element =
      typeof node === "string" || typeof node === "number"
        ? document.createTextNode(node)
        : (isSvg = isSvg || node.nodeName === "svg")
          ? document.createElementNS(
            "http://www.w3.org/2000/svg",
            node.nodeName
          )
          : document.createElement(node.nodeName)

    var attributes = node.attributes
    if (attributes) {
      if (attributes.oncreate) {
        lifecycle.push(function () {
          attributes.oncreate(element)
        })
      }

      for (var i = 0; i < node.children.length; i++) {
        element.appendChild(
          createElement(
            (node.children[i] = resolveNode(node.children[i])),
            isSvg
          )
        )
      }

      for (var name in attributes) {
        updateAttribute(element, name, attributes[name], null, isSvg)
      }
    }

    return element
  }

  function updateElement(element, oldAttributes, attributes, isSvg) {
    // console.log("updateElement", element, attributes)
    for (var name in clone(oldAttributes, attributes)) {
      if (
        attributes[name] !==
        (name === "value" || name === "checked"
          ? element[name]
          : oldAttributes[name])
      ) {
        updateAttribute(
          element,
          name,
          attributes[name],
          oldAttributes[name],
          isSvg
        )
      }
    }

    var cb = isRecycling ? attributes.oncreate : attributes.onupdate
    if (cb) {
      lifecycle.push(function () {
        cb(element, oldAttributes)
      })
    }
  }

  function removeChildren(element, node) {
    var attributes = node.attributes
    if (attributes) {
      for (var i = 0; i < node.children.length; i++) {
        removeChildren(element.childNodes[i], node.children[i])
      }

      if (attributes.ondestroy) {
        attributes.ondestroy(element)
      }
    }
    return element
  }

  function removeElement(parent, element, node) {
    console.log("removeElement", element, node)
    function done() {
      parent.removeChild(removeChildren(element, node))
    }

    var cb = node.attributes && node.attributes.onremove
    if (cb) {
      cb(element, done)
    } else {
      done()
    }
  }


  // patch -- change the actual dom to reflect our vdom
  // only called from render and recursively
  // 
  // args: 
  // - parent: element to attach view to
  // - rootElement: top level vdom
  // - oldNode:  vdom element to be updated
  // - node: replacement vdom element
  // - flag to signal SVG element
  // 
  // call from render:
  //    rootElement = patch(container, rootElement, oldNode, node, false)  
  // In render, oldNode is 'recycleElement(container)', 
  //  and node is 'resolveNode(view)'
  // 
  function patch(parent, element, oldNode, node, isSvg) {
    if (node === oldNode) {
      // do nothing if no changes
    } else if (oldNode == null || oldNode.nodeName !== node.nodeName) {
      console.log("patch - new", element, node)
      // new node introduced (first render?) or node type changed
      var newElement = createElement(node, isSvg)
      parent.insertBefore(newElement, element)

      if (oldNode != null) {
        removeElement(parent, element, oldNode)
      }

      element = newElement
    } else if (oldNode.nodeName == null) {
      console.log("patch - nodevalue", element, node)
      // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeValue
      element.nodeValue = node
    } else {
      // the heart of patch, 
      // 1. update the element
      console.log("patch - update", element, node)
      updateElement(
        element,
        oldNode.attributes,
        node.attributes,
        (isSvg = isSvg || node.nodeName === "svg")
      )

      var oldKeyed = {}
      var newKeyed = {}
      var oldElements = []
      var oldChildren = oldNode.children
      var children = node.children
      
      // 2. recursively copy old keyed children
      for (var i = 0; i < oldChildren.length; i++) {
        oldElements[i] = element.childNodes[i]

        var oldKey = getKey(oldChildren[i])
        if (oldKey != null) {
          oldKeyed[oldKey] = [oldElements[i], oldChildren[i]]
        }
      }
      
      // console.log('keys', oldKeyed)

      var i = 0
      var k = 0

      while (k < children.length) {
        var oldKey = getKey(oldChildren[i])
        var newKey = getKey((children[k] = resolveNode(children[k])))

        if (newKeyed[oldKey]) {
          i++
          continue
        }

        if (newKey != null && newKey === getKey(oldChildren[i + 1])) {
          if (oldKey == null) {
            removeElement(element, oldElements[i], oldChildren[i])
          }
          i++
          continue
        }

        if (newKey == null || isRecycling) {
          if (oldKey == null) {
            patch(element, oldElements[i], oldChildren[i], children[k], isSvg)
            k++
          }
          i++
        } else {
          var keyedNode = oldKeyed[newKey] || []

          if (oldKey === newKey) {
            patch(element, keyedNode[0], keyedNode[1], children[k], isSvg)
            i++
          } else if (keyedNode[0]) {
            patch(
              element,
              element.insertBefore(keyedNode[0], oldElements[i]),
              keyedNode[1],
              children[k],
              isSvg
            )
          } else {
            patch(element, oldElements[i], null, children[k], isSvg)
          }

          newKeyed[newKey] = children[k]
          k++
        }
      }

      while (i < oldChildren.length) {
        if (getKey(oldChildren[i]) == null) {
          removeElement(element, oldElements[i], oldChildren[i])
        }
        i++
      }

      for (var i in oldKeyed) {
        if (!newKeyed[i]) {
          removeElement(element, oldKeyed[i][0], oldKeyed[i][1])
        }
      }
      // end of heart of patch
    }
    // patch returns the updated element
    return element
  }
}
