<!-- kit: react -->

Use the React kit.

A list of my backup jobs. Each job has a name (such as nas-photos or db-1-nightly), the host it backs up,
its status (ok, failed, running, never run), when it last ran, when it runs next, and the size of the last
backup. Each row has a Run button: it starts the job, the row shows it running, and after a few seconds it is
ok again. I want to find a job by name and see only the failed ones. About fifteen jobs; make two of them fail.

There is no server: keep the jobs in the page and fake the run with a timer.
