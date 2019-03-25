export default store => {
  window.addEventListener('mouseup', mouseup, true)
  window.addEventListener('mousedown', mousedown, true)
  window.addEventListener('keydown', keydown, true)
  window.addEventListener('keyup', keyup, true)

  function mouseup(e) {
    store.commit('REMOVE_MOUSE_BUTTON', e.button)
  }

  function mousedown(e) {
    store.commit('FOCUS_ELEMENT', e.target)
    store.commit('ADD_MOUSE_BUTTON', e.button)
  }

  function keydown(e) {
    // This application uses tab to switch modes
    // Do this to keep tab from switching to focus
    // on chrome menus
    if (e.key === 'Tab') {
      e.preventDefault()
    }
    store.commit('ADD_KEYBOARD_KEY', e.key.toLowerCase())
  }

  function keyup(e) {
    store.commit('REMOVE_KEYBOARD_KEY', e.key.toLowerCase())
  }
}
