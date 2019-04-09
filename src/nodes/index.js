import ADSR from './ADSR'
import DestinationFactory from './Destination'
import EventTrackFactory from './EventTrack'
import SinFactory from './Sin'
import Parameter from './Parameter'
import Gain from './Gain'
import Curve from './Curve'

export default {
  adsr: ADSR,
  destination: DestinationFactory,
  track: EventTrackFactory,
  sin: SinFactory,
  parameter: Parameter,
  gain: Gain,
  curve: Curve,
}

export const interfaces = {}
