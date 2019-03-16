# Slaw

Slaw is currently the beginnings of an open source, cross platform DAW. The intent is to make a tool
that's far better suited to the job of making music than traditional DAWs. It will do this, first, by
providing a high speed midi editor and, second, by leveraging the power of a node editor to allow
for more dynamic and creative ways of generating sound.7

Initially Slaw was being developed on Electron but after further research it seems that won't be necessary. Eventually
it will be moved to a standard web app.

Install by cloning the repository and running `yarn` or `npm install` in the root directory.

No production build process is currently available but slaw can be used in development mode with `yarn start`.

_Note: I haven't verified that all dependencies are included in the `package.json`. I might accidentally be relying on some globally available packages. Be prepared to diagnose and manually add some packages if this is the case._

## Controls

Press `tab` to toggle modes, (Midi/Split/Node Editor)

Select notes with the left mouse button, `LMB`

Select multiple notes by holding `ctrl`

Move notes by dragging them

Duplicate notes by holding `shift` before dragging

Snapping is disabled while holding `ctrl`

Add notes with `ctrl + LMB`

Remove notes with `alt + LMB`

Box select by holding `shift` and dragging

Resize notes by holding `R` and dragging

Quantize selected notes by pressing `Q`

Pan with `RMB`

Zoom with the mouse wheel
