import ADSR from './ADSR'
import DestinationFactory from './Destination'
import EventTrackFactory from './EventTrack'
import SinFactory from './Sin'

export default {
  adsr: ADSR,
  destination: DestinationFactory,
  track: EventTrackFactory,
  sin: SinFactory,
}

export const interfaces = {}
