import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import _ from "lodash";
import {useSnapshotsStore} from "src/snapshots/stores/SnapshotsStore";
import {useSnapshotsService} from "src/snapshots/services/SnapshotsService";

export class SaveWarcCommand implements Command<string> {

  constructor(public id: string, public url: string) {
  }

  async execute(): Promise<ExecutionResult<string>> {

    console.log("executing save warc command");
    const tabs: chrome.tabs.Tab[] = await chrome.tabs.query({currentWindow: true})

    const tabcandidates = _.filter(tabs, (t: chrome.tabs.Tab) => t?.url === this.url)
    if (tabcandidates.length > 0) {
      console.log("about to capture Web Archive")

      const chromeTab = tabcandidates[0]

      chrome.tabs.sendMessage(
        chromeTab.id || 0,
        "getExcerpt",
        {},
        async (res) => {
          console.log("getContent returned result with length", res?.html?.length, chromeTab.id)
          // let html = await ContentUtils.setBaseHref(tabCandidates[0].url || '', res.content)
          let html = res.html
          return useSnapshotsService().warcFrom(html)
            .then((res: any) => {
              console.log("res", res, typeof res)
              console.log("res2", typeof res.data)

              useSnapshotsService().saveWarc(this.id, chromeTab.url || '', res.data)
              // useSnapshotsService().saveHTML(this.saveAsId, this.chromeTab.url || '', html, this.remark)

              return new ExecutionResult(
                "done",
                "Warc created")
            }).catch((err: any) => {
              console.warn("got error: ", err)
              //return handleError(err)
            })


        })



      return new ExecutionResult("trying to save", "trying to save")
    } else {
      // console.debug(`did not contain wanted url ${this.url}:\n - ${_.join(_.map(tabs, (t: chrome.tabs.tab) => t.url), ',\n')}`)
      return Promise.reject("no candidate found")
    }
  }

}

SaveWarcCommand.prototype.toString = function cmdToString() {
  return `SaveWarcCommand: {id=${this.id}, url=${this.url}}`;
};
