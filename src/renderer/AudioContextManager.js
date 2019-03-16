// import { MyWorkletNode } from '../nodes/MyWorkletNode'
// import { PortWorkletNode, processors } from '../nodes/PortProcessor'

// export default function buildContext({ nodes }) {
//   const context = new AudioContext()
//   const processors = []

//   async function loadModule(moduleSpecifier) {
//     const moduleToLoad = import(moduleSpecifier)
//     for (const processor of moduleToLoad.processors) {
//       if (processors.includes(processor)) continue
//       await context.audioWorklet.addModule(processor)
//       processors.push(processor)
//     }
//   }
//   return {
//     context,
//     loadModule,
//   }
// }

// .then(() => {
//   let node = new MyWorkletNode(context)
// })
