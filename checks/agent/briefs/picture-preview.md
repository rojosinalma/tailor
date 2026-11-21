<!-- kit: html -->

Use the HTML kit.

I need a page where I upload a drawing file (an SVG or a PNG) and see the picture it turns into, with a few
options next to it: the output size (small, medium, large), a background (none, white, checkered), and a
Render button. The picture can be large and must stay fully visible; a long file name must not break the page.
While it renders, show that it is busy; if it fails, say why.

There is no server yet. Stand in for it in the page's own script: wait a second, then answer with a picture
(draw one on a canvas, or use the uploaded file itself). A file name that contains "fail" makes it fail.
