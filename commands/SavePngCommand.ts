import Command from "src/core/domain/Command";
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import _ from "lodash";
import {useSnapshotsService} from "src/snapshots/services/SnapshotsService";

export class SavePngCommand implements Command<string> {

  constructor(public id: string, public url: string) {
  }

  async execute(): Promise<ExecutionResult<string>> {
    console.log("executing save png command");
    return chrome.tabs.query({currentWindow: true})
      .then((tabs: chrome.tabs.Tab[]) => {
        const tabCandidates = _.filter(tabs, (t: chrome.tabs.Tab) => t?.url === this.url)
        if (tabCandidates.length > 0) {
          console.log("about to capture png")

          const chromeTab = tabCandidates[0]

          chrome.tabs.sendMessage(
            chromeTab.id || 0,
            "getExcerpt",
            {},
            async (res) => {
              console.log("getContent returned result with length", res?.html?.length, chromeTab.id)
              // let html = await ContentUtils.setBaseHref(tabCandidates[0].url || '', res.content)
              let html = res.html
              return useSnapshotsService().screenshotFrom(html)
                .then((res: any) => {
                  console.log("res", res, typeof res)
                  console.log("res2", typeof res.data)

                  useSnapshotsService().savePng(this.id, chromeTab.url || '', res.data)
                  // useSnapshotsService().saveHTML(this.saveAsId, this.chromeTab.url || '', html, this.remark)

                  return new ExecutionResult(
                    "done",
                    "Snapshot created")
                }).catch((err: any) => {
                  console.warn("got error: ", err)
                  //return handleError(err)
                })


            })


          return new ExecutionResult("trying to save", "saving image...")
        } else {
          // console.debug(`did not contain wanted url ${this.url}:\n - ${_.join(_.map(tabs, (t: chrome.tabs.Tab) => t.url), ',\n')}`)
          return Promise.reject("no candidate found")
        }
      })
      .catch((err) => {
        return Promise.reject(err)
      })
  }

}

SavePngCommand.prototype.toString = function cmdToString() {
  return `SavePngCommand: {id=${this.id}, url=${this.url}}`;
};
