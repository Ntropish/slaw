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
      if (this.yEndProp) {
        return this.yEndProp - this.yStart
      } else {
        const aspectRatio = this.canvasWidth / this.canvasHeight
        return this.xCount / aspectRatio
      }
    },
    pxPerY() {
      return this.canvasHeight / this.yCount
    },
    contexts() {
      return this.canvases.map(c => c.getContext('2d'))
    },
    yEnd() {
      return this.yStart + this.yCount
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

      const snappedX = this.xSnap ? Math.round(x / this.xSnap) * this.xSnap : x
      const snappedY = this.ySnap ? Math.round(y / this.ySnap) * this.ySnap : y

      this.mouseDown(snappedX, snappedY)

      this.render()
    },
    onMouseUp(e) {
      const index = this.mouseState.indexOf(e.button)
      if (index !== -1) this.mouseState.splice(index, 1)

      this.dragStart = null
      this.dragEnd = null
      this.mouseUp(e)
      this.render()
    },
    onMouseMove(e) {
      const x = e.offsetX
      const y = e.offsetY

      if (this.dragStart) this.dragEnd = { x, y }

      if (this.mouseState.includes(1) && this.mouseState.length === 1) {
        this.pan({
          x: -e.movementX / this.pxPerX,
          y: -e.movementY / this.pxPerY,
        })
      }

      const snappedX = this.xSnap ? Math.round(x / this.xSnap) * this.xSnap : x
      const snappedY = this.ySnap ? Math.round(y / this.ySnap) * this.ySnap : y

      this.mouseMove(snappedX, snappedY)

      this.render()
    },
    onWheel(e) {
      console.log(e)
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
