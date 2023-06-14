**In progress:**
* update run setup screen
  * add hover over question mark icons with info on settings
  * add option for timeout on run
  * add chromium path input
  * move less important options to secondary menu (dropdown?)
* add real time statistics as run progresses

**Backend:**
  * catch up on unit tests
  * add run timeout logic

**Frontend:**
  * update run in progress screen
    * add real time progress bar
  * update run complete screen
    * add statistics from the run

**Viewbot**
  * selector seems to fail alot on search results
  * add screen interaction option (clicking start/stop, refreshes, etc.)


***FROM PR 2***
TODO later:
* validate form fields
* remove whitespace present in large text box
* add reset button to first page (red) and color submit button (green?)
* figure out why proxies aren't looping back to the start
* fix "start" being printed after the first proxy is displayed
* 'update' is displayed as a proxy when a re-run occurs
* make 3rd page look pretty 
    * view time isn't adding up correctly 
    * display total run times (s, m, hrs)
    * display proxy success rate percentage
    * number of successes