# Slaw

Slaw is currently the beginnings of an open source, cross platform DAW. The intent is to make a tool
that's far better suited to the job of making music than traditional DAWs. It will do this, first, by
providing a high speed midi editor and, second, by leveraging the power of a node editor to allow
for more dynamic and creative ways of generating sound. These interface choices diverge from the more hardware-like
interfaces seen in traditional DAWs but seem like they will be far more effective.

Slaw was initially created on electron and is currently being developed against Chrome. Because
the Web Audio API used by Slaw is fairly new and primarily driven by Chrome support for other browsers
is being held off for later.

Saving is currently done to local storage whenever a change is made.

## Controls

Controls are changing very frequently right now, but experiment with `ctrl`, `shift`, and `alt`.

Play with `space`, pause with `s`

`left click` to pan

`middle click` or `mouse scroll` to zoom

`ctrl click` to add notes, alt click to remove them

Drag node types onto the node graph to add them, alt click to remove them

box select by holding `shift` and dragging

Quantize selected notes with `q`

Resize by holding `a` and dragging
