<!-- kit: html -->

Use the HTML kit.

The page of my render service. At the top: the name of the service, links to Render, Examples, Queue and
About, and at the end of the bar how the service is right now ("Ready", or how many renders wait). The
Render page: I pick a drawing file and a size and a colour scheme, press Render, and see the picture it
turns into, as large as fits; I can download it. While it renders, show that it is busy; if it fails, say
why.

The server takes the form at /render and answers with the PNG itself, not with JSON; a failure is plain
text with an error status. There is no server yet: in the page's own script, answer the requests to /render
yourself (wait a second, send back a picture; a file whose name contains "fail" fails).
