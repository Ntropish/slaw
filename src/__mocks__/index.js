export const store = {
  state: {
    nodes: {
      testNode01: {
        data: {
          curveId: 'testCurve01',
        },
      },
      testNode02: {
        data: {
          curveId: 'testCurve02',
        },
      },
    },
    curves: {
      testCurve01: {
        points: [
          {
            beat: 0,
            value: 0,
          },
          {
            beat: 1,
            value: 1,
          },
          {
            beat: 2.3,
            value: 0,
          },
        ],
      },
      testCurve02: {
        points: [
          {
            beat: 2,
            value: 1,
          },
          {
            type: 0,
            beat: 2.1,
            value: 0.1,
          },
          {
            beat: 2.3,
            value: 0,
          },
        ],
      },
    },
  },
}
