import { range } from 'lodash'

export default {
  data: () => ({
    canvasWidth: 300,
    canvasHeight: 150,
    dragStart: null,
    dragEnd: null,
    mouseState: [],
    keysState: [],
  }),
  computed: {
    xCount() {
      return this.xEnd - this.xStart
    },
    pxPerX() {
      return this.canvasWidth / this.xCount
    },
    yCount() {
      return this.yEnd - this.yStart
    },
    pxPerY() {
      return this.canvasHeight / this.yCount
    },
    contexts() {
      return this.canvases.map(c => c.getContext('2d'))
    },
  },
  mounted() {
    this.sizeCanvases()
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('resize', this.sizeCanvases)
    window.addEventListener('mouseup', this.onMouseUp)
    window.addEventListener('mousemove', this.onMouseMove)
    // Keys won't be cleared if user changes focus before releasing a key so we need this
    window.addEventListener('blur', this.clearKeysState)
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('resize', this.sizeCanvases)
    window.removeEventListener('mouseup', this.onMouseUp)
    window.removeEventListener('mousemove', this.onMouseMove)
    window.removeEventListener('blur', this.clearKeysState)
  },
  methods: {
    pxOfX(x) {
      return (x - this.xStart) * this.pxPerX
    },
    pxOfY(y) {
      return (y - this.yStart) * this.pxPerY
    },
    onKeyDown(e) {
      if (!this.keysState.includes(e.key)) this.keysState.push(e.key)
      this.keyDown(e)
    },
    onKeyUp(e) {
      const index = this.keysState.indexOf(e.key)
      if (index !== -1) this.keysState.splice(index, 1)
    },
    clearKeysState(e) {
      this.keysState.splice(0)
    },
    onMouseDown(e) {
      if (!this.mouseState.includes(e.button)) this.mouseState.push(e.button)

      const x = e.offsetX
      const y = e.offsetY

      this.dragStart = { x, y }
      this.dragEnd = { x, y }

      this.mouseDown(e)

      this.render()
    },
    onMouseUp(e) {
      const index = this.mouseState.indexOf(e.button)
      if (index !== -1) this.mouseState.splice(index, 1)
      this.mouseUp(e)
      this.dragStart = null
      this.dragEnd = null
      this.render()
    },
    onMouseMove(e) {
      const { x, y } = this.getMousePosition(e)

      if (this.dragStart) this.dragEnd = { x, y }

      if (this.mouseState.includes(2) && this.mouseState.length === 1) {
        this.pan({
          x: -e.movementX / this.pxPerX,
          y: -e.movementY / this.pxPerY,
        })
      }

      const snappedX = this.xSnap ? Math.round(x / this.xSnap) * this.xSnap : x
      const snappedY = this.ySnap ? Math.round(y / this.ySnap) * this.ySnap : y

      this.mouseMove({ x: snappedX, y: snappedY, e })

      this.render()
    },
    getMousePosition(e) {
      var rect = this.canvases[0].getBoundingClientRect()
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    },
    onWheel(e) {
      this.zoom({
        x: e.deltaX / 100,
        y: e.deltaY / 100,
        xOrigin: e.offsetX / this.canvasWidth,
        yOrigin: e.offsetY / this.canvasHeight,
      })
    },
    pxToXY(pxX, pxY) {
      return [this.pxToX(pxX), this.pxToY(pxY)]
    },
    pxToX(pxX) {
      return pxX / this.pxPerX + this.xStart
    },
    pxToY(pxY) {
      return pxY / this.pxPerY + this.yStart
    },
    sizeCanvases() {
      const styles = getComputedStyle(this.canvases[0])
      const w = parseInt(styles.getPropertyValue('width'), 10)
      const h = parseInt(styles.getPropertyValue('height'), 10)

      this.canvases.forEach(canvas => {
        canvas.width = w
        canvas.height = h
      })

      this.canvasWidth = w
      this.canvasHeight = h

      this.render()
    },
  },
}
