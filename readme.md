# Slaw

Slaw is currently the beginnings of an open source, cross platform DAW. The intent is to make a tool
that's far better suited to the job of making music than traditional DAWs. It will do this, first, by
providing a high speed midi editor and, second, by leveraging the power of a node editor to allow
for more dynamic and creative ways of generating sound. These interface choices diverge from the more hardware-like
interfaces seen in traditional DAWs but seem like they will be far more effective.

Initially Slaw was being developed on Electron but after further research it seems that won't be necessary. Eventually
it will be moved to a standard web app.

Install by cloning the repository and running `yarn` or `npm install` in the root directory.

No production build process is currently available but slaw can be used in development mode with `yarn start`.

_Note: I haven't verified that all dependencies are included in the `package.json`. I might accidentally be relying on some globally available packages. Be prepared to diagnose and manually add some packages if this is the case._

## Controls

Controls are changing very frequently right now, but experiment with `ctrl`, `shift`, and `alt`.

Play with `space`, pause with `s`

`left click` to pan

`middle click` or `mouse scroll` to zoom

`ctrl click` to add notes or nodes, alt click to remove them

box select by holding `shift` and dragging

Quantize selected notes with `q`

Resize by holding `a` and dragging
