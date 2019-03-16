// OBXD WAM Processor
// Jari Kleimola 2017-18 (jari@webaudiomodules.org)

class OBXDAWP extends AudioWorkletGlobalScope.WAMProcessor
{
  constructor(options) {
    options = options || {}
    options.mod = AudioWorkletGlobalScope.WAM.OBXD;
    super(options);
  }
}

registerProcessor("OBXD", OBXDAWP);
