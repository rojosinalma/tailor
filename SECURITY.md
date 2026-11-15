# Security

Report a vulnerability through GitHub's private reporting on this repository ("Security" → "Report a
vulnerability"). Do not open a public issue for it.

The latest release gets fixes. Tailor is a UI framework without a server; the parts that handle untrusted
input are the Markdown view (its output always goes through a sanitiser) and the `tailor` command (it
writes only inside the project folder it is run in).
